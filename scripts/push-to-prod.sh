#!/bin/bash

# =============================================================================
# SEO Tool Suite - Production'a Deploy
# =============================================================================

set -e

PROD_HOST="82.112.240.77"
PROD_USER="root"
PROD_PASS="FrSETvSNi100c@"
PROD_DIR="/root/content-studio-production"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

cd "$PROJECT_DIR"

echo -e "${YELLOW}=== Production'a Deploy ===${NC}"
echo ""

# Uncommitted değişiklik kontrolü
if [[ -n $(git status --porcelain) ]]; then
    echo -e "${RED}Commit edilmemiş değişiklikler var!${NC}"
    echo "Önce commit yapın: git add . && git commit -m 'mesaj'"
    exit 1
fi

# dev branch kontrolü
CURRENT_BRANCH=$(git branch --show-current)
if [[ "$CURRENT_BRANCH" != "dev" ]]; then
    echo -e "${RED}dev branch'inde değilsiniz! Şu anki branch: $CURRENT_BRANCH${NC}"
    exit 1
fi

echo -e "${GREEN}[1/4] dev branch'i push ediliyor...${NC}"
git push origin dev

echo -e "${GREEN}[2/4] main branch'e merge ediliyor...${NC}"
git checkout main
git merge dev --no-edit
git push origin main

echo -e "${GREEN}[3/4] dev branch'e geri dönülüyor...${NC}"
git checkout dev

echo -e "${GREEN}[4/4] Production sunucusu güncelleniyor...${NC}"
sshpass -p "$PROD_PASS" ssh -o StrictHostKeyChecking=no "$PROD_USER@$PROD_HOST" << 'EOF'
cd /root/content-studio-production
git pull origin main
docker compose -f docker-compose.prod.yml up -d --build
EOF

echo ""
echo -e "${GREEN}=== Deploy Tamamlandı ===${NC}"
