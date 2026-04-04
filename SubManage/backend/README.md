# Subscription Management System - Backend

Backend API for the Subscription Management System built with Express, TypeScript, and raw SQL with SQLite.

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Language**: TypeScript 5.7
- **Database**: SQLite (better-sqlite3)
- **Authentication**: JWT with bcrypt
- **Testing**: Jest with ts-jest

## Project Structure

```
backend/
├── database/
│   └── schema.sql          # Database schema (raw SQL)
├── src/
│   ├── config/
│   │   └── database.ts     # Database connection and initialization
│   ├── services/
│   │   ├── PasswordService.ts    # Password hashing with bcrypt
│   │   ├── AuthService.ts        # JWT authentication
│   │   ├── UserService.ts        # User registration and management
│   │   └── *.test.ts             # Unit tests
│   ├── types/
│   │   └── models.ts       # TypeScript interfaces for models
│   └── index.ts            # Main application entry point
├── .env                    # Environment variables
├── package.json
└── tsconfig.json
```

## Database Schema

The database includes the following tables (raw SQL):
- users (with role-based access)
- email_verification_tokens
- products & product_variants
- recurring_plans
- subscriptions
- order_lines
- invoices
- payments
- discounts
- taxes & order_line_taxes
- quotation_templates

## Setup Instructions

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Environment variables**:
   The `.env` file is configured with SQLite database path and JWT settings.

3. **Start development server**:
   ```bash
   npm run dev
   ```

   The database schema will be automatically initialized on first run.

The server will start on `http://localhost:3000`

## Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm test` - Run all tests
- `npm run test:watch` - Run tests in watch mode

## API Endpoints

### Health Check
- `GET /health` - Check if server is running
- `GET /db-test` - Test database connection

## Why No ORM?

This project uses raw SQL with better-sqlite3 instead of an ORM for:
- **Full Control** - Write exactly the SQL you need
- **Performance** - Direct database access without abstraction overhead
- **Simplicity** - No complex ORM configuration or migrations
- **Learning** - Better understanding of SQL and database operations
- **Lightweight** - Fewer dependencies

## Database Operations

All database operations use prepared statements for SQL injection protection:

```typescript
const stmt = db.prepare('SELECT * FROM users WHERE email = ?');
const user = stmt.get(email);
```

## Testing

All services have comprehensive unit tests:
- PasswordService: 9 tests
- AuthService: 12 tests
- UserService: 21 tests

Run tests with: `npm test`

## Next Steps

According to the implementation plan (tasks.md):
1. ✅ Task 3.1 - Define database schema (SQL)
2. ✅ Task 3.2 - Initialize database
3. ✅ Task 4.1 - Password hashing service
4. ✅ Task 4.2 - JWT authentication service
5. ✅ Task 4.4 - User registration service
6. Next: Continue with remaining authentication tasks
