import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Variáveis de ambiente do Supabase não configuradas');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Tipos do banco de dados
export interface Product {
  id: string;
  title: string;
  slug: string;
  author: string;
  isbn?: string;
  sku: string;
  description?: string;
  price: number;
  category_id?: string;
  cover_url?: string;
  sample_url?: string;
  page_count?: number;
  language: string;
  publisher?: string;
  published_date?: string;
  file_size_mb?: number;
  format: 'pdf' | 'epub' | 'mobi';
  is_active: boolean;
  downloads_count: number;
  rating_avg: number;
  rating_count: number;
  meta_title?: string;
  meta_description?: string;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  parent_id?: string;
  image_url?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Order {
  id: string;
  order_number: string;
  user_id?: string;
  email: string;
  country: string;
  subtotal: number;
  discount: number;
  vat: number;
  vat_rate: number;
  total: number;
  coupon_code?: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  payment_status: 'pending' | 'paid' | 'failed' | 'refunded';
  payment_method?: string;
  payment_intent_id?: string;
  invoice_url?: string;
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id?: string;
  title: string;
  author: string;
  price: number;
  quantity: number;
  license_key?: string;
  created_at: string;
}

export interface Review {
  id: string;
  product_id: string;
  user_id: string;
  rating: number;
  title?: string;
  comment?: string;
  is_verified_purchase: boolean;
  is_approved: boolean;
  created_at: string;
  updated_at: string;
}

export interface Coupon {
  id: string;
  code: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  max_discount?: number;
  min_purchase?: number;
  valid_from?: string;
  valid_until?: string;
  usage_limit?: number;
  used_count: number;
  is_active: boolean;
  created_at: string;
}

export interface DownloadLink {
  id: string;
  order_id: string;
  product_id: string;
  token: string;
  expires_at: string;
  max_downloads: number;
  download_count: number;
  is_active: boolean;
  created_at: string;
}

export interface UserProfile {
  id: string;
  full_name: string;
  role: 'customer' | 'editor' | 'support' | 'superadmin';
  force_password_change: boolean;
  created_at: string;
  updated_at: string;
}
