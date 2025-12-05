import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

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

    // Load prompt config
    const promptConfigModule = await import('../../../lib/document-scanner-prompts')
    const { documentScannerPrompts } = promptConfigModule
    const promptConfig = documentScannerPrompts.find(
      p => p.category === category && p.type === type
    ) || documentScannerPrompts[0]

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
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
      temperature: 0.1,
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

    // --- New: Normalize and try to recover full account numbers ---
    try {
      if (extractedData && extractedData.account_number) {
        const original = String(extractedData.account_number)
        const digitsOnly = original.replace(/\D/g, '') // remove non-digits

        // Helper: find candidate sequences in the raw assistant content (to recover spaced/dashed OCR)
        const findLongestDigitCandidate = (text: string) => {
          // Match digit sequences that may contain spaces or dashes, at least 5 digit-like characters when joined
          const matches = text.match(/(?:\d[ \-\/]*){5,}/g) || []
          const candidates = matches
            .map(m => m.replace(/\D/g, '')) // strip non-digits
            .filter(s => s.length > 0)
          if (candidates.length === 0) return ''
          return candidates.reduce((a, b) => (a.length >= b.length ? a : b), '')
        }

        let finalAccount = digitsOnly

        // If the extracted digits are suspiciously short (e.g., only 4 digits), try to recover a longer one from the assistant response
        if ((finalAccount.length <= 4)) {
          const candidateFromContent = findLongestDigitCandidate(content || '')
          if (candidateFromContent && candidateFromContent.length > finalAccount.length) {
            finalAccount = candidateFromContent
            console.info(`Recovered longer account_number from assistant content: ${finalAccount}`)
          } else {
            // also try scanning the full JSON text in case assistant put the number elsewhere
            const candidateFromClean = findLongestDigitCandidate(JSON.stringify(extractedData))
            if (candidateFromClean && candidateFromClean.length > finalAccount.length) {
              finalAccount = candidateFromClean
              console.info(`Recovered longer account_number from parsed JSON: ${finalAccount}`)
            }
          }
        }

        // Always store account_number as contiguous digits (remove spaces/dashes)
        if (finalAccount !== digitsOnly) {
          console.info(`Normalized account_number from "${original}" -> "${finalAccount}"`)
        } else if (finalAccount !== original) {
          console.info(`Stripped non-digits from account_number "${original}" -> "${finalAccount}"`)
        }

        // If we ended up with empty, leave the original value untouched (so nothing destructive)
        if (finalAccount && finalAccount.length > 0) {
          extractedData.account_number = finalAccount
        } else {
          // fallback: keep original as-is
          extractedData.account_number = original
        }
      }
    } catch (normalizeError) {
      console.error('Error normalizing account_number:', normalizeError)
      // don't fail the whole request for normalization errors
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
