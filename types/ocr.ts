/**
 * OCR Types for document scanning and ending balance detection
 */

/**
 * Represents a monetary amount extracted from OCR text
 */
export interface ExtractedAmount {
  /** The raw string value from OCR */
  raw: string
  /** The parsed numeric value */
  value: number
  /** Currency symbol if present (e.g., '$', '€', '£') */
  currencySymbol?: string
  /** Whether the amount is negative */
  isNegative: boolean
  /** Position in the OCR text (character index) */
  position: number
  /** Line number in the OCR text (0-indexed) */
  lineNumber: number
  /** Bounding box if available from OCR */
  boundingBox?: BoundingBox
}

/**
 * Represents a date extracted from OCR text
 */
export interface ExtractedDate {
  /** The raw string value from OCR */
  raw: string
  /** The parsed UTC date */
  date: Date
  /** The detected format of the date */
  format: DateFormat
  /** Position in the OCR text (character index) */
  position: number
  /** Line number in the OCR text (0-indexed) */
  lineNumber: number
  /** Bounding box if available from OCR */
  boundingBox?: BoundingBox
}

/**
 * Supported date formats for parsing
 */
export type DateFormat = 
  | 'DD/MM/YYYY'
  | 'MM/DD/YYYY'
  | 'YYYY-MM-DD'
  | 'DD-MM-YYYY'
  | 'MM-DD-YYYY'
  | 'DD.MM.YYYY'
  | 'MONTH DD, YYYY'
  | 'DD MONTH YYYY'
  | 'UNKNOWN'

/**
 * Bounding box coordinates from OCR
 */
export interface BoundingBox {
  x: number
  y: number
  width: number
  height: number
}

/**
 * Association between an amount and a date
 */
export interface AmountDateAssociation {
  amount: ExtractedAmount
  date: ExtractedDate
  /** Confidence score for this association (0-1) */
  confidence: number
  /** Distance metric used for association */
  distance: number
  /** Whether this association is near a balance keyword */
  nearBalanceKeyword: boolean
  /** The balance keyword found nearby, if any */
  balanceKeyword?: string
}

/**
 * Result of the ending balance detection
 */
export interface EndingBalanceResult {
  /** The selected ending balance amount */
  endingBalance: ExtractedAmount | null
  /** The date associated with the ending balance */
  endingDate: ExtractedDate | null
  /** All extracted amounts */
  allAmounts: ExtractedAmount[]
  /** All extracted dates */
  allDates: ExtractedDate[]
  /** All amount-date associations */
  associations: AmountDateAssociation[]
  /** Confidence score for the ending balance selection (0-1) */
  confidence: number
  /** Reason for selection */
  selectionReason: string
}

/**
 * Configuration options for OCR processing
 */
export interface OcrConfig {
  /** Keywords that indicate a balance (case-insensitive) */
  balanceKeywords: string[]
  /** Maximum vertical distance (in lines) to associate amount with date */
  maxLineDistance: number
  /** Maximum character distance to associate amount with date on same line */
  maxCharDistance: number
  /** Weight for balance keyword proximity in scoring */
  balanceKeywordWeight: number
  /** Weight for date recency in scoring */
  dateRecencyWeight: number
  /** Weight for amount magnitude in scoring */
  amountMagnitudeWeight: number
  /** Prefer amounts with currency symbols */
  preferCurrencySymbol: boolean
}

/**
 * Raw OCR result structure (common format)
 */
export interface OcrResult {
  /** Full text extracted from document */
  text: string
  /** Individual text blocks with positions */
  blocks?: OcrBlock[]
  /** Confidence score of OCR (0-1) */
  confidence?: number
}

/**
 * Individual text block from OCR
 */
export interface OcrBlock {
  text: string
  boundingBox?: BoundingBox
  confidence?: number
  lineNumber?: number
}
