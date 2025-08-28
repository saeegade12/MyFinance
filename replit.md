# Overview

FinanceAI Pro is a full-stack AI-powered finance management platform built with Node.js (TypeScript) and React (TypeScript). The application tracks income and expenses across multiple accounts, provides AI-driven smart categorization and personalized insights, supports receipt scanning with OCR capabilities, and offers budget management with email alerts. It features interactive charts and reports, along with monthly AI-powered financial summaries sent via email.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React 18 with TypeScript and Vite for fast development and building
- **Styling**: Tailwind CSS with shadcn/ui component library for consistent design system
- **State Management**: Zustand for client-side state management, React Query for server state
- **Routing**: Wouter for lightweight client-side routing
- **Charts**: Recharts for financial data visualization and analytics
- **Authentication**: Replit-based OIDC authentication with session management

## Backend Architecture
- **Runtime**: Node.js with Express.js framework in TypeScript
- **Database**: PostgreSQL with Drizzle ORM for type-safe database operations
- **Authentication**: Passport.js with OpenID Connect strategy for Replit authentication
- **Session Management**: Express-session with PostgreSQL session store
- **Password Security**: Argon2 for password hashing
- **File Upload**: Multer for handling receipt uploads with file validation
- **Real-time Updates**: WebSocket server for live financial data updates

## Data Storage Solutions
- **Primary Database**: PostgreSQL via Neon serverless with connection pooling
- **Schema Management**: Drizzle ORM with type-safe migrations and queries
- **Session Storage**: PostgreSQL-backed session store for authentication persistence
- **File Storage**: Local filesystem for receipt uploads (configurable for cloud storage)

## Authentication and Authorization
- **Provider**: Replit OIDC authentication with OpenID Connect discovery
- **Session Management**: Secure HTTP-only cookies with PostgreSQL session persistence
- **User Management**: User profile storage with email, name, and avatar support
- **Route Protection**: Middleware-based authentication checks on all protected routes

## External Dependencies
- **Database Provider**: Neon Database (PostgreSQL serverless)
- **Email Service**: Nodemailer with SMTP configuration for notifications and reports
- **OCR Processing**: Tesseract.js for client-side receipt text extraction
- **AI Categorization**: Custom keyword-based transaction categorization (extensible for ML models)
- **WebSocket**: Native WebSocket implementation for real-time financial updates
- **Development Tools**: Vite with HMR, ESBuild for production builds
- **Component Library**: Radix UI primitives with shadcn/ui styling system