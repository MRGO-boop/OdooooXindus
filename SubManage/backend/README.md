# Subscription Management System - Backend

Backend API for the Subscription Management System built with Express, TypeScript, and Prisma ORM with SQLite.

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: SQLite (development)
- **ORM**: Prisma
- **Authentication**: JWT (to be implemented)

## Project Structure

```
backend/
├── prisma/
│   ├── schema.prisma       # Database schema
│   └── migrations/         # Database migrations
├── src/
│   ├── config/            # Configuration files
│   │   └── database.ts    # Prisma client instance
│   └── index.ts           # Main application entry point
├── .env                   # Environment variables
├── package.json
└── tsconfig.json
```

## Database Schema

The database includes the following models:
- User (with role-based access)
- EmailVerificationToken
- Product & ProductVariant
- RecurringPlan
- Subscription
- OrderLine
- Invoice
- Payment
- Discount
- Tax
- QuotationTemplate

## Setup Instructions

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Environment variables**:
   The `.env` file is already configured with SQLite connection.

3. **Generate Prisma Client**:
   ```bash
   npm run prisma:generate
   ```

4. **Run migrations** (already done):
   ```bash
   npm run prisma:migrate
   ```

5. **Start development server**:
   ```bash
   npm run dev
   ```

The server will start on `http://localhost:3000`

## Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run prisma:generate` - Generate Prisma Client
- `npm run prisma:migrate` - Run database migrations

## API Endpoints

### Health Check
- `GET /health` - Check if server is running
- `GET /db-test` - Test database connection

## Next Steps

According to the implementation plan (tasks.md):
1. ✅ Task 3.1 - Define Prisma schema
2. ✅ Task 3.2 - Run Prisma migrations
3. Next: Task 4 - Implement Authentication Module
