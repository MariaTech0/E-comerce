-- ============================================
-- SQL CORRIGIDO - SEM ERROS
-- Execute este arquivo no Supabase SQL Editor
-- ============================================

-- ============================================
-- 1. CRIAR TABELAS (se não existirem)
-- ============================================

-- User Profiles
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  role TEXT DEFAULT 'customer' CHECK (role IN ('superadmin', 'editor', 'support', 'customer')),
  force_password_change BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Categories
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  image_url TEXT,
  parent_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Products
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  author TEXT,
  isbn TEXT,
  description TEXT,
  short_description TEXT,
  price DECIMAL(10,2) NOT NULL,
  compare_at_price DECIMAL(10,2),
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  cover_image TEXT,
  sample_pdf_url TEXT,
  file_url TEXT,
  file_size BIGINT,
  page_count INTEGER,
  language TEXT DEFAULT 'pt',
  publisher TEXT,
  published_date DATE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'draft', 'archived')),
  is_featured BOOLEAN DEFAULT false,
  download_limit INTEGER DEFAULT 3,
  views_count INTEGER DEFAULT 0,
  downloads_count INTEGER DEFAULT 0,
  rating_average DECIMAL(3,2) DEFAULT 0,
  rating_count INTEGER DEFAULT 0,
  meta_title TEXT,
  meta_description TEXT,
  meta_keywords TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Orders
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT UNIQUE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'refunded')),
  subtotal DECIMAL(10,2) NOT NULL,
  discount_amount DECIMAL(10,2) DEFAULT 0,
  tax_amount DECIMAL(10,2) DEFAULT 0,
  total DECIMAL(10,2) NOT NULL,
  coupon_code TEXT,
  payment_method TEXT,
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
  payment_intent_id TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Order Items
CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  quantity INTEGER DEFAULT 1,
  subtotal DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Download Links
CREATE TABLE IF NOT EXISTS download_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  token TEXT UNIQUE NOT NULL,
  download_count INTEGER DEFAULT 0,
  max_downloads INTEGER DEFAULT 3,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Reviews
CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title TEXT,
  comment TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Coupons
CREATE TABLE IF NOT EXISTS coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  description TEXT,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value DECIMAL(10,2) NOT NULL,
  min_purchase_amount DECIMAL(10,2) DEFAULT 0,
  max_uses INTEGER,
  used_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  starts_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 2. CRIAR ÍNDICES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);
CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug);
CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_reviews_product ON reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_download_links_token ON download_links(token);

-- ============================================
-- 3. HABILITAR RLS
-- ============================================

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE download_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 4. INSERIR DADOS INICIAIS
-- ============================================

-- Categorias (apenas se não existirem)
INSERT INTO categories (name, slug, description, display_order, is_active)
SELECT * FROM (VALUES
  ('Romance', 'romance', 'Histórias de amor e relacionamentos', 1, true),
  ('Ficção Científica', 'ficcao-cientifica', 'Aventuras futuristas e tecnológicas', 2, true),
  ('Fantasia', 'fantasia', 'Mundos mágicos e criaturas fantásticas', 3, true),
  ('Mistério', 'misterio', 'Suspense e investigações', 4, true),
  ('Thriller', 'thriller', 'Histórias de suspense e ação', 5, true),
  ('Autoajuda', 'autoajuda', 'Desenvolvimento pessoal', 6, true),
  ('Negócios', 'negocios', 'Empreendedorismo e gestão', 7, true),
  ('Tecnologia', 'tecnologia', 'Programação e inovação', 8, true),
  ('História', 'historia', 'Eventos históricos', 9, true),
  ('Biografia', 'biografia', 'Histórias de vida', 10, true)
) AS v(name, slug, description, display_order, is_active)
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE slug = v.slug);

