/**
 * Subcategory Mapping Configuration for OCR Inference
 *
 * This file defines mappings from keywords/patterns to sub-category identifiers.
 * The OCR inference step uses these mappings to suggest sub-categories based on
 * text extracted from scanned documents.
 *
 * ## Mapping Format
 *
 * Each mapping entry has the following structure:
 * - `subcategory`: The identifier of the sub-category (e.g., 'cash_withdrawal', 'grocery')
 * - `keywords`: Array of exact keywords to match (case-insensitive)
 * - `patterns`: Array of regex patterns for flexible matching (case-insensitive)
 * - `weight`: Base weight/priority for this mapping (higher = more important)
 *
 * ## Scoring Rules
 *
 * 1. Longer matching phrases score higher (specificity bonus)
 * 2. Multiple matches increase confidence
 * 3. Pattern matches are weighted by the `weight` field
 *
 * ## Examples
 *
 * ```typescript
 * {
 *   subcategory: 'grocery',
 *   keywords: ['grocery', 'supermarket', 'food', 'produce'],
 *   patterns: ['\\b(whole\\s?foods|trader\\s?joe|safeway|kroger)\\b'],
 *   weight: 1.0
 * }
 * ```
 */

export interface SubcategoryMapping {
  /** The subcategory identifier used by the application */
  subcategory: string
  /** Exact keywords to match (case-insensitive, word boundary matching) */
  keywords: string[]
  /** Regex patterns for flexible matching (case-insensitive) */
  patterns: string[]
  /** Base weight/priority for this mapping (default: 1.0) */
  weight: number
}

export interface SubcategoryInferenceConfig {
  /**
   * When true, auto-populates the subcategory field with the top match.
   * When false, only provides suggestions without auto-populating.
   */
  autoPopulate: boolean
  /**
   * Minimum confidence score (0-1) required for auto-population.
   * Scores below this threshold will only suggest, not auto-populate.
   */
  minConfidenceForAutoPopulate: number
  /**
   * Maximum number of candidates to return in the suggestions list.
   */
  maxCandidates: number
  /** The subcategory mappings */
  mappings: SubcategoryMapping[]
}

/**
 * Default subcategory mappings for common document types.
 * Add or modify mappings to customize inference behavior.
 */
