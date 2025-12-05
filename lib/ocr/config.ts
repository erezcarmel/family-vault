/**
 * OCR Configuration
 * 
 * Configurable settings for OCR processing, date parsing, and ending balance detection.
 * These values can be adjusted to tune the balance detection algorithm.
 */

import { OcrConfig } from '@/types/ocr'

/**
 * Default OCR configuration settings
 */
export const DEFAULT_OCR_CONFIG: OcrConfig = {
  /**
   * Keywords that indicate a balance field (case-insensitive).
   * When these phrases appear near an amount, that amount is more likely to be the ending balance.
   */
  balanceKeywords: [
    'ending balance',
    'closing balance',
    'balance as of',
    'available balance',
    'current balance',
    'final balance',
    'account balance',
    'total balance',
    'balance forward',
    'new balance',
  ],

  /**
   * Maximum number of lines between a date and amount to consider them associated.
   * Amounts within this many lines of a date can be linked to that date.
   */
  maxLineDistance: 2,

  /**
   * Maximum character distance on the same line to associate an amount with a date.
   * Used when date and amount appear on the same line.
   */
  maxCharDistance: 100,

  /**
   * Weight for balance keyword proximity in the scoring algorithm.
   * Higher values prioritize amounts near balance keywords.
   */
  balanceKeywordWeight: 2.0,

  /**
   * Weight for date recency in the scoring algorithm.
   * Higher values prioritize amounts associated with the latest date.
   */
  dateRecencyWeight: 1.5,

  /**
   * Weight for amount magnitude in the scoring algorithm.
   * Higher values prioritize larger absolute amounts.
   */
  amountMagnitudeWeight: 0.5,

  /**
   * Whether to prefer amounts that include a currency symbol.
   * When true, amounts with currency symbols get a scoring boost.
   */
  preferCurrencySymbol: true,
}

/**
 * Regular expression patterns for date extraction
 */
export const DATE_PATTERNS = {
  /** DD/MM/YYYY or DD-MM-YYYY or DD.MM.YYYY */
  DMY_SLASH: /\b(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})\b/g,
  /** MM/DD/YYYY or MM-DD-YYYY */
  MDY_SLASH: /\b(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})\b/g,
  /** YYYY-MM-DD */
  ISO: /\b(\d{4})-(\d{1,2})-(\d{1,2})\b/g,
  /** Month DD, YYYY (e.g., "January 15, 2024") */
  MONTH_LONG: /\b(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2}),?\s+(\d{4})\b/gi,
  /** Mon DD, YYYY (e.g., "Jan 15, 2024") */
  MONTH_SHORT: /\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\.?\s+(\d{1,2}),?\s+(\d{4})\b/gi,
  /** DD Month YYYY (e.g., "15 January 2024") */
  DD_MONTH: /\b(\d{1,2})\s+(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{4})\b/gi,
}

/**
 * Month name mappings for parsing
 */
export const MONTH_NAMES: Record<string, number> = {
  january: 0, jan: 0,
  february: 1, feb: 1,
  march: 2, mar: 2,
  april: 3, apr: 3,
  may: 4,
  june: 5, jun: 5,
  july: 6, jul: 6,
  august: 7, aug: 7,
  september: 8, sep: 8,
  october: 9, oct: 9,
  november: 10, nov: 10,
  december: 11, dec: 11,
}

/**
 * Regular expression patterns for amount extraction
 */
export const AMOUNT_PATTERNS = {
  /** Currency symbol followed by amount (e.g., "$1,234.56" or "€ 1.234,56") */
  CURRENCY_PREFIX: /[$€£¥₹]\s*-?\s*[\d,]+(?:[.,]\d{1,2})?/g,
  /** Amount followed by currency code (e.g., "1,234.56 USD") */
  CURRENCY_SUFFIX: /[\d,]+(?:\.\d{1,2})?\s*(?:USD|EUR|GBP|CAD|AUD)/gi,
  /** Negative amount with parentheses (e.g., "($1,234.56)") */
  NEGATIVE_PARENS: /\([$€£¥₹]?\s*[\d,]+(?:\.\d{1,2})?\)/g,
  /** Plain numeric amount (e.g., "1,234.56" or "1234.56") */
  PLAIN_AMOUNT: /(?<![\d\-])[\d,]+\.\d{2}(?![\d])/g,
}

/**
 * Currency symbols for detection
 */
export const CURRENCY_SYMBOLS = ['$', '€', '£', '¥', '₹']

/**
 * Creates a custom OCR configuration by merging with defaults
 * @param overrides - Partial configuration to override defaults
 * @returns Complete OCR configuration
 */
export function createOcrConfig(overrides: Partial<OcrConfig> = {}): OcrConfig {
  return {
    ...DEFAULT_OCR_CONFIG,
    ...overrides,
    balanceKeywords: overrides.balanceKeywords ?? DEFAULT_OCR_CONFIG.balanceKeywords,
  }
}
