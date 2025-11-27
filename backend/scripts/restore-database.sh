#!/bin/bash

# Database Restore Script for Nappyhood Salon
# This script restores a PostgreSQL database from a backup file

# Configuration
BACKUP_DIR="/opt/nappyhood/backups"
DB_NAME="nappyhood_salon"
DB_USER="postgres"
DB_PASSWORD="${POSTGRES_PASSWORD:-default_password}"
CONTAINER_NAME="nappyhood-postgres-1"

# Check if backup file is provided
if [ -z "$1" ]; then
    echo "Usage: $0 <backup_file.sql.gz or backup_file.sql>"
    echo ""
    echo "Available backups:"
    ls -lh "$BACKUP_DIR"/nappyhood_backup_*.sql.gz 2>/dev/null | tail -10 || echo "No backups found"
    exit 1
fi

BACKUP_FILE="$1"

# Check if file exists
if [ ! -f "$BACKUP_FILE" ]; then
    echo "ERROR: Backup file not found: $BACKUP_FILE"
    exit 1
fi

# Confirm restore
echo "WARNING: This will replace all data in the database '$DB_NAME'!"
echo "Backup file: $BACKUP_FILE"
read -p "Are you sure you want to continue? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
    echo "Restore cancelled."
    exit 0
fi

# Decompress if needed
TEMP_FILE="$BACKUP_FILE"
if [[ "$BACKUP_FILE" == *.gz ]]; then
    TEMP_FILE="${BACKUP_FILE%.gz}"
    echo "Decompressing backup file..."
    gunzip -c "$BACKUP_FILE" > "$TEMP_FILE"
fi

# Restore database
echo "Restoring database from backup..."
docker exec -i -e PGPASSWORD="$DB_PASSWORD" "$CONTAINER_NAME" \
  psql -U "$DB_USER" -d "$DB_NAME" < "$TEMP_FILE"

# Clean up temporary file if we decompressed
if [[ "$BACKUP_FILE" == *.gz ]]; then
    rm -f "$TEMP_FILE"
fi

echo "Database restore completed!"

