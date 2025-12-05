/**
 * OCR Scanner Module
 * 
 * Entry point for the OCR scanning pipeline. This module provides functions
 * to process OCR results and extract structured data including the ending balance.
 */

import {
  OcrResult,
  OcrConfig,
  EndingBalanceResult,
  ExtractedAmount,
  ExtractedDate,
} from '@/types/ocr'
import {
  processOcrForEndingBalance,
  extractAmounts,
  extractDates,
  detectEndingBalance,
} from './amountDateAssociator'
import { DEFAULT_OCR_CONFIG, createOcrConfig } from './config'

export {
  // Main processing function
  processOcrForEndingBalance,
  
  // Individual extraction functions
  extractAmounts,
  extractDates,
  detectEndingBalance,
  
  // Configuration
  DEFAULT_OCR_CONFIG,
  createOcrConfig,
}

/**
 * Enhanced OCR processing result that includes additional metadata
 */
export interface EnhancedOcrResult {
  /** The ending balance result */
  endingBalance: EndingBalanceResult
  /** Raw text from OCR */
  rawText: string
  /** Processing timestamp */
  processedAt: Date
  /** Configuration used */
  config: OcrConfig
}

/**
 * Processes OCR text and returns enhanced results including ending balance
 * @param text - Raw OCR text to process
 * @param configOverrides - Optional configuration overrides
 * @returns Enhanced OCR result with ending balance
 */
export function processOcrText(
  text: string,
  configOverrides?: Partial<OcrConfig>
): EnhancedOcrResult {
  const config = createOcrConfig(configOverrides)
  const endingBalanceResult = detectEndingBalance(text, config)

  return {
    endingBalance: endingBalanceResult,
    rawText: text,
    processedAt: new Date(),
    config,
  }
}

/**
 * Processes an OcrResult object and returns enhanced results
 * @param ocrResult - OCR result object with text
 * @param configOverrides - Optional configuration overrides
 * @returns Enhanced OCR result with ending balance
 */
export function processOcrResult(
  ocrResult: OcrResult,
  configOverrides?: Partial<OcrConfig>
): EnhancedOcrResult {
  return processOcrText(ocrResult.text, configOverrides)
}

/**
 * Formats an extracted amount for display
 * @param amount - The extracted amount
 * @returns Formatted string representation
 */
export function formatAmount(amount: ExtractedAmount): string {
  const sign = amount.isNegative ? '-' : ''
  const symbol = amount.currencySymbol || ''
  const value = Math.abs(amount.value).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
  return `${sign}${symbol}${value}`
}

/**
 * Formats an extracted date for display
 * @param date - The extracted date
 * @returns Formatted string representation
 */
export function formatDate(date: ExtractedDate): string {
  return date.date.toISOString().split('T')[0]
}

/**
 * Validates OCR text has sufficient content for balance detection
 * @param text - OCR text to validate
 * @returns Boolean indicating if text has extractable content
 */
export function hasExtractableContent(text: string): boolean {
  const amounts = extractAmounts(text)
  return amounts.length > 0
}

/**
 * Quick check if text contains balance-related keywords
 * @param text - Text to check
 * @param config - Optional configuration
 * @returns Boolean indicating if balance keywords are present
 */
export function containsBalanceKeywords(
  text: string,
  config: OcrConfig = DEFAULT_OCR_CONFIG
): boolean {
  const lowerText = text.toLowerCase()
  return config.balanceKeywords.some(keyword => 
    lowerText.includes(keyword.toLowerCase())
  )
}
