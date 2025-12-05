/**
 * Amount-Date Associator Module
 * 
 * This module provides utilities for extracting monetary amounts and dates from OCR text,
 * associating them based on proximity, and identifying the ending/closing balance.
 */

import {
  ExtractedAmount,
  ExtractedDate,
  AmountDateAssociation,
  EndingBalanceResult,
  OcrConfig,
  OcrResult,
  DateFormat,
} from '@/types/ocr'
import {
  DEFAULT_OCR_CONFIG,
  MONTH_NAMES,
  CURRENCY_SYMBOLS,
} from './config'

/**
 * Extracts all monetary amounts from OCR text
 * @param text - The OCR text to parse
 * @returns Array of extracted amounts with positions
 */
export function extractAmounts(text: string): ExtractedAmount[] {
  const amounts: ExtractedAmount[] = []
  const lines = text.split('\n')
  let globalPosition = 0

  for (let lineNumber = 0; lineNumber < lines.length; lineNumber++) {
    const line = lines[lineNumber]
    const lineAmounts = extractAmountsFromLine(line, lineNumber, globalPosition)
    amounts.push(...lineAmounts)
    globalPosition += line.length + 1 // +1 for newline
  }

  // Remove duplicates based on position
  const uniqueAmounts = amounts.filter((amount, index, self) =>
    index === self.findIndex(a => a.position === amount.position)
  )

  return uniqueAmounts
}

/**
 * Represents a range of characters that has been processed
 */
interface ProcessedRange {
  start: number
  end: number
}

/**
 * Checks if a position overlaps with any processed range
 */
function isPositionInProcessedRanges(
  position: number,
  length: number,
  ranges: ProcessedRange[]
): boolean {
  const end = position + length
  return ranges.some(range => 
    (position >= range.start && position < range.end) ||
    (end > range.start && end <= range.end) ||
    (position <= range.start && end >= range.end)
  )
}

/**
 * Extracts amounts from a single line
 */
function extractAmountsFromLine(
  line: string,
  lineNumber: number,
  lineStartPosition: number
): ExtractedAmount[] {
  const amounts: ExtractedAmount[] = []
  const processedRanges: ProcessedRange[] = []

  // Check for negative amounts in parentheses first
  const parenPattern = /\([$€£¥₹]?\s*([\d,]+(?:\.\d{1,2})?)\)/g
  let match

  while ((match = parenPattern.exec(line)) !== null) {
    const localPosition = match.index
    const matchLength = match[0].length
    if (!isPositionInProcessedRanges(localPosition, matchLength, processedRanges)) {
      processedRanges.push({ start: localPosition, end: localPosition + matchLength })
      const parsed = parseAmountValue(match[1])
      if (parsed !== null) {
        amounts.push({
          raw: match[0],
          value: -Math.abs(parsed),
          currencySymbol: extractCurrencySymbol(match[0]),
          isNegative: true,
          position: lineStartPosition + localPosition,
          lineNumber,
        })
      }
    }
  }

  // Check for currency prefix amounts
  for (const symbol of CURRENCY_SYMBOLS) {
    const escapedSymbol = symbol.replace(/[$]/g, '\\$')
    // This pattern handles both US (1,234.56) and European (1.234,56) formats
    const pattern = new RegExp(`${escapedSymbol}\\s*(-?)\\s*([\\d]+(?:[.,]\\d{3})*(?:[.,]\\d{1,2})?)`, 'g')
    
    while ((match = pattern.exec(line)) !== null) {
      const localPosition = match.index
      const matchLength = match[0].length
      if (!isPositionInProcessedRanges(localPosition, matchLength, processedRanges)) {
        processedRanges.push({ start: localPosition, end: localPosition + matchLength })
        const isNegative = match[1] === '-'
        const parsed = parseAmountValue(match[2])
        if (parsed !== null) {
          amounts.push({
            raw: match[0],
            value: isNegative ? -parsed : parsed,
            currencySymbol: symbol,
            isNegative,
            position: lineStartPosition + localPosition,
            lineNumber,
          })
        }
      }
    }
  }

  // Check for plain amounts (must have decimal with 2 digits)
  const plainPattern = /(?<![0-9$€£¥₹\-])([\d,]+\.\d{2})(?![0-9])/g
  while ((match = plainPattern.exec(line)) !== null) {
    const localPosition = match.index
    const matchLength = match[0].length
    if (!isPositionInProcessedRanges(localPosition, matchLength, processedRanges)) {
      processedRanges.push({ start: localPosition, end: localPosition + matchLength })
      const parsed = parseAmountValue(match[1])
      if (parsed !== null && parsed >= 0.01) { // Ignore very small amounts
        amounts.push({
          raw: match[0],
          value: parsed,
          isNegative: false,
          position: lineStartPosition + localPosition,
          lineNumber,
        })
      }
    }
  }

  return amounts
}

