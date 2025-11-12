import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { getPromptForAsset } from '@/lib/document-scanner-prompts'

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
    } catch (parseError) {
      console.error('Failed to parse OpenAI response:', content)
      return NextResponse.json(
        { error: 'Failed to parse extracted data', rawResponse: content },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: extractedData,
      usage: response.usage
    })

  } catch (error: any) {
    console.error('Error scanning document:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to scan document' },
      { status: 500 }
    )
  }
}

