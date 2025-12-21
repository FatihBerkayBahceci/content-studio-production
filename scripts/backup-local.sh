#!/bin/bash

# =============================================================================
# SEO Tool Suite - Local Veritabanı Yedekleme
# =============================================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
BACKUP_DIR="$PROJECT_DIR/yedekler"

GREEN='\033[0;32m'
NC='\033[0m'

mkdir -p "$BACKUP_DIR"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

echo -e "${GREEN}=== Local Veritabanı Yedekleme ===${NC}"

echo "[1/2] MySQL yedekleniyor..."
docker exec seo-suite-mysql mysqldump -uroot -p123456 seo_tool_suite > "$BACKUP_DIR/mysql_local_$TIMESTAMP.sql" 2>/dev/null
echo "      Kaydedildi: mysql_local_$TIMESTAMP.sql"

echo "[2/2] PostgreSQL yedekleniyor..."
docker exec seo-suite-postgres pg_dump -U n8n n8n > "$BACKUP_DIR/n8n_postgres_local_$TIMESTAMP.sql"
echo "      Kaydedildi: n8n_postgres_local_$TIMESTAMP.sql"

echo ""
echo -e "${GREEN}=== Yedekleme Tamamlandı ===${NC}"