export const defaultSubcategoryMappings: SubcategoryMapping[] = [
  // Banking / Cash Operations
  {
    subcategory: 'cash_withdrawal',
    keywords: ['atm', 'withdrawal', 'cash out', 'cash withdrawal'],
    patterns: [
      '\\batm\\s*withdraw(?:al)?\\b',
      '\\bcash\\s*(?:out|back|withdrawal)\\b',
      '\\bwithdraw(?:al)?\\s*(?:from)?\\s*(?:atm|machine)\\b'
    ],
    weight: 1.2
  },
  {
    subcategory: 'pos_purchase',
    keywords: ['pos', 'point of sale', 'purchase', 'debit card'],
    patterns: [
      '\\bpos\\s*(?:purchase|transaction)?\\b',
      '\\bpoint\\s*of\\s*sale\\b',
      '\\bdebit\\s*(?:card)?\\s*purchase\\b'
    ],
    weight: 1.0
  },
  {
    subcategory: 'direct_deposit',
    keywords: ['direct deposit', 'payroll', 'salary', 'paycheck'],
    patterns: [
      '\\bdirect\\s*deposit\\b',
      '\\bpayroll\\s*(?:deposit)?\\b',
      '\\bsalary\\s*(?:deposit|payment)?\\b'
    ],
    weight: 1.1
  },
  {
    subcategory: 'wire_transfer',
    keywords: ['wire', 'wire transfer', 'swift', 'international transfer'],
    patterns: [
      '\\bwire\\s*transfer\\b',
      '\\bswift\\s*(?:transfer|payment)?\\b',
      '\\binternational\\s*transfer\\b'
    ],
    weight: 1.0
  },

  // Shopping / Retail
  {
    subcategory: 'grocery',
    keywords: ['grocery', 'supermarket', 'food', 'produce', 'groceries'],
    patterns: [
      '\\b(whole\\s?foods|trader\\s?joe\'?s?|safeway|kroger|publix|wegmans|aldi|costco|walmart\\s*(?:grocery)?|target\\s*(?:grocery)?)\\b',
      '\\bgrocery\\s*(?:store)?\\b',
      '\\bsupermarket\\b'
    ],
    weight: 1.0
  },
  {
    subcategory: 'fuel',
    keywords: ['fuel', 'gas', 'gasoline', 'petrol', 'diesel', 'gas station'],
    patterns: [
      '\\b(shell|exxon|mobil|chevron|bp|76|texaco|citgo|speedway|valero|sunoco|marathon)\\b',
      '\\bfuel\\s*(?:purchase|station)?\\b',
      '\\bgas\\s*(?:station|pump)?\\b',
      '\\bgasoline\\b'
    ],
    weight: 1.0
  },
  {
    subcategory: 'restaurant',
    keywords: ['restaurant', 'dining', 'food service', 'eatery', 'cafe'],
    patterns: [
      '\\b(mcdonald\'?s?|burger\\s*king|wendy\'?s?|starbucks|dunkin|chipotle|subway|domino\'?s?|pizza\\s*hut|taco\\s*bell)\\b',
      '\\brestaurant\\b',
      '\\bdining\\b',
      '\\bcafe\\b'
    ],
    weight: 1.0
  },

  // Bills / Utilities
  {
    subcategory: 'utility_bill',
    keywords: ['utility', 'electric', 'electricity', 'water', 'gas bill', 'power'],
    patterns: [
      '\\b(utility|utilities)\\s*(?:bill|payment)?\\b',
      '\\belectric(?:ity)?\\s*(?:bill|payment)?\\b',
      '\\bwater\\s*(?:bill|service)?\\b',
      '\\bpower\\s*(?:bill|company)?\\b'
    ],
    weight: 1.0
  },
  {
    subcategory: 'internet_cable',
    keywords: ['internet', 'cable', 'broadband', 'wifi', 'streaming'],
    patterns: [
      '\\b(comcast|xfinity|spectrum|at&t|verizon|cox|frontier|centurylink)\\s*(?:internet|cable)?\\b',
      '\\binternet\\s*(?:service|bill)?\\b',
      '\\bcable\\s*(?:tv|service)?\\b'
    ],
    weight: 1.0
  },
  {
    subcategory: 'phone_bill',
    keywords: ['phone', 'mobile', 'cellular', 'wireless'],
    patterns: [
      '\\b(verizon|at&t|t-mobile|sprint|cricket|boost|metro\\s*pcs)\\s*(?:wireless|mobile)?\\b',
      '\\bphone\\s*(?:bill|service)?\\b',
      '\\bmobile\\s*(?:bill|service)?\\b',
      '\\bcellular\\b'
    ],
    weight: 1.0
  },

  // Housing
  {
    subcategory: 'rent',
    keywords: ['rent', 'rental', 'lease payment', 'monthly rent'],
    patterns: [
      '\\brent(?:al)?\\s*(?:payment)?\\b',
      '\\blease\\s*(?:payment)?\\b',
      '\\bmonthly\\s*rent\\b'
    ],
    weight: 1.2
  },
  {
    subcategory: 'mortgage',
    keywords: ['mortgage', 'home loan', 'housing payment'],
    patterns: [
      '\\bmortgage\\s*(?:payment)?\\b',
      '\\bhome\\s*loan\\b',
      '\\bhousing\\s*(?:payment|loan)?\\b'
    ],
    weight: 1.2
  },

  // Healthcare
  {
    subcategory: 'medical',
    keywords: ['medical', 'healthcare', 'doctor', 'physician', 'hospital', 'clinic'],
    patterns: [
      '\\bmedical\\s*(?:bill|expense|payment)?\\b',
      '\\bhealthcare\\s*(?:expense|payment)?\\b',
      '\\b(hospital|clinic|doctor|physician)\\s*(?:bill|visit)?\\b'
    ],
    weight: 1.0
  },
  {
    subcategory: 'pharmacy',
    keywords: ['pharmacy', 'prescription', 'medication', 'drug store'],
    patterns: [
      '\\b(cvs|walgreens|rite\\s*aid|walmart\\s*pharmacy)\\b',
      '\\bpharmacy\\b',
      '\\bprescription\\b',
      '\\bmedication\\b'
    ],
    weight: 1.0
  },

  // Insurance
  {
    subcategory: 'auto_insurance',
    keywords: ['auto insurance', 'car insurance', 'vehicle insurance'],
    patterns: [
      '\\b(geico|progressive|state\\s*farm|allstate|liberty\\s*mutual|farmers)\\s*(?:auto|car)?\\b',
      '\\bauto\\s*insurance\\b',
      '\\bcar\\s*insurance\\b',
      '\\bvehicle\\s*insurance\\b'
    ],
    weight: 1.1
  },
  {
    subcategory: 'health_insurance',
    keywords: ['health insurance', 'medical insurance', 'healthcare plan'],
    patterns: [
      '\\b(blue\\s*cross|aetna|cigna|united\\s*health|humana|kaiser)\\b',
      '\\bhealth\\s*insurance\\b',
      '\\bmedical\\s*insurance\\b'
    ],
    weight: 1.1
  },

  // Subscriptions / Memberships
  {
    subcategory: 'subscription',
    keywords: ['subscription', 'membership', 'recurring'],
    patterns: [
      '\\b(netflix|spotify|amazon\\s*prime|hulu|disney\\+?|hbo|apple\\s*(?:music|tv))\\b',
      '\\bsubscription\\b',
      '\\bmembership\\s*(?:fee)?\\b',
      '\\brecurring\\s*(?:charge|payment)?\\b'
    ],
    weight: 1.0
  },
  {
    subcategory: 'gym_fitness',
    keywords: ['gym', 'fitness', 'workout', 'exercise'],
    patterns: [
      '\\b(planet\\s*fitness|la\\s*fitness|anytime\\s*fitness|24\\s*hour\\s*fitness|equinox|gold\'?s?\\s*gym)\\b',
      '\\bgym\\s*(?:membership)?\\b',
      '\\bfitness\\s*(?:center|club)?\\b'
    ],
    weight: 1.0
  },

  // Charitable / Donations
  {
    subcategory: 'donation',
    keywords: ['donation', 'charity', 'charitable', 'nonprofit', 'contribution'],
    patterns: [
      '\\bdonation\\b',
      '\\bcharit(?:y|able)\\s*(?:contribution)?\\b',
      '\\bnonprofit\\b',
      '\\bcontribution\\b'
    ],
    weight: 1.0
  },

  // Travel / Transportation
  {
    subcategory: 'travel',
    keywords: ['travel', 'flight', 'hotel', 'airline', 'booking'],
    patterns: [
      '\\b(united|delta|american|southwest|jetblue|spirit)\\s*(?:airlines?)?\\b',
      '\\b(marriott|hilton|hyatt|ihg|wyndham|airbnb)\\b',
      '\\bflight\\s*(?:booking)?\\b',
      '\\bhotel\\s*(?:booking|reservation)?\\b'
    ],
    weight: 1.0
  },
  {
    subcategory: 'transportation',
    keywords: ['uber', 'lyft', 'taxi', 'rideshare', 'public transit'],
    patterns: [
      '\\b(uber|lyft|taxi|cab)\\b',
      '\\brideshare\\b',
      '\\bpublic\\s*(?:transit|transportation)?\\b',
      '\\b(metro|subway|bus)\\s*(?:fare)?\\b'
    ],
    weight: 1.0
  }
]

/**
 * Default configuration for subcategory inference.
 */
export const defaultInferenceConfig: SubcategoryInferenceConfig = {
  autoPopulate: true,
  minConfidenceForAutoPopulate: 0.6,
  maxCandidates: 5,
  mappings: defaultSubcategoryMappings
}

/**
 * Get the inference configuration.
 * Can be extended to load from environment variables or external config.
 */
export function getInferenceConfig(): SubcategoryInferenceConfig {
  const autoPopulate = process.env.OCR_AUTO_POPULATE_SUBCATEGORY !== 'false'
  
  return {
    ...defaultInferenceConfig,
    autoPopulate
  }
}
