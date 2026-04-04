// User model
export interface User {
  id: string;
  email: string;
  password: string;
  role: string;
  created_at: string;
  updated_at: string;
}

// Email verification token model
export interface EmailVerificationToken {
  id: string;
  token: string;
  type: string;
  user_id: string;
  expires_at: string;
  created_at: string;
}

// Product model
export interface Product {
  id: string;
  name: string;
  type: string;
  sales_price: number;
  cost_price: number;
  is_recurring: number;
  created_at: string;
  updated_at: string;
}

// Product variant model
export interface ProductVariant {
  id: string;
  product_id: string;
  attributes: string;
  extra_price: number;
  created_at: string;
  updated_at: string;
}

// Recurring plan model
export interface RecurringPlan {
  id: string;
  name: string;
  billing_period: string;
  auto_close: number;
  closable: number;
  pausable: number;
  renewable: number;
  created_at: string;
  updated_at: string;
}

// Subscription model
export interface Subscription {
  id: string;
  user_id: string;
  recurring_plan_id: string | null;
  status: string;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
  updated_at: string;
}

// Invoice model
export interface Invoice {
  id: string;
  subscription_id: string;
  status: string;
  customer_email: string;
  subtotal: number;
  tax_amount: number;
  total: number;
  due_date: string | null;
  created_at: string;
  updated_at: string;
}

// Order line model
export interface OrderLine {
  id: string;
  subscription_id: string | null;
  invoice_id: string | null;
  product_id: string;
  product_variant_id: string | null;
  quantity: number;
  unit_price: number;
  amount: number;
  created_at: string;
  updated_at: string;
}

// Payment model
export interface Payment {
  id: string;
  invoice_id: string;
  payment_method: string;
  amount: number;
  payment_date: string;
  created_at: string;
  updated_at: string;
}

// Discount model
export interface Discount {
  id: string;
  name: string;
  type: string;
  value: number;
  product_id: string | null;
  subscription_id: string | null;
  created_at: string;
  updated_at: string;
}

// Tax model
export interface Tax {
  id: string;
  name: string;
  percentage: number;
  created_at: string;
  updated_at: string;
}

// Quotation template model
export interface QuotationTemplate {
  id: string;
  name: string;
  description: string | null;
  template_data: string;
  created_at: string;
  updated_at: string;
}
