#!/bin/bash

# =============================================================================
# SEO Tool Suite - Development Ortamını Başlat
# =============================================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

cd "$PROJECT_DIR"

echo -e "${YELLOW}=== SEO Tool Suite - Development ===${NC}"
echo ""

# Docker servislerini başlat
echo -e "${GREEN}[1/2] Docker servisleri başlatılıyor...${NC}"
docker compose --env-file .env.local up -d

# Frontend başlat
echo -e "${GREEN}[2/2] Frontend başlatılıyor...${NC}"
cd apps/web && pnpm dev &

sleep 5

echo ""
echo -e "${GREEN}=== Servisler Hazır ===${NC}"
echo "Frontend:   http://localhost:3000"
echo "n8n:        http://localhost:5679"
echo "MySQL:      localhost:3308"
echo "PostgreSQL: localhost:5434"
echo "Redis:      localhost:6381"
