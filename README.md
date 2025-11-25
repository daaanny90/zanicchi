# Freelancer Finance Manager 💼

A comprehensive web application for managing freelance finances, built with Node.js, TypeScript, MySQL, and native Web Components.

## 📋 Table of Contents

- [Features](#features)
- [Architecture](#architecture)
- [Technology Stack](#technology-stack)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Usage](#usage)
- [Project Structure](#project-structure)
- [API Documentation](#api-documentation)
- [Development](#development)
- [Docker Deployment](#docker-deployment)
- [Contributing](#contributing)

## ✨ Features

### Invoice Management
- Create, edit, and delete invoices
- Track invoice lifecycle (Draft → Sent → Paid/Overdue)
- Automatic tax calculation
- Invoice status tracking with automatic overdue detection
- Client management

### Expense Tracking
- Record business expenses with categories
- Categorize expenses for better reporting
- Date-based expense tracking
- Notes and descriptions for each expense

### Financial Dashboard
- **Summary Cards**: Total income, expenses, net income, and pending amounts
- **Monthly Estimate**: Current month's financial projection
- **Income vs Expenses Chart**: Line chart showing last 6 months trends
- **Expense Breakdown**: Pie chart showing expenses by category

### Settings & Configuration
- Configurable default tax rate
- Multi-currency support (EUR, USD, GBP, JPY)
- Customizable expense categories

### Network Accessibility
- Designed to run on a home server
- Accessible from any device on your local network
- No authentication required (single-user application)

## 🏗️ Architecture

This application follows a **modular, layered architecture**:

```
┌─────────────────────────────────────┐
│         Frontend (Web UI)           │
│   HTML + CSS + Web Components       │
│   Native JavaScript + Chart.js      │
└──────────────┬──────────────────────┘
               │ REST API (JSON)
┌──────────────┴──────────────────────┐
│       Backend (Node.js + TS)        │
│  ┌────────────────────────────────┐ │
│  │    Controllers (HTTP Layer)    │ │
│  └───────────┬────────────────────┘ │
│  ┌───────────┴────────────────────┐ │
│  │   Services (Business Logic)    │ │
│  └───────────┬────────────────────┘ │
│  ┌───────────┴────────────────────┐ │
│  │    Models (Data Structures)    │ │
│  └───────────┬────────────────────┘ │
└──────────────┼──────────────────────┘
               │ SQL Queries
┌──────────────┴──────────────────────┐
│         MySQL Database              │
│  invoices | expenses | categories   │
└─────────────────────────────────────┘
```

### Design Principles

1. **Separation of Concerns**: Each layer has a specific responsibility
2. **Modularity**: Features are organized in separate files/folders
3. **Type Safety**: TypeScript provides compile-time type checking
4. **RESTful API**: Standard HTTP methods and resource-based URLs
5. **Component-Based UI**: Native Web Components for reusable UI elements

## 🛠️ Technology Stack

### Backend
- **Node.js** (v20+) - JavaScript runtime
- **TypeScript** - Type-safe JavaScript
- **Express.js** - Web framework
- **MySQL2** - MySQL database driver
- **dotenv** - Environment variable management

### Frontend
- **HTML5** - Semantic markup
- **CSS3** - Modern styling with CSS Grid and Flexbox
- **Vanilla JavaScript** - No framework overhead
- **Web Components** - Native component architecture
- **Chart.js** - Data visualization

### DevOps
- **Docker** - Containerization
- **Docker Compose** - Multi-container orchestration
- **Nginx** - Web server for frontend

### Database
- **MySQL 8.0** - Relational database

## 📦 Prerequisites

Choose one of the following options:

### Option 1: Docker (Recommended)
- [Docker](https://docs.docker.com/get-docker/) (v20.10+)
- [Docker Compose](https://docs.docker.com/compose/install/) (v2.0+)

### Option 2: Local Development
- [Node.js](https://nodejs.org/) (v20+)
- [MySQL](https://www.mysql.com/) (v8.0+)
- npm (comes with Node.js)

## 🚀 Installation

### Option 1: Docker Deployment (Recommended for Home Server)

1. **Clone the repository**
```bash
git clone <repository-url>
cd zanicchi
```

2. **Configure environment (optional)**
```bash
# Edit docker-compose.yml to change passwords and settings
nano docker-compose.yml
```

3. **Start the application**
```bash
docker-compose up -d
```

4. **Access the application**
- Frontend: http://localhost:8080
- Backend API: http://localhost:3000/api
- From other devices: http://YOUR_SERVER_IP:8080

5. **View logs**
```bash
docker-compose logs -f
```

6. **Stop the application**
```bash
docker-compose down
```

### Option 2: Local Development

1. **Clone the repository**
```bash
git clone <repository-url>
cd zanicchi
```

2. **Set up the database**
```bash
# Create MySQL database
mysql -u root -p
CREATE DATABASE freelancer_finance;
exit;

# Import schema
mysql -u root -p freelancer_finance < backend/src/database/init.sql

# Optional: Import sample data
mysql -u root -p freelancer_finance < backend/src/database/seed.sql
```

3. **Configure backend**
```bash
cd backend
cp .env.example .env
# Edit .env file with your database credentials
nano .env
```

4. **Install backend dependencies**
```bash
npm install
```

5. **Start the backend**
```bash
# Development mode (with auto-reload)
npm run dev

# Production mode
npm run build
npm start
```

6. **Serve the frontend**
```bash
cd ../frontend/public

# Option 1: Using Python
python -m http.server 8080

# Option 2: Using Node.js http-server
npx http-server -p 8080

# Option 3: Using PHP
php -S localhost:8080
```

7. **Access the application**
- Frontend: http://localhost:8080
- Backend API: http://localhost:3000/api

## 📱 Usage

### Creating an Invoice

1. Navigate to the **Invoices** section
2. Click **+ New Invoice**
3. Fill in the invoice details:
   - Invoice number
   - Client name
   - Description
   - Amount (tax calculated automatically)
   - Tax rate (uses default from settings)
   - Issue date and due date
4. Click **Save Invoice**

### Recording an Expense

1. Navigate to the **Expenses** section
2. Click **+ New Expense**
3. Fill in the expense details:
   - Description
   - Amount
   - Category
   - Date
   - Optional notes
4. Click **Save Expense**

### Viewing Dashboard

The dashboard automatically displays:
- **Summary Cards**: Key financial metrics
- **Monthly Estimate**: Current month projection
- **Charts**: Visual representation of financial data

### Updating Settings

1. Navigate to the **Settings** section
2. Modify:
   - Default tax rate
   - Currency
3. Click **Save Settings**

## 📁 Project Structure

```
zanicchi/
├── backend/                      # Node.js backend
│   ├── src/
│   │   ├── config/              # Configuration files
│   │   │   ├── database.ts      # MySQL connection pool
│   │   │   └── app.config.ts    # App settings
│   │   ├── models/              # TypeScript interfaces
│   │   │   ├── Invoice.model.ts
│   │   │   ├── Expense.model.ts
│   │   │   ├── Category.model.ts
│   │   │   └── Settings.model.ts
│   │   ├── services/            # Business logic
│   │   │   ├── invoice.service.ts
│   │   │   ├── expense.service.ts
│   │   │   ├── dashboard.service.ts
│   │   │   ├── category.service.ts
│   │   │   └── settings.service.ts
│   │   ├── controllers/         # HTTP request handlers
│   │   │   ├── invoice.controller.ts
│   │   │   ├── expense.controller.ts
│   │   │   ├── dashboard.controller.ts
│   │   │   ├── category.controller.ts
│   │   │   └── settings.controller.ts
│   │   ├── routes/              # API route definitions
│   │   │   ├── invoice.routes.ts
│   │   │   ├── expense.routes.ts
│   │   │   ├── dashboard.routes.ts
│   │   │   ├── category.routes.ts
│   │   │   ├── settings.routes.ts
│   │   │   └── index.ts
│   │   ├── middleware/          # Express middleware
│   │   │   ├── error.middleware.ts
│   │   │   ├── logger.middleware.ts
│   │   │   └── validation.middleware.ts
│   │   ├── utils/               # Utility functions
│   │   │   ├── date.utils.ts
│   │   │   ├── calc.utils.ts
│   │   │   └── response.utils.ts
│   │   ├── database/            # Database scripts
│   │   │   ├── init.sql         # Schema definition
│   │   │   └── seed.sql         # Sample data
│   │   ├── app.ts               # Express app setup
│   │   └── server.ts            # Application entry point
│   ├── package.json
│   ├── tsconfig.json
│   ├── Dockerfile
│   └── .env.example
│
├── frontend/                     # Frontend application
│   └── public/
│       ├── index.html           # Main HTML file
│       ├── components/          # Web Components
│       │   ├── app-header.js
│       │   ├── dashboard-summary.js
│       │   ├── monthly-estimate.js
│       │   ├── invoice-list.js
│       │   ├── invoice-form.js
│       │   ├── expense-list.js
│       │   ├── expense-form.js
│       │   ├── chart-income-expense.js
│       │   ├── chart-expense-category.js
│       │   └── settings-panel.js
│       ├── styles/              # CSS files
│       │   ├── main.css         # Global styles
│       │   ├── dashboard.css    # Layout styles
│       │   ├── components.css   # Component styles
│       │   └── charts.css       # Chart styles
│       └── js/                  # JavaScript utilities
│           ├── api.js           # API client
│           ├── utils.js         # Helper functions
│           ├── chart-helper.js  # Chart utilities
│           └── app.js           # App initialization
│
├── docker-compose.yml           # Docker orchestration
├── .env.example                 # Environment template
└── README.md                    # This file
```

## 📚 API Documentation

### Base URL
```
http://localhost:3000/api
```

### Endpoints

#### Invoices
- `GET /invoices` - Get all invoices
- `GET /invoices/:id` - Get invoice by ID
- `POST /invoices` - Create new invoice
- `PUT /invoices/:id` - Update invoice
- `PATCH /invoices/:id/status` - Update invoice status
- `DELETE /invoices/:id` - Delete invoice

#### Expenses
- `GET /expenses` - Get all expenses
- `GET /expenses/:id` - Get expense by ID
- `POST /expenses` - Create new expense
- `PUT /expenses/:id` - Update expense
- `DELETE /expenses/:id` - Delete expense

#### Dashboard
- `GET /dashboard/summary` - Get financial summary
- `GET /dashboard/monthly-estimate` - Get current month estimate
- `GET /dashboard/income-expense-chart` - Get chart data for income vs expenses
- `GET /dashboard/expense-by-category` - Get expense breakdown by category

#### Categories
- `GET /categories` - Get all categories
- `POST /categories` - Create new category

#### Settings
- `GET /settings` - Get application settings
- `PUT /settings` - Update settings

### Response Format

All API responses follow this structure:

```json
{
  "success": true,
  "data": { /* response data */ },
  "message": "Optional success message"
}
```

Error responses:

```json
{
  "success": false,
  "error": "Error message"
}
```

## 🔧 Development

### Backend Development

```bash
cd backend

# Install dependencies
npm install

# Run in development mode (auto-reload)
npm run dev

# Build TypeScript
npm run build

# Run in production mode
npm start
```

### Frontend Development

The frontend uses vanilla JavaScript and doesn't require a build step. Simply serve the files:

```bash
cd frontend/public
python -m http.server 8080
```

### Code Style

- **TypeScript**: Strict mode enabled, full type annotations
- **Comments**: Extensive inline documentation
- **Naming**: camelCase for variables/functions, PascalCase for classes
- **Formatting**: 2-space indentation

## 🐳 Docker Deployment

### Building and Running

```bash
# Build and start all services
docker-compose up -d --build

# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Remove all data (WARNING: deletes database)
docker-compose down -v
```

### Network Access

To access from other devices on your network:

1. Find your server's IP address:
```bash
# Linux/Mac
ifconfig

# Windows
ipconfig
```

2. Access from other devices:
```
http://YOUR_SERVER_IP:8080
```

3. **Firewall Configuration**: Ensure ports 8080 and 3000 are open:
```bash
# Ubuntu/Debian
sudo ufw allow 8080
sudo ufw allow 3000

# CentOS/RHEL
sudo firewall-cmd --add-port=8080/tcp --permanent
sudo firewall-cmd --add-port=3000/tcp --permanent
sudo firewall-cmd --reload
```

## 🎨 Customization

### Changing Default Tax Rate

Edit `docker-compose.yml`:
```yaml
environment:
  DEFAULT_TAX_RATE: 25  # Change to your rate
```

### Adding New Expense Categories

Categories can be added through the API or directly in the database:

```sql
INSERT INTO categories (name, type, color) VALUES
('New Category', 'expense', '#hexcolor');
```

### Changing Currency

Edit `docker-compose.yml`:
```yaml
environment:
  CURRENCY: USD  # EUR, USD, GBP, JPY
```

## 🔒 Security Considerations

Since this application is designed for local network use:

1. **No Built-in Authentication**: The app has no login system. It's assumed you trust your local network.
2. **Change Default Passwords**: Update MySQL passwords in `docker-compose.yml`
3. **Firewall Rules**: Only expose ports 3000 and 8080 to your local network, not the internet
4. **HTTPS**: For production internet access, add HTTPS using a reverse proxy (Nginx/Caddy)

## 🤝 Contributing

This is a personal project, but contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes with proper comments
4. Test thoroughly
5. Submit a pull request

## 📝 License

MIT License - feel free to use and modify for your needs.

## 🐛 Troubleshooting

### Backend won't start
- Check MySQL is running: `docker-compose ps`
- View logs: `docker-compose logs backend`
- Verify database credentials in `.env` or `docker-compose.yml`

### Frontend can't connect to API
- Check backend is running and healthy: `curl http://localhost:3000/health`
- Verify API_BASE_URL in `frontend/public/js/api.js`
- Check browser console for CORS errors

### Database connection errors
- Wait for MySQL to fully initialize (30-60 seconds on first start)
- Check credentials match between backend config and MySQL setup
- Verify network connectivity: `docker network inspect zanicchi_app-network`

### Charts not displaying
- Check Chart.js is loaded: View browser console
- Verify data is being fetched: Check Network tab in browser dev tools
- Ensure you have some invoices/expenses created

## 📧 Support

For issues and questions, please open an issue on GitHub or contact the maintainer.

---

**Built with ❤️ for freelancers who want to take control of their finances**

