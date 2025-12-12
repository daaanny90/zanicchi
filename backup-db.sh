#!/bin/bash
# ============================================================================
# Freelancer Finance Manager - Database Backup Script
# ============================================================================
# This script creates a backup of your database with timestamp.
# Backups are stored in the ./backups directory.
#
# Usage:
#   ./backup-db.sh                    # Create a backup
#   ./backup-db.sh --auto             # Auto backup (no confirmation, less output)
#
# The script creates a compressed SQL dump of your entire database.
# ============================================================================

set -e  # Exit on error

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
DB_CONTAINER="freelancer-finance-db"
DB_NAME="freelancer_finance"
DB_USER="root"
DB_PASSWORD="root_password_change_me"
BACKUP_DIR="./backups"
AUTO_MODE=false

# Parse arguments
if [ "$1" = "--auto" ]; then
    AUTO_MODE=true
fi

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

if [ "$AUTO_MODE" = false ]; then
    echo "============================================================================"
    echo "  Freelancer Finance Manager - Database Backup"
    echo "============================================================================"
    echo ""
fi

# Check if Docker container is running
if ! docker ps | grep -q "$DB_CONTAINER"; then
    echo -e "${RED}Error: Database container '$DB_CONTAINER' is not running.${NC}"
    echo "Please start your containers first with: docker compose up -d"
    exit 1
fi

# Generate backup filename with timestamp
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/freelancer_finance_backup_$TIMESTAMP.sql"

if [ "$AUTO_MODE" = false ]; then
    echo -e "${YELLOW}Creating database backup...${NC}"
    echo "Backup file: $BACKUP_FILE"
    echo ""
fi

# Create the backup
if docker exec "$DB_CONTAINER" mysqldump \
    -u"$DB_USER" \
    -p"$DB_PASSWORD" \
    --single-transaction \
    --routines \
    --triggers \
    --events \
    "$DB_NAME" > "$BACKUP_FILE" 2>/dev/null; then
    
    # Compress the backup
    if [ "$AUTO_MODE" = false ]; then
        echo -e "${YELLOW}Compressing backup...${NC}"
    fi
    gzip "$BACKUP_FILE"
    BACKUP_FILE="$BACKUP_FILE.gz"
    
    # Get file size
    BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
    
    if [ "$AUTO_MODE" = false ]; then
        echo ""
        echo -e "${GREEN}============================================================================${NC}"
        echo -e "${GREEN}  ✓ Backup completed successfully!${NC}"
        echo -e "${GREEN}============================================================================${NC}"
        echo ""
        echo "Backup details:"
        echo "  File: $BACKUP_FILE"
        echo "  Size: $BACKUP_SIZE"
        echo "  Date: $(date '+%Y-%m-%d %H:%M:%S')"
        echo ""
        echo "To restore this backup, run:"
        echo "  ./restore-db.sh $BACKUP_FILE"
    else
        echo "$(date '+%Y-%m-%d %H:%M:%S') - Backup created: $BACKUP_FILE ($BACKUP_SIZE)"
    fi
    
    # Clean up old backups (keep last 10)
    if [ "$AUTO_MODE" = false ]; then
        echo ""
        echo -e "${YELLOW}Cleaning up old backups (keeping last 10)...${NC}"
    fi
    
    cd "$BACKUP_DIR"
    ls -t freelancer_finance_backup_*.sql.gz 2>/dev/null | tail -n +11 | xargs -r rm --
    REMAINING=$(ls -1 freelancer_finance_backup_*.sql.gz 2>/dev/null | wc -l)
    
    if [ "$AUTO_MODE" = false ]; then
        echo "Backups in $BACKUP_DIR: $REMAINING"
    fi
    
    exit 0
else
    echo ""
    echo -e "${RED}============================================================================${NC}"
    echo -e "${RED}  ✗ Backup failed!${NC}"
    echo -e "${RED}============================================================================${NC}"
    echo ""
    echo "Please check the error messages above and try again."
    exit 1
fi