/**
 * Parses a string amount value to a number
 * Handles formats like "1,234.56", "1.234,56", "1234.56"
 */
function parseAmountValue(value: string): number | null {
  if (!value) return null

  // Remove spaces
  let cleaned = value.replace(/\s/g, '')

  // Determine decimal separator
  const lastDot = cleaned.lastIndexOf('.')
  const lastComma = cleaned.lastIndexOf(',')

  if (lastComma > lastDot) {
    // European format: 1.234,56 -> 1234.56
    cleaned = cleaned.replace(/\./g, '').replace(',', '.')
  } else {
    // US format: 1,234.56 -> 1234.56
    cleaned = cleaned.replace(/,/g, '')
  }

  const parsed = parseFloat(cleaned)
  return isNaN(parsed) ? null : parsed
}

/**
 * Extracts currency symbol from a string
 */
function extractCurrencySymbol(str: string): string | undefined {
  for (const symbol of CURRENCY_SYMBOLS) {
    if (str.includes(symbol)) {
      return symbol
    }
  }
  return undefined
}

/**
 * Extracts all dates from OCR text
 * @param text - The OCR text to parse
 * @returns Array of extracted dates with positions
 */
export function extractDates(text: string): ExtractedDate[] {
  const dates: ExtractedDate[] = []
  const lines = text.split('\n')
  let globalPosition = 0

  for (let lineNumber = 0; lineNumber < lines.length; lineNumber++) {
    const line = lines[lineNumber]
    const lineDates = extractDatesFromLine(line, lineNumber, globalPosition)
    dates.push(...lineDates)
    globalPosition += line.length + 1
  }

  // Remove duplicates and invalid dates
  const validDates = dates.filter((d, index, self) => {
    if (isNaN(d.date.getTime())) return false
    return index === self.findIndex(other => 
      other.position === d.position
    )
  })

  return validDates
}

/**
 * Extracts dates from a single line
 */
