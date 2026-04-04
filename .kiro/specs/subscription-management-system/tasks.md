# Implementation Plan: Subscription Management System

## Overview

This implementation plan breaks down the Subscription Management System into discrete, incremental coding tasks. The system uses NestJS with TypeScript for the backend, PostgreSQL with Prisma ORM for data persistence, and React/Next.js for the frontend. The implementation follows a three-tier architecture with event-driven background jobs for asynchronous operations.

The plan progresses through: project setup, backend core infrastructure, authentication and authorization, business domain modules (products, subscriptions, invoices, payments, discounts, taxes), frontend components, integration, and testing.

## Tasks

- [ ] 1. Project Setup and Infrastructure
  - [ ] 1.1 Initialize NestJS backend project with TypeScript configuration
    - Create NestJS project with CLI
    - Configure TypeScript with strict mode
    - Set up project structure (modules, controllers, services, guards, DTOs)
    - Configure environment variables (.env files)
    - _Requirements: 18.1, 20.1_

  - [ ] 1.2 Set up PostgreSQL database and Prisma ORM
    - Install and configure Prisma
    - Create initial Prisma schema with User model
    - Set up database connection
    - Configure Prisma client generation
    - _Requirements: 20.2_

  - [ ] 1.3 Initialize Next.js frontend project with TypeScript
    - Create Next.js project with TypeScript
    - Configure project structure (pages, components, services, hooks)
    - Set up environment variables for API endpoints
    - Configure CORS on backend for frontend communication
    - _Requirements: 21.1_

  - [ ] 1.4 Set up Redis for job queue and caching
    - Install and configure BullMQ for job processing
    - Set up Redis connection
    - Create base job processor structure
    - _Requirements: 12.1, 19.1_

  - [ ]* 1.5 Configure testing frameworks
    - Set up Jest for backend unit tests
    - Set up React Testing Library for frontend tests
    - Configure test database for integration tests
    - _Requirements: 22.2_

- [ ] 2. Checkpoint - Verify project setup
  - Ensure all projects initialize without errors, ask the user if questions arise.


- [ ] 3. Database Schema and Models
  - [x] 3.1 Define complete Prisma schema for all entities
    - Create User model with role enum (Admin, Internal_User, Portal_User)
    - Create EmailVerificationToken model with type enum
    - Create Product model with pricing fields
    - Create ProductVariant model with attributes and extra price
    - Create RecurringPlan model with billing period and behavior flags
    - Create Subscription model with status enum and relationships
    - Create OrderLine model with product, quantity, pricing
    - Create Invoice model with status enum and totals
    - Create Payment model with method and amount
    - Create Discount model with type enum (Fixed, Percentage)
    - Create Tax model with percentage
    - Create QuotationTemplate model
    - Define all relationships (one-to-many, many-to-many)
    - _Requirements: 1.1, 7.2-7.7, 8.1-8.4, 9.2-9.6, 10.2-10.6, 12.2-12.6, 14.2-14.5, 15.3-15.6, 16.2-16.3_

  - [x] 3.2 Run Prisma migrations to create database tables
    - Generate initial migration
    - Apply migration to development database
    - Verify all tables and relationships created correctly
    - _Requirements: 20.4_

  - [ ]* 3.3 Write property test for Prisma schema integrity
    - **Property 14: Product Variants Are Associated With Parent**
    - **Validates: Requirements 8.1**

