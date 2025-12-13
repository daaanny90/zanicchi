# IVA Tracking Feature - User Guide

## Overview

This feature allows you to properly track IVA (VAT) on expenses, especially for B2B purchases from other EU countries where you need to pay Italian IVA separately (reverse charge mechanism).

## When to Use This Feature

### IVA Included (Default) ✓
- **Normal retail purchases**: You buy something from a store and pay the full price including IVA
- **Private purchases**: You buy with personal funds and IVA is already included
- **Example**: Buying office supplies from Amazon Italy - you pay €122 (€100 + €22 IVA)

### IVA NOT Included (B2B EU Reverse Charge)
- **B2B purchases from EU companies**: You buy with your Partita IVA from another EU country
- **Supplier doesn't charge you IVA**: The invoice shows only the net amount
- **You must pay Italian IVA**: You need to declare and pay 22% IVA to Italian authorities
- **Example**: Buying hardware from a German company - invoice shows €1,000 net, but you owe €220 IVA

## How to Use

### Creating an Expense

1. Click "Nuova Spesa" (New Expense)
2. Fill in the description, amount, category, and date
3. **IVA Section**:
   - **Checkbox "IVA Inclusa nell'importo"**: 
     - ✓ Checked (default): IVA is already paid, enter the total amount
     - ☐ Unchecked: IVA not included, enter only the net amount
   - **"Aliquota IVA (%)"**: Only appears when checkbox is unchecked
     - Default: 22% (standard Italian IVA rate)
     - Change if different rate applies

### Example 1: Retail Purchase (IVA Included)
```
Description: Office chair
Amount: €183 (includes IVA)
IVA Inclusa: ✓ Checked
→ Total cost: €183
```

### Example 2: German Hardware (IVA NOT Included)
```
Description: Laptop from German supplier
Amount: €1,000 (net price on invoice)
IVA Inclusa: ☐ Unchecked
Aliquota IVA: 22%
→ IVA to pay: €220
→ Total cost: €1,220
```

## What Happens in the App

### Expense List View
The expense list now shows:
- **Importo Netto**: The net amount (without IVA)
- **IVA**: Either "Inclusa" or the IVA amount you need to pay
- **Totale**: The actual total cost (net + IVA)

### Financial Calculations
- **Total Expenses**: Includes IVA amounts in the calculation
- **Net Income**: Correctly reflects actual costs including IVA
- **Tax Calculations**: Your forfettario tax calculations remain unchanged

## Database Migration

The database has been automatically updated with:
- `iva_included`: Boolean field (TRUE = IVA included, FALSE = not included)
- `iva_rate`: IVA percentage (default 22%)
- `iva_amount`: Calculated IVA amount (0 if included, calculated if not)

All existing expenses have been set to "IVA Included" with IVA amount = 0 to maintain backward compatibility.

## Important Notes

1. **For Regime Forfettario**: You don't charge IVA on your invoices, but you still need to pay IVA on purchases
2. **Reverse Charge**: When buying B2B from EU, the supplier doesn't charge you IVA, but you must pay it in Italy
3. **Expense Tracking**: This feature helps you track the actual cost including IVA you need to pay separately
4. **Total Cost**: The total expense calculation now includes IVA to give you accurate financial data

## Testing

The feature has been tested and verified:
- ✓ Database migration successful
- ✓ IVA calculation working correctly (22% of net amount)
- ✓ Expense summaries include IVA in totals
- ✓ Frontend form works with checkbox toggle
- ✓ Backward compatible with existing expenses

## Questions?

If you have questions about when to use this feature or how to classify your expenses, consult with your commercialista.
