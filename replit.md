# The Cawthra Open - Golf Tournament Management System

## Overview

The Cawthra Open is a full-stack golf tournament management application built for organizing and tracking golf tournaments. The system allows users to create tournaments, join competitions, track live scores, view leaderboards, and share gallery photos. It features a modern golf course-inspired design with green and gold color scheme.

The application handles the complete tournament lifecycle from creation to completion, with real-time scoring capabilities and comprehensive player statistics. Users can manage multiple tournaments, track detailed golf metrics (strokes, putts, fairways hit, greens in regulation), and view historical performance data.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript running on Vite for fast development
- **Routing**: Wouter for lightweight client-side routing with protected routes
- **UI Framework**: Radix UI components with shadcn/ui for consistent design system
- **Styling**: TailwindCSS with custom golf-themed color palette and CSS variables
- **State Management**: TanStack Query (React Query) for server state with optimistic updates
- **Form Handling**: React Hook Form with Zod validation for type-safe forms

### Backend Architecture
- **Runtime**: Node.js with Express.js for REST API endpoints
- **Language**: TypeScript with ES modules for type safety across the stack
- **Authentication**: Replit Auth integration with session-based authentication
- **Session Storage**: PostgreSQL-backed sessions using connect-pg-simple

### Data Storage Solutions
- **Primary Database**: PostgreSQL via Neon serverless with connection pooling
- **ORM**: Drizzle ORM for type-safe database operations and migrations
- **Schema Management**: Shared TypeScript schema definitions with Zod validation
- **Object Storage**: Google Cloud Storage integration for photo uploads with ACL policies

### Authentication and Authorization
- **Provider**: Replit OpenID Connect (OIDC) with automatic user provisioning
- **Session Management**: Secure HTTP-only cookies with 7-day expiration
- **Access Control**: Role-based permissions with protected API endpoints
- **User Management**: Automatic user creation on first login with profile data sync

### Key Business Logic
- **Tournament Management**: Full CRUD operations for tournaments with status tracking
- **Live Scoring**: Real-time score entry with validation against course par
- **Leaderboard Calculation**: Dynamic ranking with total score and position tracking
- **Statistics Engine**: Player performance metrics including averages and percentages
- **Course Management**: Hole-by-hole configuration with par and yardage data

## External Dependencies

### Core Infrastructure
- **Neon Database**: Serverless PostgreSQL hosting with automatic scaling
- **Replit Authentication**: Integrated OIDC provider for user management
- **Google Cloud Storage**: Object storage for tournament photo galleries

### Development Tools
- **Vite**: Build tool with HMR and development server
- **ESBuild**: Fast TypeScript compilation for production builds
- **Drizzle Kit**: Database migration and schema management CLI

### UI and UX Libraries
- **Radix UI**: Headless component primitives for accessibility
- **Lucide React**: Consistent icon system throughout the application
- **TailwindCSS**: Utility-first CSS framework with custom design tokens
- **Uppy**: File upload handling with progress tracking and validation

### Validation and Type Safety
- **Zod**: Runtime schema validation shared between client and server
- **TypeScript**: Static type checking across the entire application stack
- **Drizzle Zod**: Database schema to Zod schema generation for validation