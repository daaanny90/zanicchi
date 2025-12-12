# Freelancer Finance Manager

Modern, hour-driven bookkeeping for Italian freelancers operating under Regime Forfettario. Track clients, logged work, invoices, expenses, and see clean dashboards that highlight taxable income, INPS, savings progress, and the €85k annual revenue limit.

## Highlights
- **Hour-first analytics**: Monthly overview, dashboard estimates, and goal tracking are based exclusively on logged hours (rate × hours) with INPS deducted before income tax.
- **Invoice & expense tools**: VAT-free invoice flows, compact expense forms with categories, and dark theme ready UI.
- **Worked-hours suite**: Client manager with per-client hourly rate, manual hour logger, and monthly summaries per client.
- **Regime Forfettario helpers**: Annual revenue indicator, customizable taxable %, tax rate, health contribution, and currency.
- **Serious/modern UI**: Neutral palette, consistent spacing, reusable components built with native Web Components.

## Tech Stack
- **Frontend**: HTML, CSS custom properties, vanilla JS, native Web Components, Chart.js.
- **Backend**: Node.js 20, TypeScript, Express, MySQL2, Docker-ready.
- **Database**: MySQL 8 with tables for invoices, expenses, clients, worked hours, categories, and settings.

## Quick Start (Docker)
```bash
git clone <repo>
cd zanicchi
docker-compose up -d --build
```
Visit `http://localhost:8082` (frontend) and `http://localhost:3001/api` (API).  
Stop with `docker-compose down`.

⚠️ **Important**: Never use `docker-compose down -v` as it deletes your database! See [Backup & Update Guide](BACKUP_AND_UPDATE.md) for safe update procedures.

## 🔄 Updating & Backups

**Safe Update (Recommended)**
```bash
./safe-update.sh        # Automatically backs up, pulls code, rebuilds, and migrates
```

**Manual Operations**
```bash
./backup-db.sh          # Create database backup
./restore-db.sh <file>  # Restore from backup
./update-db.sh          # Apply database migrations
```

📖 **Full documentation**: [BACKUP_AND_UPDATE.md](BACKUP_AND_UPDATE.md) - Comprehensive guide to backups, restores, and safe updates.

## Local Development
```bash
# Backend
cd backend
cp .env.example .env   # update DB credentials
npm install
npm run dev            # or npm run build && npm start

# Frontend (static)
cd ../frontend/public
python -m http.server 8080  # or any static server
```
MySQL schema lives in `backend/src/database/init.sql`; lightweight sample data in `seed.sql`.

## Key Components
- `frontend/public/components`: dashboard-summary, monthly-estimate (invoices + hours panels), monthly-overview, monthly-worked-summary, clients/ categories managers, worked-hours modal, invoice/expense forms, charts, annual-limit-indicator.
- `frontend/public/styles`: `main.css` (tokens + light/dark themes), `dashboard.css`, `components.css`.
- `backend/src/services/dashboard.service.ts`: hour-based calculations, annual revenue tracking, tax math.
- `backend/src/utils/calc.utils.ts`: Regime Forfettario tax helper (INPS deductible before income tax).

## Core API Endpoints
All responses JSON (`/api/...`):
- `GET /invoices`, `POST /invoices`, `GET /expenses`, `POST /expenses`
- `GET /clients`, `POST /clients`, `DELETE /clients/:id` (cascade removes worked hours)
- `GET /worked-hours`, `POST /worked-hours`
- `GET /dashboard/summary`, `/monthly-estimate`, `/income-expense-chart`, `/annual-limit`
- `GET /settings`, `PUT /settings`

## Environment & Settings
- Configure credentials/tax defaults via `.env` or `docker-compose.yml`.
- Default currency: EUR; taxable percentage: 67%; income tax: 15%; INPS: 26.07.
- Regime-specific logic assumes invoices are VAT-free and dashboards ignore invoice totals for monthly accounting.

## License
MIT — use freely on your local/home server.