- [ ] 4. Authentication Module
  - [ ] 4.1 Implement password hashing service
    - Create PasswordService with bcrypt for hashing
    - Implement hash() and verify() methods
    - _Requirements: 20.2_

  - [ ] 4.2 Implement JWT authentication service
    - Create AuthService with JWT token generation
    - Implement login() method with credential validation
    - Implement token verification
    - Configure JWT secret and expiration
    - _Requirements: 1.2, 1.3_

  - [ ]* 4.3 Write property tests for authentication
    - **Property 1: Valid Credentials Authenticate Successfully**
    - **Validates: Requirements 1.2**
    - **Property 2: Invalid Credentials Are Rejected**
    - **Validates: Requirements 1.3**

  - [ ] 4.4 Implement user registration service
    - Create UserService with registration logic
    - Validate email uniqueness
    - Validate password complexity (length > 8, uppercase, lowercase, special char)
    - Hash password before storage
    - _Requirements: 1.4, 2.1-2.5, 3.1-3.2_

  - [ ]* 4.5 Write property tests for registration
    - **Property 5: Password Validation Enforces Complexity Rules**
    - **Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.5**
    - **Property 6: Email Uniqueness Is Enforced**
    - **Validates: Requirements 3.1, 3.2**

  - [ ] 4.6 Implement password reset flow
    - Create EmailVerificationService for token generation
    - Implement requestPasswordReset() to generate token and send email
    - Implement verifyToken() to validate token and expiration
    - Implement resetPassword() to update password with valid token
    - Configure Nodemailer for email sending
    - _Requirements: 1.5, 1.6, 1.7_

  - [ ]* 4.7 Write property tests for password reset
    - **Property 3: Password Reset Sends Verification Email**
    - **Validates: Requirements 1.6**
    - **Property 4: Verification Link Enables Password Reset**
    - **Validates: Requirements 1.7**

  - [ ] 4.8 Create authentication controllers and DTOs
    - Create AuthController with login, register, password reset endpoints
    - Create DTOs: LoginDto, RegisterDto, PasswordResetRequestDto, PasswordResetDto
    - Add validation decorators to DTOs
    - _Requirements: 1.1, 1.4, 1.5, 21.2_

- [ ] 5. Authorization and Access Control
  - [ ] 5.1 Implement JWT authentication guard
    - Create JwtAuthGuard to protect routes
    - Extract and verify JWT from request headers
    - Attach user to request object
    - _Requirements: 4.1, 20.1_

  - [ ] 5.2 Implement role-based authorization guards
    - Create RolesGuard to check user roles
    - Create @Roles() decorator for role specification
    - Implement role checking logic (Admin, Internal_User, Portal_User)
    - Return authorization error for insufficient permissions
    - _Requirements: 4.2-4.6_

  - [ ]* 5.3 Write property tests for authorization
    - **Property 7: Admin Role Has Full Access**
    - **Validates: Requirements 4.2**
    - **Property 8: Internal User Role Has Limited Access**
    - **Validates: Requirements 4.3**
    - **Property 9: Portal User Access Is Isolated**
    - **Validates: Requirements 4.4**
    - **Property 10: Authorization Checks Are Enforced**
    - **Validates: Requirements 4.5, 4.6**

  - [ ] 5.3 Implement user management for admins
    - Create UserManagementService with createInternalUser() method
    - Restrict to Admin role only
    - Assign Internal_User role to created accounts
    - _Requirements: 5.1-5.3_

  - [ ]* 5.4 Write property tests for user management
    - **Property 11: Non-Admin Users Cannot Create Internal Users**
    - **Validates: Requirements 5.2**
    - **Property 12: Admin-Created Users Have Correct Role**
    - **Validates: Requirements 5.3**

- [ ] 6. Checkpoint - Verify authentication and authorization
  - Ensure all tests pass, ask the user if questions arise.


- [ ] 7. Product Management Module
  - [ ] 7.1 Implement Product service with CRUD operations
    - Create ProductService with create, findAll, findOne, update, delete methods
    - Validate required fields: name, type, sales price, cost price
    - Support recurring pricing configuration
    - _Requirements: 7.1-7.6_

  - [ ]* 7.2 Write property tests for product management
    - **Property 13: Product Creation Requires All Fields**
    - **Validates: Requirements 7.2, 7.3, 7.4, 7.5**

  - [ ] 7.3 Implement ProductVariant service
    - Create ProductVariantService with CRUD operations
    - Associate variants with parent products
    - Store variant attributes as JSON
    - Implement price calculation (base price + extra price)
    - _Requirements: 8.1-8.4_

  - [ ]* 7.4 Write property tests for product variants
    - **Property 15: Variant Price Calculation Is Correct**
    - **Validates: Requirements 8.4**

  - [ ] 7.5 Create Product controllers and DTOs
    - Create ProductController with REST endpoints
    - Create ProductVariantController with REST endpoints
    - Create DTOs: CreateProductDto, UpdateProductDto, CreateProductVariantDto
    - Add validation decorators
    - Apply role guards (Admin, Internal_User)
    - _Requirements: 7.1, 8.1, 21.2_