function extractDatesFromLine(
  line: string,
  lineNumber: number,
  lineStartPosition: number
): ExtractedDate[] {
  const dates: ExtractedDate[] = []
  const processedPositions = new Set<number>()

  // ISO format: YYYY-MM-DD
  const isoPattern = /\b(\d{4})-(\d{1,2})-(\d{1,2})\b/g
  let match

  while ((match = isoPattern.exec(line)) !== null) {
    const position = lineStartPosition + match.index
    if (!processedPositions.has(position)) {
      processedPositions.add(position)
      const year = parseInt(match[1], 10)
      const month = parseInt(match[2], 10) - 1
      const day = parseInt(match[3], 10)
      const date = new Date(Date.UTC(year, month, day))
      if (isValidDate(date, year, month, day)) {
        dates.push({
          raw: match[0],
          date,
          format: 'YYYY-MM-DD',
          position,
          lineNumber,
        })
      }
    }
  }

  // Numeric date patterns: DD/MM/YYYY, MM/DD/YYYY, DD-MM-YYYY, DD.MM.YYYY
  const numericPattern = /\b(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})\b/g
  while ((match = numericPattern.exec(line)) !== null) {
    const position = lineStartPosition + match.index
    if (!processedPositions.has(position)) {
      processedPositions.add(position)
      const part1 = parseInt(match[1], 10)
      const part2 = parseInt(match[2], 10)
      const year = parseInt(match[3], 10)

      // Try MM/DD/YYYY first (US format)
      let date = new Date(Date.UTC(year, part1 - 1, part2))
      let format: DateFormat = 'MM/DD/YYYY'

      if (!isValidDate(date, year, part1 - 1, part2)) {
        // Try DD/MM/YYYY (European format)
        date = new Date(Date.UTC(year, part2 - 1, part1))
        format = 'DD/MM/YYYY'
      }

      if (isValidDate(date, year, format === 'MM/DD/YYYY' ? part1 - 1 : part2 - 1, format === 'MM/DD/YYYY' ? part2 : part1)) {
        dates.push({
          raw: match[0],
          date,
          format,
          position,
          lineNumber,
        })
      }
    }
  }

  // Month name patterns: "January 15, 2024" or "Jan 15, 2024"
  const monthLongPattern = /\b(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2}),?\s+(\d{4})\b/gi
  while ((match = monthLongPattern.exec(line)) !== null) {
    const position = lineStartPosition + match.index
    if (!processedPositions.has(position)) {
      processedPositions.add(position)
      const month = MONTH_NAMES[match[1].toLowerCase()]
      const day = parseInt(match[2], 10)
      const year = parseInt(match[3], 10)
      const date = new Date(Date.UTC(year, month, day))
      if (isValidDate(date, year, month, day)) {
        dates.push({
          raw: match[0],
          date,
          format: 'MONTH DD, YYYY',
          position,
          lineNumber,
        })
      }
    }
  }

  // Short month pattern: "Jan 15, 2024"
  const monthShortPattern = /\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\.?\s+(\d{1,2}),?\s+(\d{4})\b/gi
  while ((match = monthShortPattern.exec(line)) !== null) {
    const position = lineStartPosition + match.index
    if (!processedPositions.has(position)) {
      processedPositions.add(position)
      const month = MONTH_NAMES[match[1].toLowerCase()]
      const day = parseInt(match[2], 10)
      const year = parseInt(match[3], 10)
      const date = new Date(Date.UTC(year, month, day))
      if (isValidDate(date, year, month, day)) {
        dates.push({
          raw: match[0],
          date,
          format: 'MONTH DD, YYYY',
          position,
          lineNumber,
        })
      }
    }
  }

  // DD Month YYYY: "15 January 2024"
  const ddMonthPattern = /\b(\d{1,2})\s+(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{4})\b/gi
  while ((match = ddMonthPattern.exec(line)) !== null) {
    const position = lineStartPosition + match.index
    if (!processedPositions.has(position)) {
      processedPositions.add(position)
      const day = parseInt(match[1], 10)
      const month = MONTH_NAMES[match[2].toLowerCase()]
      const year = parseInt(match[3], 10)
      const date = new Date(Date.UTC(year, month, day))
      if (isValidDate(date, year, month, day)) {
        dates.push({
          raw: match[0],
          date,
          format: 'DD MONTH YYYY',
          position,
          lineNumber,
        })
      }
    }
  }

  return dates
}

/**
 * Validates that a date is valid
 */
function isValidDate(date: Date, year: number, month: number, day: number): boolean {
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month &&
    date.getUTCDate() === day &&
    year >= 1900 &&
    year <= 2100
  )
}

/**
 * Finds balance keywords near a position in text
 * @param text - The full OCR text
 * @param position - Position to check
 * @param lineNumber - Line number of the position
 * @param config - OCR configuration
 * @returns The matched keyword if found, or undefined
 */
export function findNearbyBalanceKeyword(
  text: string,
  position: number,
  lineNumber: number,
  config: OcrConfig = DEFAULT_OCR_CONFIG
): string | undefined {
  const lines = text.split('\n')
  const startLine = Math.max(0, lineNumber - config.maxLineDistance)
  const endLine = Math.min(lines.length - 1, lineNumber + config.maxLineDistance)

  const lowerText = text.toLowerCase()

  for (const keyword of config.balanceKeywords) {
    const keywordLower = keyword.toLowerCase()

    // Search for keyword in nearby lines
    for (let i = startLine; i <= endLine; i++) {
      const lineStart = lines.slice(0, i).reduce((acc, l) => acc + l.length + 1, 0)
      const lineEnd = lineStart + lines[i].length
      
      const keywordIndex = lowerText.indexOf(keywordLower)
      if (keywordIndex !== -1 && keywordIndex >= lineStart - config.maxCharDistance && keywordIndex <= lineEnd + config.maxCharDistance) {
        return keyword
      }
    }
  }

  return undefined
}

