# Twitter Bot Matrix

## Overview

This is a full-stack application for managing autonomous Twitter bots. It provides a comprehensive dashboard for creating, managing, and monitoring Twitter bots that can automatically post tweets, reply to messages, and engage with content. The application features a modern React frontend with a Node.js/Express backend, using PostgreSQL for data persistence and real-time WebSocket communication.

## User Preferences

Preferred communication style: Simple, everyday language.

## Recent Changes

### July 18, 2025
- Fixed database connection error by creating PostgreSQL database
- Set up DATABASE_URL environment variable properly
- Successfully pushed database schema with all tables
- Configured API keys for BIANXIE_API_KEY and APIDANCE_API_KEY
- Verified LLM API connection is working (returns 200 responses)
- Confirmed content generation is functional with proper topics
- Application is now fully operational with all services connected

### January 18, 2025
- Made LLM API base URL configurable via environment variables
- Added configurable Twitter API base URL
- Enhanced API Settings page with URL configuration fields
- Added API configuration save/load endpoints
- Fixed TypeScript errors in storage and component files
- Updated service classes to use configurable base URLs
- Integrated PostgreSQL database with full schema migration
- Added database relations for bots and activities
- Replaced in-memory storage with persistent database storage
- Successfully deployed database schema with all tables
- Added Twitter auth token storage for individual bots
- Updated Twitter service to use bot-specific authentication
- Enhanced bot creation form with auth token input field

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter for client-side routing
- **State Management**: TanStack Query (React Query) for server state management
- **Styling**: Tailwind CSS with shadcn/ui components
- **Build Tool**: Vite for fast development and optimized builds
- **Real-time Communication**: WebSocket client for live updates

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **Database**: PostgreSQL with Drizzle ORM
- **Schema Management**: Drizzle Kit for migrations
- **Session Management**: Express sessions with PostgreSQL store
- **Real-time**: WebSocket server for live updates

## Key Components

### Database Layer
- **ORM**: Drizzle ORM with PostgreSQL dialect
- **Tables**: 
  - `users` - User authentication and profiles
  - `bots` - Bot configurations and settings
  - `activities` - Bot action logs and history
  - `apiUsage` - API rate limiting and usage tracking
- **Connection**: Neon Database serverless PostgreSQL
- **Migrations**: Located in `/migrations` directory

### API Layer
- **REST API**: Express.js routes for CRUD operations
- **External APIs**: 
  - Twitter API via apidance.pro service
  - LLM API via bianxie.ai service
- **Rate Limiting**: Built-in API usage tracking and limits
- **Error Handling**: Centralized error handling with proper HTTP status codes

### Service Layer
- **BotService**: Manages bot lifecycle, scheduling, and autonomous behavior
- **TwitterService**: Handles Twitter API interactions (posting, liking, replying)
- **LLMService**: Manages content generation using AI models
- **Storage**: Abstraction layer for database operations with in-memory fallback

### Frontend Components
- **Dashboard**: Overview of bot performance and system status
- **Bot Management**: Create, edit, and manage bot configurations
- **Content Generation**: AI-powered content creation and manual posting
- **Analytics**: Performance metrics and engagement tracking
- **Activity Logs**: Real-time activity monitoring and filtering
- **API Settings**: Configuration for external API keys and limits

## Data Flow

1. **Bot Creation**: User creates bot with personality, topics, and posting frequency
2. **Content Generation**: LLM service generates tweets based on bot configuration
3. **Scheduling**: Bot service manages posting schedules and autonomous behavior
4. **Twitter Integration**: Twitter service handles API calls and rate limiting
5. **Activity Logging**: All actions are logged to the database with status tracking
6. **Real-time Updates**: WebSocket broadcasts activity updates to connected clients
7. **Analytics**: System aggregates data for performance metrics and insights

## External Dependencies

### Required Services
- **Neon Database**: PostgreSQL hosting service
- **apidance.pro**: Twitter API proxy service
- **bianxie.ai**: LLM API service for content generation

### Environment Variables
- `DATABASE_URL`: PostgreSQL connection string
- `APIDANCE_API_KEY` or `TWITTER_API_KEY`: Twitter API access key
- `APIDANCE_BASE_URL` or `TWITTER_BASE_URL`: Twitter API base URL (default: https://api.apidance.pro)
- `BIANXIE_API_KEY` or `LLM_API_KEY`: LLM service access key
- `BIANXIE_BASE_URL` or `LLM_BASE_URL`: LLM API base URL (default: https://api.bianxie.ai/v1)

### Key Libraries
- **Frontend**: React, TanStack Query, Tailwind CSS, Radix UI, Wouter
- **Backend**: Express, Drizzle ORM, WebSocket, Axios
- **Shared**: Zod for validation, TypeScript for type safety

## Deployment Strategy

### Development
- Vite dev server for frontend with HMR
- Express server with TypeScript compilation via tsx
- Real-time error overlay for development debugging
- Replit-specific integrations for cloud development

### Production
- Vite build generates optimized static assets
- esbuild bundles server code for Node.js runtime
- Static assets served from `/dist/public`
- Single-process deployment with Express serving both API and static files

### Database Management
- Drizzle Kit for schema migrations
- `db:push` command for applying schema changes
- Automated migration generation and application

The architecture prioritizes modularity, type safety, and real-time capabilities while maintaining simplicity for development and deployment. The system is designed to scale horizontally with multiple bot instances and handle high-frequency Twitter API interactions efficiently.