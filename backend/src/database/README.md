# Database Scripts

This directory contains SQL scripts for managing the database schema and data.

## Files

### `init.sql`
- **Purpose**: Initial database schema creation
- **When to use**: Automatically executed when the database container starts for the first time
- **Contains**: 
  - All table definitions
  - Default settings
  - Default expense categories
  - Sample clients and worked hours

### `seed.sql`
- **Purpose**: Sample data for demonstration and testing
- **When to use**: Optional - load sample data to test the application
- **Contains**: 
  - Example invoices (paid, sent, draft)
  - Example expenses across multiple categories
  - Additional clients
  - Realistic worked hours entries spanning multiple months

### `migrate.sql`
- **Purpose**: Update existing database to latest schema version
- **When to use**: After pulling updates that include database changes
- **Features**:
  - Idempotent (safe to run multiple times)
  - Checks for existing columns/tables before making changes
  - Adds missing settings and categories
  - Non-destructive - preserves existing data

## Usage

### First Time Setup (Automatic)
When you start the containers with `docker compose up -d`, the `init.sql` script runs automatically if the database doesn't exist yet.

### Loading Sample Data (Optional)
```bash
# From project root directory
docker exec -i freelancer-finance-db mysql -uroot -proot_password_change_me freelancer_finance < backend/src/database/seed.sql
```

### Updating Database After Application Updates
```bash
# From project root directory
./update-db.sh
```

This convenient script:
- ✓ Checks if the database container is running
- ✓ Validates database connection
- ✓ Applies all pending migrations
- ✓ Provides clear feedback on success/failure

### Manual Migration (Advanced)
If you prefer to run migrations manually:
```bash
docker exec -i freelancer-finance-db mysql -uroot -proot_password_change_me freelancer_finance < backend/src/database/migrate.sql
```

## Database Credentials

Default credentials (configured in `docker-compose.yml`):
- **Host**: localhost (or container name `freelancer-finance-db`)
- **Port**: 3306
- **Database**: freelancer_finance
- **Root User**: root
- **Root Password**: root_password_change_me
- **App User**: freelancer
- **App Password**: freelancer_password_change_me

⚠️ **Security Note**: Change these passwords in production!

## Troubleshooting

### "Cannot connect to database"
- Ensure containers are running: `docker compose ps`
- Check database logs: `docker logs freelancer-finance-db`
- Verify credentials in `docker-compose.yml`

### "Migration failed"
- Check the error message for specific issues
- Verify you're running the script from the project root
- Ensure you have the latest version of the migration script
- Try running migrations manually to see detailed error messages

### "Table already exists" errors
This is normal! The migration script is designed to be idempotent. It checks for existing structures before creating them.

## Schema Changes

When adding new features that require database changes:

1. **Update `init.sql`**: Add new tables/columns for fresh installations
2. **Update `migrate.sql`**: Add migration logic for existing databases
3. **Test locally**: Run migrations on your local database
4. **Document changes**: Update this README if needed
5. **Run on production**: Use `./update-db.sh` after deploying

## Backup Before Major Changes

Always backup your database before major updates:

```bash
# Backup
docker exec freelancer-finance-db mysqldump -uroot -proot_password_change_me freelancer_finance > backup_$(date +%Y%m%d_%H%M%S).sql

# Restore (if needed)
docker exec -i freelancer-finance-db mysql -uroot -proot_password_change_me freelancer_finance < backup_20241127_120000.sql
```
