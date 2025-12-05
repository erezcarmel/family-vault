import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { getPromptForAsset } from '@/lib/document-scanner-prompts'
import { inferSubcategory, SubcategoryInferenceResult } from '@/lib/ocr/subcategoryInference'

export async function POST(request: NextRequest) {
  // Initialize OpenAI client inside the function to avoid build-time errors
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  })
  try {
    const body = await request.json()
    const { imageBase64, category, type } = body

    if (!imageBase64 || !category || !type) {
      return NextResponse.json(
        { error: 'Missing required fields: imageBase64, category, type' },
        { status: 400 }
      )
    }

    // Get the appropriate prompt for this asset type
    const promptConfig = getPromptForAsset(category, type)
    
    if (!promptConfig) {
      return NextResponse.json(
        { error: 'No prompt configuration found for this asset type' },
        { status: 400 }
      )
    }

    // Call OpenAI Vision API
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: promptConfig.systemPrompt
        },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Please analyze this document and extract the relevant information. Return ONLY a valid JSON object with the extracted data, no additional text.'
            },
            {
              type: 'image_url',
              image_url: {
                url: imageBase64
              }
            }
          ]
        }
      ],
      max_tokens: 1000,
      temperature: 0.1, // Low temperature for more consistent extraction
    })

    const content = response.choices[0]?.message?.content

    if (!content) {
      return NextResponse.json(
        { error: 'No response from OpenAI' },
        { status: 500 }
      )
    }

    // Parse the JSON response
    let extractedData
    try {
      // Remove markdown code blocks if present
      const cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
      extractedData = JSON.parse(cleanContent)
    } catch {
      console.error('Failed to parse OpenAI response:', content)
      return NextResponse.json(
        { error: 'Failed to parse extracted data', rawResponse: content },
        { status: 500 }
      )
    }

    // Run subcategory inference on extracted text content
    const textForInference = extractTextForInference(extractedData)
    let subcategoryInference: SubcategoryInferenceResult | undefined
    
    if (textForInference) {
      subcategoryInference = inferSubcategory(textForInference)
    }

    return NextResponse.json({
      success: true,
      data: extractedData,
      subcategoryInference,
      usage: response.usage
    })

  } catch (error: unknown) {
    console.error('Error scanning document:', error)
    const errorMessage = error instanceof Error ? error.message : 'Failed to scan document'
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}

/**
 * Extract text content from the extracted data for subcategory inference.
 * Combines relevant text fields into a single string for pattern matching.
 * @param data - The data object to extract text from
 * @param depth - Current recursion depth (limited to prevent deep recursion)
 */
const MAX_EXTRACTION_DEPTH = 5

function extractTextForInference(data: Record<string, unknown>, depth = 0): string {
  if (depth >= MAX_EXTRACTION_DEPTH) {
    return ''
  }
  
  const textParts: string[] = []
  
  for (const [, value] of Object.entries(data)) {
    if (typeof value === 'string') {
      textParts.push(value)
    } else if (typeof value === 'object' && value !== null) {
      const nestedText = extractTextForInference(value as Record<string, unknown>, depth + 1)
      if (nestedText) {
        textParts.push(nestedText)
      }
    }
  }
  
  return textParts.join(' ')
}

