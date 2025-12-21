#!/bin/bash

# =============================================================================
# SEO Tool Suite - Production'dan Veritabanı Senkronizasyonu
# =============================================================================

set -e

# Production SSH bilgileri
PROD_HOST="82.112.240.77"
PROD_USER="root"
PROD_PASS="FrSETvSNi100c@"

# Local dizinler
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
BACKUP_DIR="$PROJECT_DIR/yedekler"

# Renkli output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}=== Production'dan Veritabanı Senkronizasyonu ===${NC}"
echo ""

# sshpass kontrolü
if ! command -v sshpass &> /dev/null; then
    echo -e "${RED}sshpass yüklü değil. Yükleniyor...${NC}"
    sudo apt-get update && sudo apt-get install -y sshpass
fi

# Backup dizini oluştur
mkdir -p "$BACKUP_DIR"

# Timestamp
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

echo -e "${GREEN}[1/4] Production MySQL yedeği alınıyor...${NC}"
sshpass -p "$PROD_PASS" ssh -o StrictHostKeyChecking=no "$PROD_USER@$PROD_HOST" \
    "docker exec seo-suite-mysql mysqldump -uroot -p\$(docker exec seo-suite-mysql printenv MYSQL_ROOT_PASSWORD) seo_tool_suite" \
    > "$BACKUP_DIR/mysql_prod_$TIMESTAMP.sql"
echo "      Kaydedildi: mysql_prod_$TIMESTAMP.sql"

echo -e "${GREEN}[2/4] Production PostgreSQL yedeği alınıyor...${NC}"
sshpass -p "$PROD_PASS" ssh -o StrictHostKeyChecking=no "$PROD_USER@$PROD_HOST" \
    "docker exec seo-suite-postgres pg_dump -U n8n n8n" \
    > "$BACKUP_DIR/n8n_postgres_$TIMESTAMP.sql"
echo "      Kaydedildi: n8n_postgres_$TIMESTAMP.sql"

echo -e "${GREEN}[3/4] Local MySQL'e import ediliyor...${NC}"
docker exec -i seo-suite-mysql mysql -uroot -p123456 seo_tool_suite < "$BACKUP_DIR/mysql_prod_$TIMESTAMP.sql" 2>/dev/null
echo "      MySQL import tamamlandı"

echo -e "${GREEN}[4/4] Local PostgreSQL'e import ediliyor...${NC}"
# Önce mevcut tabloları temizle
docker exec seo-suite-postgres psql -U n8n -d n8n -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;" 2>/dev/null
docker exec -i seo-suite-postgres psql -U n8n -d n8n < "$BACKUP_DIR/n8n_postgres_$TIMESTAMP.sql" 2>/dev/null
echo "      PostgreSQL import tamamlandı"

# n8n'i yeniden başlat
echo -e "${GREEN}n8n yeniden başlatılıyor...${NC}"
cd "$PROJECT_DIR" && docker compose --env-file .env.local restart n8n

echo ""
echo -e "${GREEN}=== Senkronizasyon Tamamlandı ===${NC}"
echo -e "MySQL:      $BACKUP_DIR/mysql_prod_$TIMESTAMP.sql"
echo -e "PostgreSQL: $BACKUP_DIR/n8n_postgres_$TIMESTAMP.sql"
