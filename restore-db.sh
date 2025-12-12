#!/bin/bash
# ============================================================================
# Freelancer Finance Manager - Database Restore Script
# ============================================================================
# This script restores a database backup.
#
# Usage:
#   ./restore-db.sh <backup_file>
#
# Example:
#   ./restore-db.sh ./backups/freelancer_finance_backup_20241127_120000.sql.gz
#
# WARNING: This will REPLACE your current database with the backup!
# ============================================================================

set -e  # Exit on error

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
DB_CONTAINER="freelancer-finance-db"
DB_NAME="freelancer_finance"
DB_USER="root"
DB_PASSWORD="root_password_change_me"

# Check if backup file is provided
if [ -z "$1" ]; then
    echo -e "${RED}Error: No backup file specified${NC}"
    echo ""
    echo "Usage: ./restore-db.sh <backup_file>"
    echo ""
    echo "Available backups:"
    if [ -d "./backups" ]; then
        ls -1t ./backups/freelancer_finance_backup_*.sql.gz 2>/dev/null || echo "  No backups found"
    else
        echo "  No backups directory found"
    fi
    exit 1
fi

BACKUP_FILE="$1"

# Check if backup file exists
if [ ! -f "$BACKUP_FILE" ]; then
    echo -e "${RED}Error: Backup file not found: $BACKUP_FILE${NC}"
    exit 1
fi

echo "============================================================================"
echo "  Freelancer Finance Manager - Database Restore"
echo "============================================================================"
echo ""
echo -e "${YELLOW}WARNING: This will REPLACE your current database!${NC}"
echo "Backup file: $BACKUP_FILE"
echo ""
read -p "Are you sure you want to continue? (yes/no): " -r
echo ""

if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
    echo "Restore cancelled."
    exit 0
fi

# Check if Docker container is running
if ! docker ps | grep -q "$DB_CONTAINER"; then
    echo -e "${RED}Error: Database container '$DB_CONTAINER' is not running.${NC}"
    echo "Please start your containers first with: docker compose up -d"
    exit 1
fi

echo -e "${YELLOW}Creating safety backup of current database...${NC}"
SAFETY_BACKUP="./backups/pre_restore_backup_$(date +%Y%m%d_%H%M%S).sql.gz"
mkdir -p ./backups
if docker exec "$DB_CONTAINER" mysqldump \
    -u"$DB_USER" \
    -p"$DB_PASSWORD" \
    --single-transaction \
    "$DB_NAME" 2>/dev/null | gzip > "$SAFETY_BACKUP"; then
    echo -e "${GREEN}✓ Safety backup created: $SAFETY_BACKUP${NC}"
else
    echo -e "${YELLOW}⚠ Could not create safety backup (database might be empty)${NC}"
fi
echo ""

echo -e "${YELLOW}Restoring database...${NC}"

# Check if file is compressed
if [[ "$BACKUP_FILE" == *.gz ]]; then
    # Decompress and restore
    if gunzip -c "$BACKUP_FILE" | docker exec -i "$DB_CONTAINER" mysql \
        -u"$DB_USER" \
        -p"$DB_PASSWORD" \
        "$DB_NAME" 2>/dev/null; then
        RESTORE_SUCCESS=true
    else
        RESTORE_SUCCESS=false
    fi
else
    # Restore directly
    if docker exec -i "$DB_CONTAINER" mysql \
        -u"$DB_USER" \
        -p"$DB_PASSWORD" \
        "$DB_NAME" < "$BACKUP_FILE" 2>/dev/null; then
        RESTORE_SUCCESS=true
    else
        RESTORE_SUCCESS=false
    fi
fi

if [ "$RESTORE_SUCCESS" = true ]; then
    echo ""
    echo -e "${GREEN}============================================================================${NC}"
    echo -e "${GREEN}  ✓ Database restored successfully!${NC}"
    echo -e "${GREEN}============================================================================${NC}"
    echo ""
    echo "Your database has been restored from: $BACKUP_FILE"
    echo ""
    echo "If you need to undo this restore, use the safety backup:"
    echo "  ./restore-db.sh $SAFETY_BACKUP"
    exit 0
else
    echo ""
    echo -e "${RED}============================================================================${NC}"
    echo -e "${RED}  ✗ Restore failed!${NC}"
    echo -e "${RED}============================================================================${NC}"
    echo ""
    echo "Your original database should still be intact."
    echo "If you need help, check the safety backup: $SAFETY_BACKUP"
    exit 1
fi
