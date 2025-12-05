# OCR Subcategory Inference Configuration

This directory contains configuration for the OCR subcategory inference feature, which automatically suggests or populates the sub-category field when scanned document text matches configured keywords or patterns.

## Overview

The OCR scanning pipeline includes a lightweight inference step that:
1. Scans extracted plain text for keywords and regex patterns
2. Matches against configured subcategory mappings
3. Returns a ranked list of candidates with confidence scores
4. Optionally auto-populates the subcategory field based on confidence threshold

## Configuration Files

### `subcategory-mapping.ts`

Contains the mapping configuration with the following structure:

```typescript
interface SubcategoryMapping {
  subcategory: string    // The subcategory identifier (e.g., 'cash_withdrawal')
  keywords: string[]     // Exact keywords to match (case-insensitive)
  patterns: string[]     // Regex patterns for flexible matching
  weight: number         // Priority multiplier (default: 1.0)
}

interface SubcategoryInferenceConfig {
  autoPopulate: boolean                 // Enable auto-population (default: true)
  minConfidenceForAutoPopulate: number  // Threshold for auto-population (default: 0.6)
  maxCandidates: number                 // Max suggestions to return (default: 5)
  mappings: SubcategoryMapping[]        // The mapping definitions
}
```

## Mapping Format

### Keywords

Keywords are exact strings matched with word boundaries (case-insensitive):

```typescript
{
  subcategory: 'grocery',
  keywords: ['grocery', 'supermarket', 'food', 'produce'],
  // ...
}
```

- "grocery" matches "GROCERY", "Grocery", "grocery store"
- Does NOT match "grocerystore" (no word boundary)

### Patterns

Patterns are regular expressions (case-insensitive):

```typescript
{
  subcategory: 'grocery',
  patterns: [
    '\\b(whole\\s?foods|trader\\s?joe\'?s?|safeway|kroger)\\b',
    '\\bgrocery\\s*(?:store)?\\b'
  ],
  // ...
}
```

Pattern tips:
- Use `\\b` for word boundaries
- Use `\\s*` or `\\s?` for optional whitespace
- Use `(?:...)` for non-capturing groups
- Use `?` for optional characters (e.g., `joe\'?s?` matches "joe", "joe's", "joes")

### Weight

Higher weights increase the score for matches:

```typescript
{
  subcategory: 'cash_withdrawal',
  weight: 1.2  // 20% bonus over default
}
```

Use weights to prioritize more specific or important categories.

## Scoring Algorithm

1. **Match Count**: More matches increase confidence (logarithmic scale)
2. **Specificity**: Longer matching phrases score higher
3. **Weight**: Applied as a multiplier to the base score

Final confidence score is capped at 1.0.

## Adding New Mappings

To add a new subcategory mapping:

1. Edit `subcategory-mapping.ts`
2. Add a new entry to `defaultSubcategoryMappings`:

```typescript
{
  subcategory: 'your_subcategory_id',
  keywords: ['keyword1', 'keyword2'],
  patterns: ['\\bpattern\\s*here\\b'],
  weight: 1.0
}
```

3. Run tests to verify: `npm test`

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `OCR_AUTO_POPULATE_SUBCATEGORY` | Set to `'false'` to disable auto-population | `true` |

## API Response

The scan-document API returns subcategory inference in the response:

```json
{
  "success": true,
  "data": { /* extracted document data */ },
  "subcategoryInference": {
    "inferredSubcategory": "cash_withdrawal",
    "confidence": 0.75,
    "autoPopulate": true,
    "candidates": [
      { "subcategory": "cash_withdrawal", "score": 0.75, "matchedText": "ATM withdrawal" },
      { "subcategory": "pos_purchase", "score": 0.32, "matchedText": "purchase" }
    ]
  }
}
```

## Examples

### ATM Withdrawal

Document text containing "ATM withdrawal" or "cash out" will match:

```typescript
{
  subcategory: 'cash_withdrawal',
  keywords: ['atm', 'withdrawal', 'cash out'],
  patterns: ['\\batm\\s*withdraw(?:al)?\\b'],
  weight: 1.2
}
```

### Grocery Stores (Vendor-based)

Vendor names like "Whole Foods", "Trader Joe's", etc. map to grocery:

```typescript
{
  subcategory: 'grocery',
  keywords: ['grocery', 'supermarket'],
  patterns: ['\\b(whole\\s?foods|trader\\s?joe\'?s?)\\b'],
  weight: 1.0
}
```

### Fuel Purchases

Gas station brands map to fuel:

```typescript
{
  subcategory: 'fuel',
  keywords: ['fuel', 'gas', 'gasoline'],
  patterns: ['\\b(shell|exxon|chevron|bp)\\b'],
  weight: 1.0
}
```
