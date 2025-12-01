#!/bin/bash
set -e

echo "========================================="
echo "CellBlock Database Backup"
echo "========================================="
echo ""

# Configuration
BACKUP_DIR="/home/cellblock/backups"
APP_DIR="/home/cellblock/cellblock"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/cellblock_$TIMESTAMP.sql.gz"
RETENTION_DAYS=30

# Create backup directory
mkdir -p $BACKUP_DIR

echo "Starting backup..."
echo "Timestamp: $TIMESTAMP"
echo "Destination: $BACKUP_FILE"
echo ""

# Perform backup
pg_dump -U cellblock cellblock | gzip > $BACKUP_FILE

# Get file size
SIZE=$(du -h $BACKUP_FILE | cut -f1)
echo "Backup complete! Size: $SIZE"

# Delete old backups
echo "Cleaning up old backups (older than $RETENTION_DAYS days)..."
find $BACKUP_DIR -name "cellblock_*.sql.gz" -mtime +$RETENTION_DAYS -delete

# Count remaining backups
COUNT=$(ls -1 $BACKUP_DIR/cellblock_*.sql.gz 2>/dev/null | wc -l)
echo "Retained backups: $COUNT"

# Optional: Upload to S3 (uncomment if you have AWS CLI configured)
# aws s3 cp $BACKUP_FILE s3://your-bucket/cellblock-backups/

echo ""
echo "========================================="
echo "Backup Complete!"
echo "========================================="
echo ""
echo "Backup file: $BACKUP_FILE"
echo ""
echo "To restore:"
echo "gunzip -c $BACKUP_FILE | psql -U cellblock cellblock"
echo ""
