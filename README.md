# SEO Tool Suite

Enterprise SEO Content Production Pipeline - 3 Modular Tools

## Overview

SEO Tool Suite, SEO uyumlu içerik üretim sürecini baştan sona otomatize eden, modüler ve ölçeklenebilir bir araç setidir.

### 3 Tool Pipeline

| Tool | İsim | Soru | Çıktı |
|------|------|------|-------|
| Tool 1 | Keyword Research | NE yazacağız? | Cluster yapısı, Intent etiketleri, Brief |
| Tool 2 | Content Studio | NASIL yazacağız? | Temiz HTML, Metadata, Schema |
| Tool 3 | Internal Linking | NEREYE bağlayacağız? | Linklenmiş HTML, URL Mapping |

## Tech Stack

### Frontend (Vercel)
- Next.js 14 (App Router)
- React 18 + TypeScript
- Tailwind CSS
- Zustand (State Management)
- React Query (Server State)

### Backend (VPS)
- n8n (Docker) - 32 Workflows
- MySQL 8.0+
- Redis (Optional)
- Nginx Reverse Proxy

### External APIs
- Ahrefs
- SEMrush
- OpenAI GPT-4
- Anthropic Claude
- Google APIs

## Project Structure

```
n8n-content-studio/
├── apps/web/              # Next.js Frontend
├── packages/shared/       # Shared Types & Validators
├── n8n/workflows/         # n8n Workflow JSONs
├── database/              # MySQL Schema & Migrations
├── docker/                # Docker Configs
└── docs/                  # Documentation
```

## Quick Start

### Prerequisites
- Node.js 18+
- pnpm 8+
- Docker & Docker Compose
- MySQL 8.0+ (or use Docker)

### Installation

1. Clone the repository:
```bash
git clone <repo-url>
cd n8n-content-studio
```

2. Install dependencies:
```bash
pnpm install
```

3. Copy environment file:
```bash
cp .env.example .env.local
```

4. Start Docker services (n8n + MySQL + Redis):
```bash
docker-compose up -d
```

5. Run the frontend:
```bash
pnpm dev
```

### Access Points
- Frontend: http://localhost:3000
- n8n: http://localhost:5678
- MySQL: localhost:3306

## Development

### Commands

```bash
# Development
pnpm dev           # Start Next.js dev server
pnpm build         # Build for production
pnpm lint          # Run ESLint
pnpm type-check    # Run TypeScript check

# Docker
pnpm docker:up     # Start Docker services
pnpm docker:down   # Stop Docker services
pnpm docker:logs   # View Docker logs

# Database
pnpm db:migrate    # Run database migrations
```

### Database Setup

Import the schema to MySQL:
```bash
mysql -u root -p < database/schema/seo_tool_suite_schema_v3.sql
```

## Documentation

- [Master Document](docs/master_doc_v2.txt)
- [Database Schema](docs/database/db_doc_v3.txt)
- [Tool 1: Keyword Research](docs/tool-1-keyword-research/tool1_doc.txt)
- [Tool 2: Content Studio](docs/tool-2-content-studio/tool2_doc.txt)
- [Tool 3: Internal Linking](docs/tool-3-internal-linking/tool3_doc.txt)

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  VERCEL (Frontend)                                          │
│  Next.js 14 │ React 18 │ TypeScript │ Tailwind             │
└───────────────────────────┬─────────────────────────────────┘
                            │ HTTPS (Webhooks)
┌───────────────────────────▼─────────────────────────────────┐
│  VPS (Backend)                                              │
│  n8n Docker │ 32 Workflows │ MySQL 8.0 │ Nginx             │
└───────────────────────────┬─────────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────────┐
│  External APIs                                              │
│  Ahrefs │ SEMrush │ OpenAI │ Claude │ Google               │
└─────────────────────────────────────────────────────────────┘
```

## License

UNLICENSED - Proprietary Software
# content-studio-production