- [ ] 8. Recurring Plan Module
  - [ ] 8.1 Implement RecurringPlan service with CRUD operations
    - Create RecurringPlanService with create, findAll, findOne, update, delete methods
    - Support billing periods: Daily, Weekly, Monthly, Yearly
    - Configure behavior flags: auto-close, closable, pausable, renewable
    - _Requirements: 9.1-9.6_

  - [ ] 8.2 Create RecurringPlan controller and DTOs
    - Create RecurringPlanController with REST endpoints
    - Create DTOs: CreateRecurringPlanDto, UpdateRecurringPlanDto
    - Add validation decorators
    - Apply role guards (Admin, Internal_User)
    - _Requirements: 9.1, 21.2_

- [ ] 9. Subscription Management Module
  - [ ] 9.1 Implement Subscription service with CRUD operations
    - Create SubscriptionService with create, findAll, findOne, update, delete methods
    - Initialize new subscriptions with Draft status
    - Implement status transition validation (Draft → Quotation → Confirmed → Active → Closed)
    - _Requirements: 10.1-10.4_

  - [ ]* 9.2 Write property tests for subscription status
    - **Property 16: Subscriptions Initialize As Draft**
    - **Validates: Requirements 10.2**
    - **Property 17: Subscription Status Transitions Are Valid**
    - **Validates: Requirements 10.3, 10.4**

  - [ ] 9.3 Implement OrderLine service
    - Create OrderLineService with create, update, delete methods
    - Validate required fields: product, quantity, unit price, taxes, amount
    - Associate order lines with subscriptions
    - _Requirements: 10.5-10.6_

  - [ ]* 9.4 Write property tests for order lines
    - **Property 18: Order Lines Require All Fields**
    - **Validates: Requirements 10.6**

  - [ ] 9.5 Implement QuotationTemplate service
    - Create QuotationTemplateService with CRUD operations
    - Store predefined products and pricing
    - Implement createSubscriptionFromTemplate() to populate subscriptions
    - _Requirements: 11.1-11.3_

  - [ ]* 9.6 Write property tests for quotation templates
    - **Property 19: Template Data Populates Subscriptions**
    - **Validates: Requirements 11.3**

  - [ ] 9.7 Create Subscription controllers and DTOs
    - Create SubscriptionController with REST endpoints
    - Create OrderLineController with REST endpoints
    - Create QuotationTemplateController with REST endpoints
    - Create DTOs: CreateSubscriptionDto, UpdateSubscriptionDto, CreateOrderLineDto, CreateQuotationTemplateDto
    - Add validation decorators
    - Apply role guards (Admin, Internal_User for management; Portal_User for own data)
    - _Requirements: 10.1, 11.1, 21.2_

- [ ] 10. Checkpoint - Verify product and subscription modules
  - Ensure all tests pass, ask the user if questions arise.


- [ ] 11. Invoice Management Module
  - [ ] 11.1 Implement Invoice service with CRUD operations
    - Create InvoiceService with create, findAll, findOne, update methods
    - Initialize new invoices with Draft status
    - Implement status transition validation (Draft → Confirmed → Paid)
    - Implement confirm(), cancel(), send(), print() actions
    - _Requirements: 12.2, 13.1-13.5_

  - [ ]* 11.2 Write property tests for invoice status
    - **Property 21: Generated Invoices Initialize As Draft**
    - **Validates: Requirements 12.2**
    - **Property 24: Invoice Status Transitions Are Valid**
    - **Validates: Requirements 13.2, 13.3**
    - **Property 25: Confirming Invoice Updates Status**
    - **Validates: Requirements 13.5**

  - [ ] 11.3 Implement automatic invoice generation from subscriptions
    - Create InvoiceGenerationService
    - Listen for subscription status change to Active
    - Generate invoice with customer details from subscription
    - Copy order lines from subscription to invoice
    - Calculate and apply taxes
    - Calculate total amount including taxes
    - Queue invoice generation as background job
    - _Requirements: 12.1, 12.3-12.6_

  - [ ]* 11.4 Write property tests for invoice generation
    - **Property 20: Active Subscriptions Generate Invoices**
    - **Validates: Requirements 12.1**
    - **Property 22: Invoice Inherits Subscription Data**
    - **Validates: Requirements 12.3, 12.4**
    - **Property 23: Invoice Total Includes Taxes**
    - **Validates: Requirements 12.5, 12.6**

  - [ ] 11.5 Implement invoice email sending
    - Create EmailService with sendInvoice() method
    - Generate PDF invoice document
    - Send email with invoice attachment to customer
    - Queue email sending as background job
    - _Requirements: 13.6_

  - [ ]* 11.6 Write property tests for invoice email
    - **Property 26: Sending Invoice Delivers Email**
    - **Validates: Requirements 13.6**

  - [ ] 11.7 Create Invoice controllers and DTOs
    - Create InvoiceController with REST endpoints
    - Create DTOs: CreateInvoiceDto, UpdateInvoiceDto
    - Add validation decorators
    - Apply role guards (Admin, Internal_User)
    - _Requirements: 13.1, 21.2_

