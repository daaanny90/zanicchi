#!/bin/bash
# ============================================================================
# Freelancer Finance Manager - Database Update Script
# ============================================================================
# This script safely updates the database schema to the latest version.
# Run this script whenever you update the application and need to apply
# database changes (new tables, columns, indexes, etc.).
#
# Usage:
#   ./update-db.sh
#
# The script will:
#   1. Check if the database container is running
#   2. Execute the migration SQL script
#   3. Provide clear feedback on success or failure
# ============================================================================

set -e  # Exit on error

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration - adjust these if your container names differ
DB_CONTAINER="freelancer-finance-db"
DB_NAME="freelancer_finance"
DB_USER="root"
DB_PASSWORD="root_password_change_me"
MIGRATION_FILE="./backend/src/database/migrate.sql"

echo "============================================================================"
echo "  Freelancer Finance Manager - Database Update"
echo "============================================================================"
echo ""

# Check if migration file exists
if [ ! -f "$MIGRATION_FILE" ]; then
    echo -e "${RED}Error: Migration file not found at $MIGRATION_FILE${NC}"
    echo "Make sure you're running this script from the project root directory."
    exit 1
fi

# Check if Docker container is running
if ! docker ps | grep -q "$DB_CONTAINER"; then
    echo -e "${RED}Error: Database container '$DB_CONTAINER' is not running.${NC}"
    echo "Please start your containers first with: docker compose up -d"
    exit 1
fi

echo -e "${YELLOW}Checking database connection...${NC}"

# Test database connection
if ! docker exec "$DB_CONTAINER" mysql -u"$DB_USER" -p"$DB_PASSWORD" -e "SELECT 1;" > /dev/null 2>&1; then
    echo -e "${RED}Error: Cannot connect to database.${NC}"
    echo "Please check your database credentials and container status."
    exit 1
fi

echo -e "${GREEN}✓ Database connection successful${NC}"
echo ""
echo -e "${YELLOW}Running database migrations...${NC}"
echo ""

# Execute the migration script
if docker exec -i "$DB_CONTAINER" mysql -u"$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" < "$MIGRATION_FILE"; then
    echo ""
    echo -e "${GREEN}============================================================================${NC}"
    echo -e "${GREEN}  ✓ Database migration completed successfully!${NC}"
    echo -e "${GREEN}============================================================================${NC}"
    echo ""
    echo "Your database is now up to date with the latest schema changes."
    echo "You can now restart your application if needed."
    exit 0
else
    echo ""
    echo -e "${RED}============================================================================${NC}"
    echo -e "${RED}  ✗ Database migration failed!${NC}"
    echo -e "${RED}============================================================================${NC}"
    echo ""
    echo "Please check the error messages above and try again."
    echo "If the problem persists, you may need to:"
    echo "  1. Check the migration SQL file for syntax errors"
    echo "  2. Verify database permissions"
    echo "  3. Review application logs for more details"
    exit 1
fi
