export type Role = 'admin' | 'cashier'
export type PaymentMethod = 'cash' | 'qris'
export type TransactionStatus = 'completed' | 'cancelled'

export interface Category {
  id: string
  name: string
  description?: string
  created_at: string
}

export interface Product {
  id: string
  name: string
  description?: string
  category_id?: string
  category?: Category
  price: number
  cost_price: number
  stock: number
  min_stock: number
  image_url?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface UserProfile {
  id: string
  full_name: string
  role: Role
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Transaction {
  id: string
  transaction_code: string
  cashier_id?: string
  cashier_name?: string
  payment_method: PaymentMethod
  subtotal: number
  discount: number
  total: number
  cash_received?: number
  change_amount?: number
  status: TransactionStatus
  notes?: string
  created_at: string
  transaction_items?: TransactionItem[]
}

export interface TransactionItem {
  id: string
  transaction_id: string
  product_id?: string
  product_name: string
  product_price: number
  quantity: number
  subtotal: number
  created_at: string
}

export interface StoreSettings {
  id: string
  store_name: string
  address?: string
  phone?: string
  qris_image_url?: string
  receipt_footer?: string
  created_at: string
  updated_at: string
}

export interface CartItem {
  product: Product
  quantity: number
  subtotal: number
}
