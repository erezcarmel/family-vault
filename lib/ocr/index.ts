/**
 * OCR Module
 * 
 * Exports all OCR-related functionality for document scanning and balance detection.
 */

// Main scanner module
export * from './ocrScanner'

// Configuration
export * from './config'

// Types are exported from the types directory
export type {
  ExtractedAmount,
  ExtractedDate,
  AmountDateAssociation,
  EndingBalanceResult,
  OcrConfig,
  OcrResult,
  OcrBlock,
  BoundingBox,
  DateFormat,
} from '@/types/ocr'
