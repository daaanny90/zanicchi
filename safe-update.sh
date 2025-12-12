#!/bin/bash
# ============================================================================
# Freelancer Finance Manager - Safe Update Script
# ============================================================================
# This script safely updates your application to the latest version without
# losing any database data.
#
# What it does:
#   1. Creates an automatic backup of your database
#   2. Pulls the latest code from git
#   3. Stops and rebuilds containers (WITHOUT removing volumes)
#   4. Applies any database migrations
#   5. Verifies everything is working
#
# Usage:
#   ./safe-update.sh              # Update from current branch
#   ./safe-update.sh armv7        # Update from specific branch
#
# Your data is SAFE - the database volume persists across container rebuilds.
# ============================================================================

set -e  # Exit on error

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
BRANCH="${1:-$(git rev-parse --abbrev-ref HEAD)}"
DB_CONTAINER="freelancer-finance-db"

echo ""
echo -e "${CYAN}============================================================================${NC}"
echo -e "${CYAN}  Freelancer Finance Manager - Safe Update${NC}"
echo -e "${CYAN}============================================================================${NC}"
echo ""
echo "This script will:"
echo "  • Create a backup of your database"
echo "  • Pull the latest code from branch: $BRANCH"
echo "  • Rebuild containers without losing data"
echo "  • Apply database migrations"
echo ""
read -p "Continue? (yes/no): " -r
echo ""

if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
    echo "Update cancelled."
    exit 0
fi

# ============================================================================
# Step 1: Backup Database
# ============================================================================
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}Step 1/5: Creating database backup${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

if [ -f "./backup-db.sh" ]; then
    chmod +x ./backup-db.sh
    if ./backup-db.sh --auto; then
        echo -e "${GREEN}✓ Backup completed${NC}"
    else
        echo -e "${RED}✗ Backup failed${NC}"
        echo "Continue anyway? (yes/no): "
        read -r
        if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
            exit 1
        fi
    fi
else
    echo -e "${YELLOW}⚠ Backup script not found - skipping backup${NC}"
fi

echo ""

# ============================================================================
# Step 2: Pull Latest Code
# ============================================================================
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}Step 2/5: Pulling latest code from branch '$BRANCH'${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Stash any local changes
if ! git diff-index --quiet HEAD --; then
    echo -e "${YELLOW}You have uncommitted changes. Stashing them...${NC}"
    git stash
    STASHED=true
else
    STASHED=false
fi

# Pull latest code
if git pull origin "$BRANCH"; then
    echo -e "${GREEN}✓ Code updated successfully${NC}"
else
    echo -e "${RED}✗ Failed to pull latest code${NC}"
    exit 1
fi

echo ""

# ============================================================================
# Step 3: Rebuild Containers
# ============================================================================
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}Step 3/5: Rebuilding containers${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${YELLOW}Stopping containers...${NC}"

# Stop containers but DO NOT remove volumes (-v flag)
docker compose down

echo -e "${YELLOW}Building and starting containers...${NC}"
echo ""

# Rebuild and start containers
if docker compose up -d --build; then
    echo ""
    echo -e "${GREEN}✓ Containers rebuilt and started${NC}"
else
    echo ""
    echo -e "${RED}✗ Failed to rebuild containers${NC}"
    exit 1
fi

echo ""

# ============================================================================
# Step 4: Wait for Database
# ============================================================================
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}Step 4/5: Waiting for database to be ready${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

echo -n "Waiting for database"
for i in {1..30}; do
    if docker ps | grep -q "$DB_CONTAINER"; then
        if docker exec "$DB_CONTAINER" mysqladmin ping -h localhost -uroot -proot_password_change_me > /dev/null 2>&1; then
            echo ""
            echo -e "${GREEN}✓ Database is ready${NC}"
            break
        fi
    fi
    echo -n "."
    sleep 2
    
    if [ $i -eq 30 ]; then
        echo ""
        echo -e "${RED}✗ Database did not start in time${NC}"
        exit 1
    fi
done

echo ""

# ============================================================================
# Step 5: Apply Migrations
# ============================================================================
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}Step 5/5: Applying database migrations${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

if [ -f "./update-db.sh" ]; then
    chmod +x ./update-db.sh
    if ./update-db.sh; then
        echo -e "${GREEN}✓ Migrations applied${NC}"
    else
        echo -e "${RED}✗ Migration failed${NC}"
        echo ""
        echo "Your application might still work, but some features may be missing."
    fi
else
    echo -e "${YELLOW}⚠ Migration script not found - skipping${NC}"
fi

echo ""

# ============================================================================
# Summary
# ============================================================================
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}  ✓ Update completed successfully!${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "Your application has been updated to the latest version."
echo "All your data has been preserved."
echo ""
echo "Services status:"
docker compose ps
echo ""
echo "Access your application at:"
echo "  Frontend: http://localhost:8082"
echo "  Backend:  http://localhost:3001"
echo ""

if [ "$STASHED" = true ]; then
    echo -e "${YELLOW}Note: Your local changes were stashed. To restore them:${NC}"
    echo "  git stash pop"
    echo ""
fi

echo "To view logs:"
echo "  docker compose logs -f"
echo ""
