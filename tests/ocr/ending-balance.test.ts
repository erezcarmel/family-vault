/**
 * Tests for the OCR Ending Balance Detection Module
 */

import {
  extractAmounts,
  extractDates,
  detectEndingBalance,
  processOcrText,
  formatAmount,
  formatDate,
  hasExtractableContent,
  containsBalanceKeywords,
} from '../../lib/ocr/ocrScanner'
import { createOcrConfig, DEFAULT_OCR_CONFIG } from '../../lib/ocr/config'
import endingBalanceSample from '../fixtures/ocr/ending-balance-sample.json'

describe('Amount Extraction', () => {
  describe('extractAmounts', () => {
    it('should extract amounts with dollar signs', () => {
      const text = 'Balance: $1,234.56'
      const amounts = extractAmounts(text)
      
      expect(amounts).toHaveLength(1)
      expect(amounts[0].value).toBe(1234.56)
      expect(amounts[0].currencySymbol).toBe('$')
      expect(amounts[0].isNegative).toBe(false)
    })

    it('should extract amounts with other currency symbols', () => {
      const text = 'Balance: €500.00 and £200.50'
      const amounts = extractAmounts(text)
      
      expect(amounts).toHaveLength(2)
      expect(amounts.some(a => a.currencySymbol === '€' && a.value === 500.00)).toBe(true)
      expect(amounts.some(a => a.currencySymbol === '£' && a.value === 200.50)).toBe(true)
    })

    it('should extract negative amounts in parentheses', () => {
      const text = 'Balance: ($500.00)'
      const amounts = extractAmounts(text)
      
      expect(amounts).toHaveLength(1)
      expect(amounts[0].value).toBe(-500.00)
      expect(amounts[0].isNegative).toBe(true)
    })

    it('should extract negative amounts with minus sign', () => {
      const text = 'Balance: $-250.00'
      const amounts = extractAmounts(text)
      
      expect(amounts).toHaveLength(1)
      expect(amounts[0].value).toBe(-250.00)
      expect(amounts[0].isNegative).toBe(true)
    })

    it('should extract plain amounts without currency symbols', () => {
      const text = 'Amount: 1,234.56'
      const amounts = extractAmounts(text)
      
      expect(amounts).toHaveLength(1)
      expect(amounts[0].value).toBe(1234.56)
      expect(amounts[0].currencySymbol).toBeUndefined()
    })

    it('should extract multiple amounts from multiple lines', () => {
      const text = 'Opening: $1,000.00\nClosing: $2,500.50'
      const amounts = extractAmounts(text)
      
      expect(amounts).toHaveLength(2)
      expect(amounts[0].value).toBe(1000.00)
      expect(amounts[1].value).toBe(2500.50)
      expect(amounts[0].lineNumber).toBe(0)
      expect(amounts[1].lineNumber).toBe(1)
    })

    it('should handle European decimal format', () => {
      const text = '€1.234,56'
      const amounts = extractAmounts(text)
      
      expect(amounts).toHaveLength(1)
      expect(amounts[0].value).toBe(1234.56)
    })

    it('should return empty array for text without amounts', () => {
      const text = 'No amounts here'
      const amounts = extractAmounts(text)
      
      expect(amounts).toHaveLength(0)
    })
  })
})

describe('Date Extraction', () => {
  describe('extractDates', () => {
    it('should extract ISO format dates (YYYY-MM-DD)', () => {
      const text = 'Date: 2024-01-15'
      const dates = extractDates(text)
      
      expect(dates).toHaveLength(1)
      expect(dates[0].date.toISOString().split('T')[0]).toBe('2024-01-15')
      expect(dates[0].format).toBe('YYYY-MM-DD')
    })

    it('should extract US format dates (MM/DD/YYYY)', () => {
      const text = 'Date: 01/15/2024'
      const dates = extractDates(text)
      
      expect(dates).toHaveLength(1)
      expect(dates[0].date.getUTCMonth()).toBe(0) // January
      expect(dates[0].date.getUTCDate()).toBe(15)
      expect(dates[0].date.getUTCFullYear()).toBe(2024)
    })

    it('should extract dates with month names (long)', () => {
      const text = 'Date: January 15, 2024'
      const dates = extractDates(text)
      
      expect(dates).toHaveLength(1)
      expect(dates[0].date.toISOString().split('T')[0]).toBe('2024-01-15')
      expect(dates[0].format).toBe('MONTH DD, YYYY')
    })

    it('should extract dates with month names (short)', () => {
      const text = 'Date: Jan 15, 2024'
      const dates = extractDates(text)
      
      expect(dates).toHaveLength(1)
      expect(dates[0].date.toISOString().split('T')[0]).toBe('2024-01-15')
    })

    it('should extract DD MONTH YYYY format', () => {
      const text = 'Date: 15 January 2024'
      const dates = extractDates(text)
      
      expect(dates).toHaveLength(1)
      expect(dates[0].date.toISOString().split('T')[0]).toBe('2024-01-15')
      expect(dates[0].format).toBe('DD MONTH YYYY')
    })

    it('should extract multiple dates from text', () => {
      const text = 'From: 01/01/2024 To: 01/31/2024'
      const dates = extractDates(text)
      
      expect(dates).toHaveLength(2)
    })

    it('should handle dates with different separators', () => {
      const text = 'Dates: 15/01/2024 15-01-2024 15.01.2024'
      const dates = extractDates(text)
      
      expect(dates.length).toBeGreaterThanOrEqual(1)
    })

    it('should return empty array for text without dates', () => {
      const text = 'No dates here, just 12345 and $100.00'
      const dates = extractDates(text)
      
      expect(dates).toHaveLength(0)
    })

    it('should track line numbers correctly', () => {
      const text = 'Line 0: 01/01/2024\nLine 1: text\nLine 2: 01/15/2024'
      const dates = extractDates(text)
      
      expect(dates).toHaveLength(2)
      expect(dates[0].lineNumber).toBe(0)
      expect(dates[1].lineNumber).toBe(2)
    })
  })
})

