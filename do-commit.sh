#!/bin/bash
cd /Users/dasp/Personal/Projects/zanicchi

# Add all changes
git add -A

# Commit with message
git commit -m "Add annual revenue limit indicator for Italian flat-tax regime

Backend Changes:
- New getAnnualRevenueLimit() service function
- Calculates total invoiced revenue for current year
- Compares against 85,000 € regime forfettario limit
- Returns: total, remaining, percentage, status (safe/attention/critical)
- Uses invoice issue_date and total_amount (full invoiced amount)
- New /api/dashboard/annual-limit endpoint

Frontend Changes:
- New annual-limit-indicator web component
- Displays comprehensive limit tracking card
- Color-coded status system:
  * Green (0-69%): Safe zone
  * Orange (70-89%): Attention zone
  * Red (90-100%): Critical zone
- Visual progress bar with percentage markers
- Shows: total invoiced, limit, remaining amount, invoice count
- Status-specific messages and icons
- Integrated into main dashboard above monthly estimates
- Fully responsive design with glassmorphism effects

Risk Indicators:
- Progress bar changes color based on usage level
- Status badges with contextual warnings
- Clear messaging about when to be cautious
- Markers at 70% and 90% thresholds on progress bar"

# Create and checkout new branch
git checkout -b new-style

