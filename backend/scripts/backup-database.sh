#!/bin/bash

# Database Backup Script for Nappyhood Salon
# This script creates a backup of the PostgreSQL database

# Configuration
BACKUP_DIR="/opt/nappyhood/backups"
DB_NAME="nappyhood_salon"
DB_USER="postgres"
DB_PASSWORD="${POSTGRES_PASSWORD:-default_password}"
CONTAINER_NAME="nappyhood-postgres-1"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/nappyhood_backup_${DATE}.sql"
RETENTION_DAYS=30  # Keep backups for 30 days

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

# Create database backup
echo "Creating database backup: $BACKUP_FILE"
docker exec -e PGPASSWORD="$DB_PASSWORD" "$CONTAINER_NAME" \
  pg_dump -U "$DB_USER" -d "$DB_NAME" > "$BACKUP_FILE"

# Compress the backup
if [ -f "$BACKUP_FILE" ]; then
    gzip "$BACKUP_FILE"
    echo "Backup created and compressed: ${BACKUP_FILE}.gz"
    
    # Get file size
    FILE_SIZE=$(du -h "${BACKUP_FILE}.gz" | cut -f1)
    echo "Backup size: $FILE_SIZE"
else
    echo "ERROR: Backup file was not created!"
    exit 1
fi

# Remove old backups (older than RETENTION_DAYS)
echo "Cleaning up backups older than $RETENTION_DAYS days..."
find "$BACKUP_DIR" -name "nappyhood_backup_*.sql.gz" -type f -mtime +$RETENTION_DAYS -delete
echo "Cleanup complete."

# List current backups
echo ""
echo "Current backups:"
ls -lh "$BACKUP_DIR"/nappyhood_backup_*.sql.gz 2>/dev/null | tail -5 || echo "No backups found"