describe('Ending Balance Detection', () => {
  describe('detectEndingBalance', () => {
    it('should detect ending balance with keyword and date', () => {
      const text = `
        01/01/2024 Opening Balance $1,000.00
        01/15/2024 Transaction $500.00
        01/31/2024 Ending Balance: $1,500.00
      `
      const result = detectEndingBalance(text)
      
      expect(result.endingBalance).not.toBeNull()
      expect(result.endingBalance?.value).toBe(1500.00)
      expect(result.confidence).toBeGreaterThan(0.5)
    })

    it('should prefer amounts near balance keywords', () => {
      const text = `
        01/31/2024 Transaction Amount: $500.00
        01/31/2024 Closing Balance: $2,500.00
      `
      const result = detectEndingBalance(text)
      
      expect(result.endingBalance?.value).toBe(2500.00)
      expect(result.selectionReason).toContain('keyword')
    })

    it('should select latest date when no keywords present', () => {
      const text = `
        01/01/2024 $1,000.00
        01/15/2024 $1,200.00
        01/31/2024 $1,500.00
      `
      const result = detectEndingBalance(text)
      
      expect(result.endingBalance?.value).toBe(1500.00)
      expect(result.endingDate?.date.getUTCDate()).toBe(31)
    })

    it('should handle multiple amounts on same date', () => {
      const text = `
        01/31/2024 Debit $100.00
        01/31/2024 Credit $500.00
        01/31/2024 Balance $1,500.00
      `
      const result = detectEndingBalance(text)
      
      // Should prefer the larger amount as it looks like a balance
      expect(result.endingBalance?.value).toBe(1500.00)
    })

    it('should handle no dates in document', () => {
      const text = `
        Account Balance: $5,000.00
        Available Balance: $4,800.00
      `
      const result = detectEndingBalance(text)
      
      expect(result.endingBalance).not.toBeNull()
      expect(result.allDates).toHaveLength(0)
    })

    it('should handle no amounts in document', () => {
      const text = 'Statement for January 2024'
      const result = detectEndingBalance(text)
      
      expect(result.endingBalance).toBeNull()
      expect(result.confidence).toBe(0)
    })

    it('should prefer currency symbol amounts when configured', () => {
      const text = `
        01/31/2024 Amount: 1500.00
        01/31/2024 Balance: $1500.00
      `
      const result = detectEndingBalance(text, { 
        ...DEFAULT_OCR_CONFIG, 
        preferCurrencySymbol: true 
      })
      
      expect(result.endingBalance?.currencySymbol).toBe('$')
    })
  })

  describe('Sample fixture test', () => {
    it('should correctly identify ending balance from sample OCR', () => {
      const result = detectEndingBalance(endingBalanceSample.text)
      
      expect(result.endingBalance).not.toBeNull()
      expect(result.endingBalance?.value).toBe(endingBalanceSample.expectedEndingBalance.value)
      expect(result.endingBalance?.currencySymbol).toBe(endingBalanceSample.expectedEndingBalance.currencySymbol)
      
      // Check date
      expect(result.endingDate).not.toBeNull()
      const expectedDate = new Date(endingBalanceSample.expectedEndingDate.date)
      expect(result.endingDate?.date.toISOString().split('T')[0])
        .toBe(expectedDate.toISOString().split('T')[0])
    })

    it('should have high confidence for sample with keywords', () => {
      const result = detectEndingBalance(endingBalanceSample.text)
      
      // Should have high confidence since "Ending Balance:" keyword is present
      expect(result.confidence).toBeGreaterThanOrEqual(0.7)
    })

    it('should extract all amounts from sample', () => {
      const result = detectEndingBalance(endingBalanceSample.text)
      
      // Sample has multiple transactions and balances
      expect(result.allAmounts.length).toBeGreaterThan(5)
    })

    it('should extract all dates from sample', () => {
      const result = detectEndingBalance(endingBalanceSample.text)
      
      // Sample has dates for each transaction
      expect(result.allDates.length).toBeGreaterThan(5)
    })
  })
})