/**
 * Associates amounts with dates based on proximity
 * @param amounts - Extracted amounts
 * @param dates - Extracted dates
 * @param text - Original OCR text
 * @param config - OCR configuration
 * @returns Array of amount-date associations
 */
export function associateAmountsWithDates(
  amounts: ExtractedAmount[],
  dates: ExtractedDate[],
  text: string,
  config: OcrConfig = DEFAULT_OCR_CONFIG
): AmountDateAssociation[] {
  const associations: AmountDateAssociation[] = []

  for (const amount of amounts) {
    let bestDate: ExtractedDate | null = null
    let bestDistance = Infinity
    let nearBalanceKeyword = false

    // Find nearby balance keyword
    const balanceKeyword = findNearbyBalanceKeyword(text, amount.position, amount.lineNumber, config)
    nearBalanceKeyword = !!balanceKeyword

    // Find the closest date
    for (const date of dates) {
      const lineDiff = Math.abs(amount.lineNumber - date.lineNumber)

      if (lineDiff <= config.maxLineDistance) {
        let distance: number

        if (lineDiff === 0) {
          // Same line: use character distance
          distance = Math.abs(amount.position - date.position)
          if (distance > config.maxCharDistance) continue
        } else {
          // Different lines: use weighted line distance
          distance = lineDiff * 100 // Weight line distance higher
        }

        if (distance < bestDistance) {
          bestDistance = distance
          bestDate = date
        }
      }
    }

    if (bestDate) {
      // Calculate confidence based on distance and keyword presence
      let confidence = Math.max(0, 1 - bestDistance / (config.maxCharDistance * 2))
      if (nearBalanceKeyword) {
        confidence = Math.min(1, confidence + 0.3)
      }

      associations.push({
        amount,
        date: bestDate,
        confidence,
        distance: bestDistance,
        nearBalanceKeyword,
        balanceKeyword,
      })
    }
  }

  return associations
}

/**
 * Detects the ending balance from OCR text
 * @param text - The OCR text to analyze
 * @param config - OCR configuration options
 * @returns EndingBalanceResult with the detected ending balance
 */
