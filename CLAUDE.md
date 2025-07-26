# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Local Development
```bash
# Development (starts both frontend and backend with hot reload)
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Type checking
npm run check

# Database schema operations
npm run db:push          # Push schema changes to database
```

### Docker Development
```bash
# Start with Docker Compose (includes SQLite + hot reload)
docker compose up

# Start in background
docker compose up -d

# View logs
docker compose logs -f

# Stop services
docker compose down

# Rebuild after code changes
docker compose up --build

# Reset database (removes all data)
docker compose down -v && docker compose up
```

## Architecture Overview

This is a Twitter bot management system with a React frontend and Express backend:

### Frontend (`client/`)
- **React 18** with TypeScript
- **Tailwind CSS** + **shadcn/ui** component library
- **Wouter** for routing
- **TanStack Query** for state management
- **WebSocket** connection via WebSocketContext for real-time updates
- Uses Vite for bundling

### Backend (`server/`)
- **Express.js** with TypeScript
- **WebSocket** server for real-time communication
- **SQLite** with **Drizzle ORM**
- **Session-based authentication** with express-session

### Database Schema (`shared/schema.ts`)
Core tables:
- `bots` - Twitter bot configurations with interaction settings
- `activities` - Bot action logs (tweets, likes, replies, interactions)
- `apiUsage` - API usage tracking for rate limiting
- `users` - Authentication

### Key Services (`server/services/`)
- `botService.ts` - Bot CRUD operations
- `twitterService.ts` - Twitter API integration via apidance.pro
- `llmService.ts` - Content generation via bianxie.ai
- `botInteractionService.ts` - Bot-to-bot interaction logic

## Environment Configuration

Copy `.env.example` to `.env` and fill in your API keys:
```bash
cp .env.example .env
```

Required environment variables:
```env
DATABASE_URL=./data/database.sqlite   # SQLite database file path
APIDANCE_API_KEY=...                  # Twitter API proxy service
APIDANCE_BASE_URL=https://api.apidance.pro
BIANXIE_API_KEY=...                   # LLM content generation
BIANXIE_BASE_URL=https://api.bianxie.ai/v1
SESSION_SECRET=...                    # Session encryption
```

### Docker Environment
When using Docker Compose, the SQLite database is automatically configured with persistent storage. You only need to add your API keys to the `docker-compose.yml` environment section or create a `.env` file.

## WebSocket Real-time Features

- Real-time activity logging and status updates
- Connection status indicator in sidebar (green WiFi icon)
- Production deployments require proper reverse proxy configuration
- See `WEBSOCKET_PRODUCTION_NOTES.md` for deployment details

## Database Operations

- Schema defined in `shared/schema.ts`
- Migrations in `migrations/` directory
- Use `npm run db:push` to sync schema changes
- Drizzle ORM with type-safe queries

## Bot Management Features

- Multi-bot creation and management
- CSV bulk import functionality
- Bot-to-bot interaction system with configurable behavior
- Automated content generation and posting
- Real-time activity monitoring

## API Structure

All API routes in `server/routes.ts`:
- `/api/bots` - Bot management endpoints
- `/api/content` - Content generation and publishing
- `/api/activities` - Activity logging
- `/api/interactions` - Bot interaction configuration