/**
 * Unit and Integration Tests for Subcategory Inference Module
 *
 * Tests cover:
 * - Pattern matching for various keywords and regex patterns
 * - Confidence scoring based on match count and specificity
 * - Tie-breaking and candidate ranking
 * - Integration tests for ATM withdrawal, grocery, and vendor-based mapping
 */

import { inferSubcategory, inferSubcategoryFromMultipleTexts, SubcategoryInferenceResult } from '../subcategoryInference'
import { SubcategoryMapping, SubcategoryInferenceConfig, defaultSubcategoryMappings } from '@/lib/config/ocr/subcategory-mapping'

describe('Subcategory Inference Module', () => {
  describe('Basic Pattern Matching', () => {
    it('should return no inference for empty text', () => {
      const result = inferSubcategory('')
      expect(result.confidence).toBe(0)
      expect(result.inferredSubcategory).toBeUndefined()
      expect(result.autoPopulate).toBe(false)
    })

    it('should return no inference for whitespace-only text', () => {
      const result = inferSubcategory('   \n\t  ')
      expect(result.confidence).toBe(0)
      expect(result.inferredSubcategory).toBeUndefined()
    })

    it('should match exact keywords case-insensitively', () => {
      const result = inferSubcategory('This is an ATM transaction')
      expect(result.inferredSubcategory).toBe('cash_withdrawal')
      expect(result.confidence).toBeGreaterThan(0)
    })

    it('should match keywords with different cases', () => {
      const result1 = inferSubcategory('ATM WITHDRAWAL')
      const result2 = inferSubcategory('atm withdrawal')
      const result3 = inferSubcategory('Atm Withdrawal')
      
      expect(result1.inferredSubcategory).toBe('cash_withdrawal')
      expect(result2.inferredSubcategory).toBe('cash_withdrawal')
      expect(result3.inferredSubcategory).toBe('cash_withdrawal')
    })

    it('should use word boundaries for matching', () => {
      // "atm" should not match "automatic" or "atmosphere"
      const result = inferSubcategory('automatic payment processing')
      expect(result.inferredSubcategory).not.toBe('cash_withdrawal')
    })
  })

  describe('Regex Pattern Matching', () => {
    it('should match regex patterns for ATM withdrawal variants', () => {
      const texts = [
        'ATM withdraw $200',
        'ATM withdrawal from Bank of America',
        'cash withdrawal at ATM'
      ]
      
      for (const text of texts) {
        const result = inferSubcategory(text)
        expect(result.inferredSubcategory).toBe('cash_withdrawal')
      }
    })

    it('should match vendor patterns for grocery', () => {
      const result = inferSubcategory('Payment to Whole Foods Market')
      expect(result.inferredSubcategory).toBe('grocery')
    })

    it('should match multiple vendor patterns', () => {
      const vendors = ['Trader Joe\'s', 'Safeway', 'Kroger', 'Walmart grocery']
      
      for (const vendor of vendors) {
        const result = inferSubcategory(`Shopping at ${vendor} store`)
        expect(result.inferredSubcategory).toBe('grocery')
      }
    })

    it('should match fuel station vendors', () => {
      const stations = ['Shell', 'Exxon', 'Chevron', 'BP']
      
      for (const station of stations) {
        const result = inferSubcategory(`Fuel purchase at ${station}`)
        expect(result.inferredSubcategory).toBe('fuel')
      }
    })
  })

  describe('Confidence Scoring', () => {
    it('should have higher confidence for more matches', () => {
      const singleMatch = inferSubcategory('ATM')
      const multipleMatches = inferSubcategory('ATM withdrawal cash withdrawal ATM cash out')
      
      expect(multipleMatches.confidence).toBeGreaterThan(singleMatch.confidence)
    })

    it('should have higher confidence for longer matching phrases', () => {
      const shortMatch = inferSubcategory('ATM')
      const longMatch = inferSubcategory('ATM withdrawal transaction')
      
      expect(longMatch.confidence).toBeGreaterThan(shortMatch.confidence)
    })

    it('should apply weight multipliers', () => {
      // cash_withdrawal has weight 1.2, pos_purchase has weight 1.0
      // With similar match quality, cash_withdrawal should score higher due to weight
      const config: Partial<SubcategoryInferenceConfig> = {
        mappings: [
          {
            subcategory: 'test_high_weight',
            keywords: ['test'],
            patterns: [],
            weight: 2.0
          },
          {
            subcategory: 'test_low_weight',
            keywords: ['test'],
            patterns: [],
            weight: 0.5
          }
        ]
      }
      
      const result = inferSubcategory('test keyword here', config)
      expect(result.inferredSubcategory).toBe('test_high_weight')
    })
  })

  describe('Candidate Ranking and Ties', () => {
    it('should return multiple candidates when available', () => {
      // Text that could match multiple categories
      const result = inferSubcategory('Payment for internet and phone service bill')
      
      expect(result.candidates).toBeDefined()
      expect(result.candidates!.length).toBeGreaterThan(0)
    })

    it('should rank candidates by score (highest first)', () => {
      const result = inferSubcategory('ATM withdrawal at Shell gas station grocery store')
      
      if (result.candidates && result.candidates.length > 1) {
        for (let i = 0; i < result.candidates.length - 1; i++) {
          expect(result.candidates[i].score).toBeGreaterThanOrEqual(
            result.candidates[i + 1].score
          )
        }
      }
    })

    it('should respect maxCandidates configuration', () => {
      const config: Partial<SubcategoryInferenceConfig> = {
        maxCandidates: 3
      }
      
      const result = inferSubcategory(
        'ATM withdrawal grocery fuel restaurant pharmacy medical',
        config
      )
      
      expect(result.candidates).toBeDefined()
      expect(result.candidates!.length).toBeLessThanOrEqual(3)
    })

    it('should include matchedText in candidates', () => {
      const result = inferSubcategory('ATM withdrawal from Bank of America')
      
      expect(result.candidates).toBeDefined()
      expect(result.candidates![0].matchedText).toBeTruthy()
    })
  })

  describe('Auto-Population Configuration', () => {
    it('should auto-populate when confidence is above threshold', () => {
      const result = inferSubcategory('ATM withdrawal cash withdrawal ATM')
      
      if (result.confidence >= 0.6) {
        expect(result.autoPopulate).toBe(true)
      }
    })

    it('should not auto-populate when confidence is below threshold', () => {
      const config: Partial<SubcategoryInferenceConfig> = {
        minConfidenceForAutoPopulate: 0.99 // Very high threshold
      }
      
      const result = inferSubcategory('ATM', config)
      expect(result.autoPopulate).toBe(false)
    })

    it('should respect autoPopulate opt-out flag', () => {
      const config: Partial<SubcategoryInferenceConfig> = {
        autoPopulate: false
      }
      
      const result = inferSubcategory('ATM withdrawal cash withdrawal ATM ATM ATM', config)
      expect(result.autoPopulate).toBe(false)
    })
  })

  describe('Integration Tests - Required Scenarios', () => {
    describe('ATM Withdrawal Recognition', () => {
      it('should recognize "ATM withdrawal" text', () => {
        const sampleText = `
          TRANSACTION DETAILS
          Date: 2024-01-15
          Description: ATM withdrawal
          Amount: $200.00
          Location: Main Street Branch
        `
        
        const result = inferSubcategory(sampleText)
        
        expect(result.inferredSubcategory).toBe('cash_withdrawal')
        expect(result.confidence).toBeGreaterThan(0)
        expect(result.candidates).toBeDefined()
      })

      it('should recognize various ATM transaction formats', () => {
        const texts = [
          'ATM Withdraw $500',
          'CASH WITHDRAWAL - ATM',
          'ATM CASH OUT',
          'Withdrawal from ATM machine'
        ]
        
        for (const text of texts) {
          const result = inferSubcategory(text)
          expect(result.inferredSubcategory).toBe('cash_withdrawal')
        }
      })
    })

    describe('Grocery Recognition', () => {
      it('should recognize grocery store transactions', () => {
        const sampleText = `
          RECEIPT
          Store: Whole Foods Market
          Items: Groceries
          Total: $145.23
        `
        
        const result = inferSubcategory(sampleText)
        
        expect(result.inferredSubcategory).toBe('grocery')
        expect(result.confidence).toBeGreaterThan(0)
      })

      it('should recognize various grocery vendors', () => {
        const texts = [
          'Trader Joe\'s purchase',
          'SAFEWAY SUPERMARKET',
          'Kroger grocery store',
          'WALMART GROCERY'
        ]
        
        for (const text of texts) {
          const result = inferSubcategory(text)
          expect(result.inferredSubcategory).toBe('grocery')
        }
      })
    })

    describe('Vendor-Based Mapping', () => {
      it('should recognize fuel vendors', () => {
        const sampleText = `
          SHELL OIL COMPANY
          Station #12345
          Fuel Purchase
          Regular Unleaded
          10.5 gallons @ $3.45
          Total: $36.23
        `
        
        const result = inferSubcategory(sampleText)
        
        expect(result.inferredSubcategory).toBe('fuel')
        expect(result.confidence).toBeGreaterThan(0)
      })

      it('should recognize restaurant vendors', () => {
        const result = inferSubcategory('Starbucks Coffee purchase $5.50')
        expect(result.inferredSubcategory).toBe('restaurant')
      })

      it('should recognize subscription services', () => {
        const result = inferSubcategory('Netflix subscription monthly payment')
        expect(result.inferredSubcategory).toBe('subscription')
      })

      it('should recognize insurance providers', () => {
        const result = inferSubcategory('GEICO auto insurance premium payment')
        expect(result.inferredSubcategory).toBe('auto_insurance')
      })
    })
  })

  describe('Multi-Text Inference', () => {
    it('should combine multiple text segments for inference', () => {
      const texts = [
        'Page 1: ATM Transaction',
        'Page 2: Withdrawal details',
        'Page 3: Cash amount $200'
      ]
      
      const result = inferSubcategoryFromMultipleTexts(texts)
      
      expect(result.inferredSubcategory).toBe('cash_withdrawal')
    })
  })

  describe('Edge Cases', () => {
    it('should handle special characters in text', () => {
      const result = inferSubcategory('ATM withdrawal @ $200.00 (bank fee: $2.50)')
      expect(result.inferredSubcategory).toBe('cash_withdrawal')
    })

    it('should handle very long text', () => {
      const longText = 'ATM '.repeat(1000) + 'withdrawal'
      const result = inferSubcategory(longText)
      expect(result.inferredSubcategory).toBe('cash_withdrawal')
    })

    it('should handle unicode characters', () => {
      const result = inferSubcategory('ATM withdrawal café résumé naïve')
      expect(result.inferredSubcategory).toBe('cash_withdrawal')
    })

    it('should handle newlines and tabs', () => {
      const result = inferSubcategory('ATM\n\twithdrawal\r\n$200')
      expect(result.inferredSubcategory).toBe('cash_withdrawal')
    })
  })

  describe('Custom Mappings', () => {
    it('should work with custom mappings', () => {
      const customMappings: SubcategoryMapping[] = [
        {
          subcategory: 'custom_category',
          keywords: ['custom', 'special'],
          patterns: ['\\bcustom\\s*keyword\\b'],
          weight: 1.0
        }
      ]
      
      const config: Partial<SubcategoryInferenceConfig> = {
        mappings: customMappings
      }
      
      const result = inferSubcategory('This is a custom keyword test', config)
      
      expect(result.inferredSubcategory).toBe('custom_category')
    })

    it('should handle empty mappings', () => {
      const config: Partial<SubcategoryInferenceConfig> = {
        mappings: []
      }
      
      const result = inferSubcategory('ATM withdrawal', config)
      
      expect(result.confidence).toBe(0)
      expect(result.inferredSubcategory).toBeUndefined()
    })

    it('should handle invalid regex patterns gracefully', () => {
      const customMappings: SubcategoryMapping[] = [
        {
          subcategory: 'test',
          keywords: ['valid'],
          patterns: ['[invalid(regex'], // Invalid regex
          weight: 1.0
        }
      ]
      
      const config: Partial<SubcategoryInferenceConfig> = {
        mappings: customMappings
      }
      
      // Should not throw, should fall back to keyword matching
      expect(() => inferSubcategory('valid keyword', config)).not.toThrow()
    })
  })
})