describe('OCR Scanner', () => {
  describe('processOcrText', () => {
    it('should process text and return enhanced result', () => {
      const text = '01/31/2024 Ending Balance: $1,000.00'
      const result = processOcrText(text)
      
      expect(result.endingBalance).toBeDefined()
      expect(result.rawText).toBe(text)
      expect(result.processedAt).toBeInstanceOf(Date)
      expect(result.config).toBeDefined()
    })

    it('should accept configuration overrides', () => {
      const text = 'Final Amount: $1,000.00'
      const result = processOcrText(text, {
        balanceKeywords: ['final amount']
      })
      
      expect(result.config.balanceKeywords).toContain('final amount')
    })
  })

  describe('formatAmount', () => {
    it('should format positive amount with currency', () => {
      const amount = {
        raw: '$1234.56',
        value: 1234.56,
        currencySymbol: '$',
        isNegative: false,
        position: 0,
        lineNumber: 0,
      }
      
      expect(formatAmount(amount)).toBe('$1,234.56')
    })

    it('should format negative amount', () => {
      const amount = {
        raw: '-$500.00',
        value: -500.00,
        currencySymbol: '$',
        isNegative: true,
        position: 0,
        lineNumber: 0,
      }
      
      expect(formatAmount(amount)).toBe('-$500.00')
    })
  })

  describe('formatDate', () => {
    it('should format date in ISO format', () => {
      const date = {
        raw: '01/15/2024',
        date: new Date(Date.UTC(2024, 0, 15)),
        format: 'MM/DD/YYYY' as const,
        position: 0,
        lineNumber: 0,
      }
      
      expect(formatDate(date)).toBe('2024-01-15')
    })
  })

  describe('hasExtractableContent', () => {
    it('should return true for text with amounts', () => {
      expect(hasExtractableContent('Balance: $1,000.00')).toBe(true)
    })

    it('should return false for text without amounts', () => {
      expect(hasExtractableContent('No amounts here')).toBe(false)
    })
  })

  describe('containsBalanceKeywords', () => {
    it('should return true for text with balance keywords', () => {
      expect(containsBalanceKeywords('Ending Balance: $1,000.00')).toBe(true)
    })

    it('should return false for text without balance keywords', () => {
      expect(containsBalanceKeywords('Transaction: $1,000.00')).toBe(false)
    })

    it('should be case insensitive', () => {
      expect(containsBalanceKeywords('ENDING BALANCE: $1,000.00')).toBe(true)
    })
  })
})

describe('Configuration', () => {
  describe('createOcrConfig', () => {
    it('should return default config with no overrides', () => {
      const config = createOcrConfig()
      
      expect(config).toEqual(DEFAULT_OCR_CONFIG)
    })

    it('should merge overrides with defaults', () => {
      const config = createOcrConfig({ maxLineDistance: 5 })
      
      expect(config.maxLineDistance).toBe(5)
      expect(config.balanceKeywords).toEqual(DEFAULT_OCR_CONFIG.balanceKeywords)
    })

    it('should allow custom balance keywords', () => {
      const customKeywords = ['custom balance', 'total']
      const config = createOcrConfig({ balanceKeywords: customKeywords })
      
      expect(config.balanceKeywords).toEqual(customKeywords)
    })
  })

  describe('DEFAULT_OCR_CONFIG', () => {
    it('should have required balance keywords', () => {
      expect(DEFAULT_OCR_CONFIG.balanceKeywords).toContain('ending balance')
      expect(DEFAULT_OCR_CONFIG.balanceKeywords).toContain('closing balance')
      expect(DEFAULT_OCR_CONFIG.balanceKeywords).toContain('available balance')
    })

    it('should have reasonable proximity thresholds', () => {
      expect(DEFAULT_OCR_CONFIG.maxLineDistance).toBeGreaterThan(0)
      expect(DEFAULT_OCR_CONFIG.maxCharDistance).toBeGreaterThan(0)
    })
  })
})