-- Produtos (apenas se não existirem)
INSERT INTO products (title, slug, author, price, category_id, cover_image, description, status, is_featured)
SELECT * FROM (VALUES
  (
    'O Amor em Tempos Modernos',
    'amor-tempos-modernos',
    'Ana Silva',
    12.99,
    (SELECT id FROM categories WHERE slug = 'romance' LIMIT 1),
    'https://readdy.ai/api/search-image?query=romantic%20couple%20holding%20hands%20at%20sunset%20on%20beach%20with%20warm%20golden%20light%20soft%20pastel%20colors%20dreamy%20atmosphere%20minimalist%20background%20elegant%20composition&width=400&height=600&seq=1&orientation=portrait',
    'Uma história emocionante sobre amor, perdas e recomeços na era digital.',
    'active',
    true
  ),
  (
    'Viagem às Estrelas',
    'viagem-estrelas',
    'Carlos Mendes',
    16.99,
    (SELECT id FROM categories WHERE slug = 'ficcao-cientifica' LIMIT 1),
    'https://readdy.ai/api/search-image?query=futuristic%20spaceship%20traveling%20through%20colorful%20nebula%20with%20distant%20stars%20and%20planets%20cosmic%20adventure%20vibrant%20colors%20clean%20simple%20background&width=400&height=600&seq=2&orientation=portrait',
    'Uma aventura épica pelo universo em busca de novos mundos.',
    'active',
    true
  ),
  (
    'O Reino dos Dragões',
    'reino-dragoes',
    'Maria Costa',
    18.99,
    (SELECT id FROM categories WHERE slug = 'fantasia' LIMIT 1),
    'https://readdy.ai/api/search-image?query=majestic%20dragon%20flying%20over%20medieval%20castle%20with%20mountains%20in%20background%20fantasy%20art%20style%20magical%20atmosphere%20soft%20lighting%20simple%20clean%20background&width=400&height=600&seq=3&orientation=portrait',
    'Um mundo mágico onde dragões e humanos coexistem.',
    'active',
    true
  ),
  (
    'O Poder do Agora',
    'poder-agora',
    'João Santos',
    19.99,
    (SELECT id FROM categories WHERE slug = 'autoajuda' LIMIT 1),
    'https://readdy.ai/api/search-image?query=peaceful%20meditation%20scene%20with%20person%20sitting%20in%20lotus%20position%20surrounded%20by%20soft%20light%20and%20nature%20calm%20serene%20atmosphere%20minimalist%20clean%20background&width=400&height=600&seq=4&orientation=portrait',
    'Aprenda a viver o momento presente e transformar sua vida.',
    'active',
    true
  ),
  (
    'De Zero a Um',
    'zero-um',
    'Pedro Oliveira',
    24.99,
    (SELECT id FROM categories WHERE slug = 'negocios' LIMIT 1),
    'https://readdy.ai/api/search-image?query=modern%20entrepreneur%20working%20on%20laptop%20with%20startup%20growth%20charts%20and%20graphs%20professional%20business%20atmosphere%20clean%20simple%20background%20bright%20lighting&width=400&height=600&seq=5&orientation=portrait',
    'Como construir o futuro através da inovação e empreendedorismo.',
    'active',
    true
  )
) AS v(title, slug, author, price, category_id, cover_image, description, status, is_featured)
WHERE NOT EXISTS (SELECT 1 FROM products WHERE slug = v.slug);

-- Cupons (apenas se não existirem)
INSERT INTO coupons (code, description, discount_type, discount_value, min_purchase_amount, max_uses, is_active)
SELECT * FROM (VALUES
  ('BEMVINDO10', '10% de desconto na primeira compra', 'percentage', 10, 0, 100, true),
  ('VERAO2024', '20% de desconto em compras acima de €30', 'percentage', 20, 30, 200, true),
  ('DESCONTO5', '€5 de desconto em compras acima de €15', 'fixed', 5, 15, NULL, true)
) AS v(code, description, discount_type, discount_value, min_purchase_amount, max_uses, is_active)
WHERE NOT EXISTS (SELECT 1 FROM coupons WHERE code = v.code);

-- ============================================
-- 5. CRIAR VIEW PARA PEDIDOS COMPLETOS
-- ============================================

CREATE OR REPLACE VIEW orders_full AS
SELECT 
  o.*,
  json_agg(
    json_build_object(
      'id', oi.id,
      'product_id', oi.product_id,
      'title', oi.title,
      'price', oi.price,
      'quantity', oi.quantity,
      'subtotal', oi.subtotal
    )
  ) AS items
FROM orders o
LEFT JOIN order_items oi ON o.id = oi.order_id
GROUP BY o.id;

-- ============================================
-- CONCLUÍDO! ✅
-- ============================================
-- Agora execute no SQL Editor do Supabase:
-- 
-- INSERT INTO user_profiles (id, full_name, role, force_password_change) 
-- VALUES ('SEU_USER_ID_AQUI', 'Carminha', 'superadmin', false)
-- ON CONFLICT (id) DO UPDATE SET role = 'superadmin', force_password_change = false;
-- 
-- Substitua SEU_USER_ID_AQUI pelo UUID do seu usuário
-- ============================================