/**
 * Subcategory Inference Module for OCR Scanning Pipeline
 *
 * This module provides lightweight inference to determine the sub-category
 * of a scanned document based on extracted text content.
 */

import {
  SubcategoryMapping,
  SubcategoryInferenceConfig,
  getInferenceConfig
} from '@/lib/config/ocr/subcategory-mapping'

// Scoring constants for confidence calculation
const MATCH_COUNT_WEIGHT = 0.3    // Weight for match count (logarithmic contribution)
const SPECIFICITY_WEIGHT = 0.4   // Weight for match length/specificity
const MAX_SPECIFICITY_LENGTH = 20 // Expected max length for specificity normalization
const MAX_BASE_SCORE = 0.7       // Cap on base score before weight multiplier

/**
 * A match candidate with score and matched text.
 */
export interface SubcategoryCandidate {
  /** The subcategory identifier */
  subcategory: string
  /** Confidence score (0-1) based on match quality */
  score: number
  /** The text that matched the pattern/keyword */
  matchedText: string
}

/**
 * Result of the subcategory inference process.
 */
export interface SubcategoryInferenceResult {
  /** The inferred subcategory (highest scoring match, if above threshold) */
  inferredSubcategory?: string
  /** Confidence score of the top match (0-1) */
  confidence: number
  /** All candidates ranked by score (for presenting choices to user) */
  candidates?: SubcategoryCandidate[]
  /** Whether the subcategory should be auto-populated */
  autoPopulate: boolean
}

/**
 * Score details for internal processing.
 */
interface MatchScore {
  subcategory: string
  totalScore: number
  matchCount: number
  longestMatch: string
  longestMatchLength: number
  matches: string[]
}

/**
 * Escape special regex characters in a string.
 */
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/**
 * Find all keyword matches in the text for a given mapping.
 * Uses word boundary matching for better accuracy.
 */
function findKeywordMatches(
  text: string,
  mapping: SubcategoryMapping
): string[] {
  const matches: string[] = []
  const normalizedText = text.toLowerCase()

  for (const keyword of mapping.keywords) {
    const normalizedKeyword = keyword.toLowerCase()
    // Create a regex with word boundaries for precise matching
    const pattern = new RegExp(`\\b${escapeRegex(normalizedKeyword)}\\b`, 'gi')
    const found = normalizedText.match(pattern)
    if (found) {
      matches.push(...found)
    }
  }

  return matches
}

/**
 * Find all pattern matches in the text for a given mapping.
 */
function findPatternMatches(
  text: string,
  mapping: SubcategoryMapping
): string[] {
  const matches: string[] = []

  for (const pattern of mapping.patterns) {
    try {
      const regex = new RegExp(pattern, 'gi')
      const found = text.match(regex)
      if (found) {
        matches.push(...found)
      }
    } catch (error) {
      // Skip invalid patterns
      console.warn(`Invalid regex pattern: ${pattern}`, error)
    }
  }

  return matches
}

/**
 * Calculate the score for a set of matches.
 * Scoring rules:
 * 1. Base score from match count
 * 2. Bonus for longer matching phrases (specificity)
 * 3. Weight multiplier from mapping configuration
 */
function calculateScore(
  matches: string[],
  mapping: SubcategoryMapping
): MatchScore {
  if (matches.length === 0) {
    return {
      subcategory: mapping.subcategory,
      totalScore: 0,
      matchCount: 0,
      longestMatch: '',
      longestMatchLength: 0,
      matches: []
    }
  }

  // Find the longest match (specificity indicator)
  const longestMatch = matches.reduce((a, b) => (a.length > b.length ? a : b), '')

  // Base score calculation:
  // - matchCount contributes logarithmically (diminishing returns)
  // - longestMatch contributes linearly (longer = more specific)
  const matchCountScore = Math.log2(matches.length + 1) * MATCH_COUNT_WEIGHT
  const specificityScore = (longestMatch.length / MAX_SPECIFICITY_LENGTH) * SPECIFICITY_WEIGHT
  const baseScore = Math.min(matchCountScore + specificityScore, MAX_BASE_SCORE)

  // Apply weight multiplier
  const totalScore = Math.min(baseScore * mapping.weight, 1.0)

  return {
    subcategory: mapping.subcategory,
    totalScore,
    matchCount: matches.length,
    longestMatch,
    longestMatchLength: longestMatch.length,
    matches: [...new Set(matches)] // Deduplicate
  }
}

/**
 * Infer the subcategory from extracted OCR text.
 *
 * @param text - The extracted plain text from OCR scanning
 * @param config - Optional configuration override
 * @returns The inference result with subcategory suggestion(s)
 */
export function inferSubcategory(
  text: string,
  config?: Partial<SubcategoryInferenceConfig>
): SubcategoryInferenceResult {
  const fullConfig = {
    ...getInferenceConfig(),
    ...config
  }

  if (!text || text.trim().length === 0) {
    return {
      confidence: 0,
      autoPopulate: false
    }
  }

  const scores: MatchScore[] = []

  // Process each mapping
  for (const mapping of fullConfig.mappings) {
    const keywordMatches = findKeywordMatches(text, mapping)
    const patternMatches = findPatternMatches(text, mapping)
    const allMatches = [...keywordMatches, ...patternMatches]

    if (allMatches.length > 0) {
      const score = calculateScore(allMatches, mapping)
      scores.push(score)
    }
  }

  // Sort by total score (descending)
  scores.sort((a, b) => b.totalScore - a.totalScore)

  // Build candidates list
  const candidates: SubcategoryCandidate[] = scores
    .slice(0, fullConfig.maxCandidates)
    .map((score) => ({
      subcategory: score.subcategory,
      score: Math.round(score.totalScore * 100) / 100, // Round to 2 decimal places
      matchedText: score.longestMatch
    }))

  // Determine top result
  const topScore = scores[0]

  if (!topScore || topScore.totalScore === 0) {
    return {
      confidence: 0,
      candidates: candidates.length > 0 ? candidates : undefined,
      autoPopulate: false
    }
  }

  const confidence = Math.round(topScore.totalScore * 100) / 100
  const shouldAutoPopulate =
    fullConfig.autoPopulate && confidence >= fullConfig.minConfidenceForAutoPopulate

  return {
    inferredSubcategory: topScore.subcategory,
    confidence,
    candidates: candidates.length > 0 ? candidates : undefined,
    autoPopulate: shouldAutoPopulate
  }
}

/**
 * Batch inference for multiple text segments.
 * Useful when processing multi-page documents.
 *
 * @param texts - Array of text segments
 * @param config - Optional configuration override
 * @returns Combined inference result
 */
export function inferSubcategoryFromMultipleTexts(
  texts: string[],
  config?: Partial<SubcategoryInferenceConfig>
): SubcategoryInferenceResult {
  // Combine all texts and run inference
  const combinedText = texts.join('\n')
  return inferSubcategory(combinedText, config)
}