export function detectEndingBalance(
  text: string,
  config: OcrConfig = DEFAULT_OCR_CONFIG
): EndingBalanceResult {
  // Extract amounts and dates
  const allAmounts = extractAmounts(text)
  const allDates = extractDates(text)

  // Handle edge cases
  if (allAmounts.length === 0) {
    return {
      endingBalance: null,
      endingDate: null,
      allAmounts: [],
      allDates,
      associations: [],
      confidence: 0,
      selectionReason: 'No monetary amounts found in document',
    }
  }

  if (allDates.length === 0) {
    // If no dates, look for balance keywords
    const amountsWithKeywords = allAmounts.filter(amount =>
      findNearbyBalanceKeyword(text, amount.position, amount.lineNumber, config)
    )

    if (amountsWithKeywords.length > 0) {
      // Sort by position (later in document is usually ending balance)
      const sorted = [...amountsWithKeywords].sort((a, b) => b.position - a.position)
      return {
        endingBalance: sorted[0],
        endingDate: null,
        allAmounts,
        allDates: [],
        associations: [],
        confidence: 0.5,
        selectionReason: 'Selected last amount near balance keyword (no dates found)',
      }
    }

    // Fall back to last amount in document
    const lastAmount = [...allAmounts].sort((a, b) => b.position - a.position)[0]
    return {
      endingBalance: lastAmount,
      endingDate: null,
      allAmounts,
      allDates: [],
      associations: [],
      confidence: 0.3,
      selectionReason: 'Selected last amount in document (no dates or keywords found)',
    }
  }

  // Associate amounts with dates
  const associations = associateAmountsWithDates(allAmounts, allDates, text, config)

  if (associations.length === 0) {
    // No associations found - use heuristics
    const lastAmount = [...allAmounts].sort((a, b) => b.position - a.position)[0]
    const latestDate = [...allDates].sort((a, b) => b.date.getTime() - a.date.getTime())[0]
    return {
      endingBalance: lastAmount,
      endingDate: latestDate,
      allAmounts,
      allDates,
      associations: [],
      confidence: 0.4,
      selectionReason: 'No direct associations found - selected last amount and latest date',
    }
  }

  // Find the latest date
  const latestDate = [...allDates].sort((a, b) => b.date.getTime() - a.date.getTime())[0]

  // Get associations with the latest date
  const latestDateAssociations = associations.filter(
    a => a.date.date.getTime() === latestDate.date.getTime()
  )

  // Check for balance keyword associations
  const balanceKeywordAssociations = associations.filter(a => a.nearBalanceKeyword)
  
  if (balanceKeywordAssociations.length > 0) {
    // Prioritize balance keywords with latest date
    const keywordWithLatestDate = balanceKeywordAssociations.filter(
      a => a.date.date.getTime() === latestDate.date.getTime()
    )

    if (keywordWithLatestDate.length > 0) {
      const best = selectBestAmount(keywordWithLatestDate, config)
      return {
        endingBalance: best.amount,
        endingDate: best.date,
        allAmounts,
        allDates,
        associations,
        confidence: 0.95,
        selectionReason: `Selected amount near "${best.balanceKeyword}" keyword with latest date`,
      }
    }

    // If balance keyword exists but not with latest date, still prefer it
    const best = selectBestAmount(balanceKeywordAssociations, config)
    return {
      endingBalance: best.amount,
      endingDate: best.date,
      allAmounts,
      allDates,
      associations,
      confidence: 0.75,
      selectionReason: `Selected amount near "${best.balanceKeyword}" keyword (not latest date)`,
    }
  }

  // No balance keywords - select from latest date associations
  if (latestDateAssociations.length > 0) {
    const best = selectBestAmount(latestDateAssociations, config)
    return {
      endingBalance: best.amount,
      endingDate: best.date,
      allAmounts,
      allDates,
      associations,
      confidence: 0.7,
      selectionReason: 'Selected amount associated with latest date',
    }
  }

  // Fall back to best overall association
  const sortedAssociations = [...associations].sort((a, b) => {
    // Sort by date (latest first), then by confidence
    const dateDiff = b.date.date.getTime() - a.date.date.getTime()
    if (dateDiff !== 0) return dateDiff
    return b.confidence - a.confidence
  })

  return {
    endingBalance: sortedAssociations[0].amount,
    endingDate: sortedAssociations[0].date,
    allAmounts,
    allDates,
    associations,
    confidence: sortedAssociations[0].confidence,
    selectionReason: 'Selected best scoring amount-date association',
  }
}

/**
 * Selects the best amount from a list of associations using heuristics
 */
function selectBestAmount(
  associations: AmountDateAssociation[],
  config: OcrConfig
): AmountDateAssociation {
  if (associations.length === 1) {
    return associations[0]
  }

  // Score each association
  const scored = associations.map(assoc => {
    let score = assoc.confidence

    // Prefer non-negative amounts (typical for balances)
    if (!assoc.amount.isNegative) {
      score += 0.1
    }

    // Prefer larger amounts (typical for balances vs. transactions)
    const normalizedMagnitude = Math.log10(Math.abs(assoc.amount.value) + 1) / 6 // Normalize to ~0-1
    score += normalizedMagnitude * config.amountMagnitudeWeight

    // Prefer amounts with currency symbols
    if (config.preferCurrencySymbol && assoc.amount.currencySymbol) {
      score += 0.15
    }

    // Prefer amounts near balance keywords
    if (assoc.nearBalanceKeyword) {
      score += config.balanceKeywordWeight
    }

    return { ...assoc, score }
  })

  // Sort by score descending
  scored.sort((a, b) => b.score - a.score)

  return scored[0]
}

/**
 * Processes OCR result and returns the ending balance
 * Main entry point for the OCR scanning pipeline
 */
export function processOcrForEndingBalance(
  ocrResult: OcrResult,
  config: OcrConfig = DEFAULT_OCR_CONFIG
): EndingBalanceResult {
  return detectEndingBalance(ocrResult.text, config)
}