- [ ] 12. Payment Tracking Module
  - [ ] 12.1 Implement Payment service with CRUD operations
    - Create PaymentService with create, findAll, findOne methods
    - Validate required fields: invoice, payment method, amount, date
    - Implement payment-to-invoice association
    - Update invoice status to Paid when fully settled
    - _Requirements: 14.1-14.6_

  - [ ]* 12.2 Write property tests for payment tracking
    - **Property 27: Payment Creation Requires All Fields**
    - **Validates: Requirements 14.2, 14.3, 14.4, 14.5**
    - **Property 28: Full Payment Updates Invoice Status**
    - **Validates: Requirements 14.6**

  - [ ] 12.3 Create Payment controller and DTOs
    - Create PaymentController with REST endpoints
    - Create DTOs: CreatePaymentDto
    - Add validation decorators
    - Apply role guards (Admin, Internal_User)
    - _Requirements: 14.1, 21.2_

- [ ] 13. Discount Management Module
  - [ ] 13.1 Implement Discount service with CRUD operations
    - Create DiscountService with create, findAll, findOne, update, delete methods
    - Support discount types: Fixed, Percentage
    - Implement applyToProduct() to reduce product price
    - Implement applyToSubscription() to reduce subscription total
    - Restrict operations to Admin role only
    - _Requirements: 15.1-15.6_

  - [ ]* 13.2 Write property tests for discounts
    - **Property 29: Non-Admin Users Cannot Manage Discounts**
    - **Validates: Requirements 15.2**
    - **Property 30: Fixed Discount Reduces Price Correctly**
    - **Validates: Requirements 15.5**
    - **Property 31: Percentage Discount Reduces Price Correctly**
    - **Validates: Requirements 15.6**

  - [ ] 13.3 Create Discount controller and DTOs
    - Create DiscountController with REST endpoints
    - Create DTOs: CreateDiscountDto, UpdateDiscountDto
    - Add validation decorators
    - Apply Admin-only role guard
    - _Requirements: 15.1, 21.2_

- [ ] 14. Tax Management Module
  - [ ] 14.1 Implement Tax service with CRUD operations
    - Create TaxService with create, findAll, findOne, update, delete methods
    - Validate required fields: name, percentage
    - Implement calculateTax() to apply percentage to taxable amount
    - _Requirements: 16.1-16.5_

  - [ ]* 14.2 Write property tests for tax calculation
    - **Property 32: Tax Calculation Applies Percentage Correctly**
    - **Validates: Requirements 16.5**

  - [ ] 14.3 Create Tax controller and DTOs
    - Create TaxController with REST endpoints
    - Create DTOs: CreateTaxDto, UpdateTaxDto
    - Add validation decorators
    - Apply role guards (Admin, Internal_User)
    - _Requirements: 16.1, 21.2_

- [ ] 15. Checkpoint - Verify invoice, payment, discount, and tax modules
  - Ensure all tests pass, ask the user if questions arise.


- [ ] 16. Reporting Module
  - [ ] 16.1 Implement ReportService with report generation methods
    - Create ReportService with getActiveSubscriptions() method
    - Implement getRevenueOverTime() with date range filtering
    - Implement getPaymentsOverTime() with date range filtering
    - Implement getOverdueInvoices() method
    - Query database with appropriate filters and aggregations
    - _Requirements: 17.1-17.5_

  - [ ] 16.2 Create Report controller and DTOs
    - Create ReportController with REST endpoints for each report
    - Create DTOs: ReportDateRangeDto
    - Add validation decorators
    - Apply role guards (Admin, Internal_User)
    - _Requirements: 17.1-17.5, 21.2_

- [ ] 17. Dashboard Module
  - [ ] 17.1 Implement DashboardService with role-based metrics
    - Create DashboardService with getMetrics() method
    - Return Admin metrics: total subscriptions, revenue, active users, overdue invoices
    - Return Internal_User metrics: assigned subscriptions, pending invoices
    - Return Portal_User metrics: own subscriptions, payment history
    - _Requirements: 6.1-6.3_

  - [ ] 17.2 Create Dashboard controller
    - Create DashboardController with GET /dashboard endpoint
    - Return metrics based on authenticated user's role
    - Apply authentication guard
    - _Requirements: 6.1-6.3_

