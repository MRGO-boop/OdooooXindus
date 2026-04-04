-- Subscription Management System Database Schema
-- SQLite Database

-- Users table with role-based access
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'Portal_User',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Email verification tokens for password reset and email verification
CREATE TABLE IF NOT EXISTS email_verification_tokens (
    id TEXT PRIMARY KEY,
    token TEXT UNIQUE NOT NULL,
    type TEXT NOT NULL,
    user_id TEXT NOT NULL,
    expires_at DATETIME NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_email_tokens_token ON email_verification_tokens(token);
CREATE INDEX IF NOT EXISTS idx_email_tokens_user_id ON email_verification_tokens(user_id);

-- Products table
CREATE TABLE IF NOT EXISTS products (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    sales_price REAL NOT NULL,
    cost_price REAL NOT NULL,
    is_recurring INTEGER NOT NULL DEFAULT 0,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_products_name ON products(name);

-- Product variants
CREATE TABLE IF NOT EXISTS product_variants (
    id TEXT PRIMARY KEY,
    product_id TEXT NOT NULL,
    attributes TEXT NOT NULL,
    extra_price REAL NOT NULL DEFAULT 0,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_product_variants_product_id ON product_variants(product_id);

-- Recurring plans
CREATE TABLE IF NOT EXISTS recurring_plans (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    billing_period TEXT NOT NULL,
    auto_close INTEGER NOT NULL DEFAULT 0,
    closable INTEGER NOT NULL DEFAULT 1,
    pausable INTEGER NOT NULL DEFAULT 0,
    renewable INTEGER NOT NULL DEFAULT 1,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_recurring_plans_name ON recurring_plans(name);

-- Subscriptions
CREATE TABLE IF NOT EXISTS subscriptions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    recurring_plan_id TEXT,
    status TEXT NOT NULL DEFAULT 'Draft',
    start_date DATETIME,
    end_date DATETIME,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (recurring_plan_id) REFERENCES recurring_plans(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_recurring_plan_id ON subscriptions(recurring_plan_id);

-- Invoices
CREATE TABLE IF NOT EXISTS invoices (
    id TEXT PRIMARY KEY,
    subscription_id TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'Draft',
    customer_email TEXT NOT NULL,
    subtotal REAL NOT NULL,
    tax_amount REAL NOT NULL,
    total REAL NOT NULL,
    due_date DATETIME,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (subscription_id) REFERENCES subscriptions(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_invoices_subscription_id ON invoices(subscription_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_customer_email ON invoices(customer_email);

-- Order lines (can belong to subscription or invoice)
CREATE TABLE IF NOT EXISTS order_lines (
    id TEXT PRIMARY KEY,
    subscription_id TEXT,
    invoice_id TEXT,
    product_id TEXT NOT NULL,
    product_variant_id TEXT,
    quantity INTEGER NOT NULL,
    unit_price REAL NOT NULL,
    amount REAL NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (subscription_id) REFERENCES subscriptions(id) ON DELETE CASCADE,
    FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT,
    FOREIGN KEY (product_variant_id) REFERENCES product_variants(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_order_lines_subscription_id ON order_lines(subscription_id);
CREATE INDEX IF NOT EXISTS idx_order_lines_invoice_id ON order_lines(invoice_id);
CREATE INDEX IF NOT EXISTS idx_order_lines_product_id ON order_lines(product_id);

-- Payments
CREATE TABLE IF NOT EXISTS payments (
    id TEXT PRIMARY KEY,
    invoice_id TEXT NOT NULL,
    payment_method TEXT NOT NULL,
    amount REAL NOT NULL,
    payment_date DATETIME NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_payments_invoice_id ON payments(invoice_id);
CREATE INDEX IF NOT EXISTS idx_payments_payment_date ON payments(payment_date);

-- Discounts
CREATE TABLE IF NOT EXISTS discounts (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    value REAL NOT NULL,
    product_id TEXT,
    subscription_id TEXT,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    FOREIGN KEY (subscription_id) REFERENCES subscriptions(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_discounts_product_id ON discounts(product_id);
CREATE INDEX IF NOT EXISTS idx_discounts_subscription_id ON discounts(subscription_id);

-- Taxes
CREATE TABLE IF NOT EXISTS taxes (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    percentage REAL NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_taxes_name ON taxes(name);

-- Order line taxes (many-to-many relationship)
CREATE TABLE IF NOT EXISTS order_line_taxes (
    order_line_id TEXT NOT NULL,
    tax_id TEXT NOT NULL,
    PRIMARY KEY (order_line_id, tax_id),
    FOREIGN KEY (order_line_id) REFERENCES order_lines(id) ON DELETE CASCADE,
    FOREIGN KEY (tax_id) REFERENCES taxes(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_order_line_taxes_tax_id ON order_line_taxes(tax_id);

-- Quotation templates
CREATE TABLE IF NOT EXISTS quotation_templates (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    template_data TEXT NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_quotation_templates_name ON quotation_templates(name);