- [ ] 18. Security and Performance Enhancements
  - [ ] 18.1 Implement security middleware
    - Configure Helmet middleware for security headers
    - Configure CORS with appropriate origins
    - Implement rate limiting with @nestjs/throttler
    - Add request logging middleware
    - _Requirements: 20.1, 20.4_

  - [ ] 18.2 Implement input validation and sanitization
    - Configure class-validator globally
    - Add validation pipe to main.ts
    - Implement custom validators for complex rules
    - Add input sanitization for XSS prevention
    - _Requirements: 20.4, 21.2_

  - [ ] 18.3 Implement error handling and logging
    - Create global exception filter
    - Implement structured error responses
    - Configure Winston logger for application logging
    - Log errors with sufficient detail for troubleshooting
    - Ensure error messages don't reveal sensitive information
    - _Requirements: 20.3, 21.2, 22.2_

  - [ ] 18.4 Optimize database queries
    - Add database indexes for frequently queried fields
    - Implement pagination for list endpoints
    - Use Prisma select to fetch only required fields
    - Implement caching for frequently accessed data
    - _Requirements: 18.1, 19.1_

- [ ] 19. Background Job Processing
  - [ ] 19.1 Implement job processors for async operations
    - Create InvoiceGenerationProcessor for subscription-to-invoice jobs
    - Create EmailProcessor for email sending jobs
    - Configure job retry logic and error handling
    - Add job status monitoring
    - _Requirements: 12.1, 13.6_

  - [ ] 19.2 Create job queue management endpoints
    - Create JobController with endpoints to view job status
    - Implement retry and cancel operations for failed jobs
    - Apply Admin-only role guard
    - _Requirements: 22.2_

- [ ] 20. Checkpoint - Verify backend completeness
  - Ensure all tests pass, ask the user if questions arise.


- [ ] 21. Frontend Authentication and Layout
  - [ ] 21.1 Implement authentication context and hooks
    - Create AuthContext with login, logout, register state management
    - Create useAuth() hook for accessing auth state
    - Implement token storage in localStorage/cookies
    - Create API client with automatic token injection
    - _Requirements: 1.1-1.4_

  - [ ] 21.2 Create authentication pages
    - Create Login page with email/password form
    - Create Register page with validation
    - Create Password Reset Request page
    - Create Password Reset page with token verification
    - Display validation errors from backend
    - _Requirements: 1.1, 1.4, 1.5, 21.1, 21.2_

  - [ ] 21.3 Implement protected route wrapper
    - Create ProtectedRoute component to guard authenticated pages
    - Redirect to login if not authenticated
    - Implement role-based route protection
    - _Requirements: 4.1-4.6_

  - [ ] 21.4 Create main layout components
    - Create AppLayout with navigation sidebar
    - Create Header with user menu and logout
    - Implement role-based navigation menu items
    - Create responsive layout for mobile devices
    - _Requirements: 6.2, 21.1_

- [ ] 22. Frontend Dashboard
  - [ ] 22.1 Implement Dashboard page
    - Create Dashboard page component
    - Fetch metrics from backend based on user role
    - Display key metrics in card components
    - Create charts for revenue and payment trends
    - _Requirements: 6.1, 6.3_

- [ ] 23. Frontend Product Management
  - [ ] 23.1 Create Product list page
    - Create ProductList page with table/grid view
    - Fetch products from backend API
    - Implement search and filtering
    - Add pagination
    - _Requirements: 7.1, 21.1_

  - [ ] 23.2 Create Product form components
    - Create ProductForm component for create/edit
    - Implement form validation matching backend requirements
    - Handle product type selection
    - Support recurring pricing configuration
    - _Requirements: 7.2-7.6, 21.2_

  - [ ] 23.3 Create ProductVariant management UI
    - Create ProductVariantList component
    - Create ProductVariantForm for create/edit
    - Display calculated final price (base + extra)
    - Support attribute configuration
    - _Requirements: 8.1-8.4, 21.1_

- [ ] 24. Frontend Subscription Management
  - [ ] 24.1 Create Subscription list page
    - Create SubscriptionList page with filtering by status
    - Fetch subscriptions from backend API
    - Display subscription details in table
    - Implement search and pagination
    - For Portal_User, show only own subscriptions
    - _Requirements: 10.1, 4.4, 21.1_

  - [ ] 24.2 Create Subscription form components
    - Create SubscriptionForm component for create/edit
    - Implement customer selection
    - Implement recurring plan selection
    - Support status transitions with validation
    - _Requirements: 10.2-10.4, 21.2_

  - [ ] 24.3 Create OrderLine management UI
    - Create OrderLineList component within subscription
    - Create OrderLineForm for adding/editing lines
    - Implement product selection with price lookup
    - Calculate line totals automatically
    - Display subscription total
    - _Requirements: 10.5-10.6, 21.1_

  - [ ] 24.4 Create QuotationTemplate management UI
    - Create QuotationTemplateList page
    - Create QuotationTemplateForm for create/edit
    - Implement "Create Subscription from Template" action
    - _Requirements: 11.1-11.3, 21.1_

- [ ] 25. Checkpoint - Verify frontend authentication and core modules
  - Ensure all pages render correctly, ask the user if questions arise.


- [ ] 26. Frontend Invoice Management
  - [ ] 26.1 Create Invoice list page
    - Create InvoiceList page with filtering by status
    - Fetch invoices from backend API
    - Display invoice details in table
    - Implement search and pagination
    - _Requirements: 13.1, 21.1_

  - [ ] 26.2 Create Invoice detail page
    - Create InvoiceDetail page showing full invoice
    - Display customer information
    - Display order lines with taxes
    - Show total amount calculation
    - Implement action buttons: Confirm, Cancel, Send, Print
    - _Requirements: 12.3-12.6, 13.4-13.6, 21.1_

  - [ ] 26.3 Implement invoice PDF generation
    - Create invoice PDF template
    - Implement client-side PDF generation or backend download
    - Support print action
    - _Requirements: 13.4_

- [ ] 27. Frontend Payment Management
  - [ ] 27.1 Create Payment list page
    - Create PaymentList page with filtering
    - Fetch payments from backend API
    - Display payment details in table
    - Implement search and pagination
    - _Requirements: 14.1, 21.1_

  - [ ] 27.2 Create Payment form component
    - Create PaymentForm for recording payments
    - Implement invoice selection
    - Implement payment method selection
    - Validate payment amount
    - Display invoice status update on full payment
    - _Requirements: 14.2-14.6, 21.2_

- [ ] 28. Frontend Discount and Tax Management
  - [ ] 28.1 Create Discount management UI (Admin only)
    - Create DiscountList page with Admin guard
    - Create DiscountForm for create/edit
    - Support Fixed and Percentage types
    - Implement application to products/subscriptions
    - _Requirements: 15.1-15.6, 21.1_

  - [ ] 28.2 Create Tax management UI
    - Create TaxList page
    - Create TaxForm for create/edit
    - Display tax percentage configuration
    - _Requirements: 16.1-16.3, 21.1_

- [ ] 29. Frontend Reporting
  - [ ] 29.1 Create Reports page
    - Create ReportsPage with multiple report sections
    - Implement Active Subscriptions report with table
    - Implement Revenue Over Time report with chart
    - Implement Payments Over Time report with chart
    - Implement Overdue Invoices report with table
    - Add date range filters for time-based reports
    - _Requirements: 17.1-17.5, 21.1_

- [ ] 30. Frontend User Management (Admin only)
  - [ ] 30.1 Create User management UI
    - Create UserList page with Admin guard
    - Create UserForm for creating Internal_User accounts
    - Display user roles
    - Restrict to Admin role
    - _Requirements: 5.1-5.3, 21.1_

- [ ] 31. Frontend Error Handling and UX
  - [ ] 31.1 Implement global error handling
    - Create error boundary component
    - Display user-friendly error messages
    - Implement toast notifications for success/error
    - Handle API errors gracefully
    - _Requirements: 21.2, 22.3_

  - [ ] 31.2 Implement loading states
    - Create loading spinner component
    - Add loading states to all async operations
    - Implement skeleton screens for better UX
    - _Requirements: 21.1_

  - [ ] 31.3 Add form validation feedback
    - Display inline validation errors
    - Highlight invalid fields
    - Show validation messages matching backend rules
    - _Requirements: 21.2_

- [ ] 32. Checkpoint - Verify frontend completeness
  - Ensure all pages render correctly and interact with backend, ask the user if questions arise.


- [ ] 33. Integration and End-to-End Flows
  - [ ] 33.1 Implement complete subscription-to-invoice flow
    - Wire subscription status change to invoice generation
    - Verify invoice inherits correct data from subscription
    - Test tax calculation in generated invoices
    - Verify background job processing
    - _Requirements: 12.1-12.6_

  - [ ] 33.2 Implement complete payment-to-invoice flow
    - Wire payment creation to invoice status update
    - Verify invoice status changes to Paid on full payment
    - Test partial payment scenarios
    - _Requirements: 14.6_

  - [ ] 33.3 Implement discount application flow
    - Wire discount application to product pricing
    - Wire discount application to subscription totals
    - Verify price calculations with discounts
    - _Requirements: 15.5-15.6_

  - [ ] 33.4 Test email sending flow
    - Verify password reset emails are sent
    - Verify invoice emails are sent with PDF attachment
    - Test email queue processing
    - _Requirements: 1.6, 13.6_

  - [ ]* 33.5 Write integration tests for critical flows
    - Test complete subscription creation to invoice generation
    - Test payment recording and invoice status update
    - Test discount application and price calculation
    - Test role-based access control across modules
    - _Requirements: 12.1, 14.6, 15.5, 4.1-4.6_

- [ ] 34. Data Seeding and Testing Data
  - [ ] 34.1 Create database seed script
    - Create seed script with sample users (Admin, Internal_User, Portal_User)
    - Create sample products and variants
    - Create sample recurring plans
    - Create sample subscriptions with order lines
    - Create sample invoices and payments
    - Create sample discounts and taxes
    - _Requirements: 22.2_

  - [ ] 34.2 Create test data factories
    - Implement factory functions for each entity
    - Support randomized test data generation
    - Use in unit and integration tests
    - _Requirements: 22.2_

- [ ] 35. Documentation and Configuration
  - [ ] 35.1 Create API documentation
    - Document all REST endpoints with Swagger/OpenAPI
    - Include request/response examples
    - Document authentication requirements
    - Document role-based access for each endpoint
    - _Requirements: 21.3_

  - [ ] 35.2 Create deployment configuration
    - Create Docker Compose file for local development
    - Create Dockerfile for backend
    - Create Dockerfile for frontend
    - Configure environment variables for production
    - Document deployment steps
    - _Requirements: 22.1_

  - [ ] 35.3 Create README and setup instructions
    - Document prerequisites (Node.js, PostgreSQL, Redis)
    - Document installation steps
    - Document how to run migrations
    - Document how to seed database
    - Document how to run tests
    - Document how to start development servers
    - _Requirements: 21.3_

- [ ] 36. Final Testing and Validation
  - [ ]* 36.1 Run complete property-based test suite
    - Execute all property tests for authentication
    - Execute all property tests for authorization
    - Execute all property tests for business logic
    - Verify all properties pass
    - _Requirements: All requirements_

  - [ ]* 36.2 Run integration test suite
    - Execute all integration tests
    - Verify end-to-end flows work correctly
    - Test error scenarios and edge cases
    - _Requirements: 22.2, 22.3_

  - [ ]* 36.3 Perform manual testing
    - Test all user roles and permissions
    - Test all CRUD operations
    - Test all status transitions
    - Test all calculations (prices, taxes, totals)
    - Test email sending
    - Test report generation
    - _Requirements: All requirements_

  - [ ] 36.4 Performance testing
    - Test response times under normal load
    - Verify 2-second response time requirement
    - Test with thousands of subscriptions
    - Identify and optimize bottlenecks
    - _Requirements: 18.1, 19.1_

- [ ] 37. Final checkpoint - System ready for deployment
  - Ensure all tests pass, all features work correctly, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP delivery
- Each task references specific requirements for traceability
- Property-based tests validate universal correctness properties from the design document
- Integration tests validate end-to-end flows and component interactions
- The implementation follows a layered architecture with clear separation of concerns
- Background jobs handle asynchronous operations (invoice generation, email sending)
- Role-based access control is enforced at both backend (guards) and frontend (route protection)
- All sensitive operations require authentication and appropriate authorization
- The system uses TypeScript throughout for type safety
- Database migrations are managed through Prisma
- API documentation is generated with Swagger/OpenAPI
- The system is containerized with Docker for consistent deployment

