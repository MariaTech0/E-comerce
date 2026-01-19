-- ============================================
-- SETUP COMPLETO DO BANCO DE DADOS
-- E-commerce de Ebooks - Sistema Completo
-- ============================================

-- Limpar políticas existentes (se houver)
DROP POLICY IF EXISTS "Usuários podem ver seu próprio perfil" ON user_profiles;
DROP POLICY IF EXISTS "Usuários podem atualizar seu próprio perfil" ON user_profiles;
DROP POLICY IF EXISTS "Usuários podem inserir seu próprio perfil" ON user_profiles;
DROP POLICY IF EXISTS "Categorias visíveis publicamente" ON categories;
DROP POLICY IF EXISTS "Produtos visíveis publicamente" ON products;
DROP POLICY IF EXISTS "Usuários veem seus downloads" ON download_links;
DROP POLICY IF EXISTS "Reviews aprovadas visíveis" ON reviews;
DROP POLICY IF EXISTS "Usuários veem seus pedidos" ON orders;
DROP POLICY IF EXISTS "Usuários criam pedidos" ON orders;
DROP POLICY IF EXISTS "Usuários veem itens de seus pedidos" ON order_items;
DROP POLICY IF EXISTS "Cupons visíveis publicamente" ON coupons;

-- ============================================
-- TABELA: user_profiles
-- ============================================
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  role TEXT DEFAULT 'customer' CHECK (role IN ('customer', 'editor', 'support', 'superadmin')),
  force_password_change BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários podem ver seu próprio perfil" ON user_profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Usuários podem atualizar seu próprio perfil" ON user_profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Usuários podem inserir seu próprio perfil" ON user_profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- ============================================
-- TABELA: categories
-- ============================================
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  parent_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  image_url TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Categorias visíveis publicamente" ON categories FOR SELECT USING (is_active = true);

-- ============================================
-- TABELA: products
-- ============================================
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  author TEXT NOT NULL,
  isbn TEXT UNIQUE,
  sku TEXT UNIQUE NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  cover_url TEXT,
  sample_url TEXT,
  page_count INTEGER,
  language TEXT DEFAULT 'pt',
  publisher TEXT,
  published_date DATE,
  file_size_mb DECIMAL(10,2),
  format TEXT DEFAULT 'pdf' CHECK (format IN ('pdf', 'epub', 'mobi')),
  is_active BOOLEAN DEFAULT TRUE,
  is_featured BOOLEAN DEFAULT FALSE,
  downloads_count INTEGER DEFAULT 0,
  rating_avg DECIMAL(3,2) DEFAULT 0,
  rating_count INTEGER DEFAULT 0,
  meta_title TEXT,
  meta_description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Produtos visíveis publicamente" ON products FOR SELECT USING (is_active = true);

-- ============================================
-- TABELA: orders
-- ============================================
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT UNIQUE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  email TEXT NOT NULL,
  country TEXT NOT NULL,
  subtotal DECIMAL(10,2) NOT NULL,
  discount DECIMAL(10,2) DEFAULT 0,
  vat DECIMAL(10,2) NOT NULL,
  vat_rate DECIMAL(5,2) NOT NULL,
  total DECIMAL(10,2) NOT NULL,
  coupon_code TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
  payment_method TEXT,
  payment_intent_id TEXT,
  invoice_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários veem seus pedidos" ON orders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Usuários criam pedidos" ON orders FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ============================================
-- TABELA: order_items
-- ============================================
CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  author TEXT NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  license_key TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários veem itens de seus pedidos" ON order_items FOR SELECT USING (
  EXISTS (SELECT 1 FROM orders WHERE orders.id = order_items.order_id AND orders.user_id = auth.uid())
);

-- ============================================
-- TABELA: download_links
-- ============================================
CREATE TABLE IF NOT EXISTS download_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  max_downloads INTEGER DEFAULT 5,
  download_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE download_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários veem seus downloads" ON download_links FOR SELECT USING (
  EXISTS (SELECT 1 FROM orders WHERE orders.id = download_links.order_id AND orders.user_id = auth.uid())
);

-- ============================================
-- TABELA: reviews
-- ============================================
CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  title TEXT,
  comment TEXT,
  is_verified_purchase BOOLEAN DEFAULT FALSE,
  is_approved BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(product_id, user_id)
);

ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Reviews aprovadas visíveis" ON reviews FOR SELECT USING (is_approved = true);

-- ============================================
-- TABELA: coupons
-- ============================================
CREATE TABLE IF NOT EXISTS coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  discount_type TEXT CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value DECIMAL(10,2) NOT NULL,
  max_discount DECIMAL(10,2),
  min_purchase DECIMAL(10,2),
  valid_from TIMESTAMPTZ,
  valid_until TIMESTAMPTZ,
  usage_limit INTEGER,
  used_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Cupons visíveis publicamente" ON coupons FOR SELECT USING (is_active = true);

-- ============================================
-- TABELA: payments
-- ============================================
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  payment_intent_id TEXT NOT NULL,
  payment_method TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'eur',
  status TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- ============================================
-- ÍNDICES PARA PERFORMANCE
-- ============================================
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug);
CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_reviews_product ON reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_download_links_order ON download_links(order_id);

-- ============================================
-- DADOS INICIAIS: CATEGORIAS
-- ============================================
INSERT INTO categories (name, slug, description, image_url, is_active) VALUES
('Romance', 'romance', 'Histórias de amor e relacionamentos', 'https://readdy.ai/api/search-image?query=romantic%20couple%20reading%20books%20together%20in%20cozy%20library%20warm%20lighting%20soft%20pastel%20colors%20dreamy%20atmosphere%20elegant%20minimalist%20style&width=400&height=300&seq=cat-romance-001&orientation=landscape', true),
('Ficção Científica', 'ficcao-cientifica', 'Aventuras futuristas e tecnológicas', 'https://readdy.ai/api/search-image?query=futuristic%20spaceship%20flying%20through%20galaxy%20stars%20planets%20nebula%20blue%20purple%20colors%20science%20fiction%20digital%20art%20style&width=400&height=300&seq=cat-scifi-002&orientation=landscape', true),
('Fantasia', 'fantasia', 'Mundos mágicos e criaturas fantásticas', 'https://readdy.ai/api/search-image?query=magical%20fantasy%20castle%20floating%20in%20clouds%20dragons%20flying%20mystical%20atmosphere%20purple%20gold%20colors%20epic%20fantasy%20art&width=400&height=300&seq=cat-fantasy-003&orientation=landscape', true),
('Autoajuda', 'autoajuda', 'Desenvolvimento pessoal e motivação', 'https://readdy.ai/api/search-image?query=person%20climbing%20mountain%20peak%20sunrise%20achievement%20success%20motivation%20orange%20golden%20colors%20inspirational%20minimalist%20design&width=400&height=300&seq=cat-selfhelp-004&orientation=landscape', true),
('Negócios', 'negocios', 'Estratégias e gestão empresarial', 'https://readdy.ai/api/search-image?query=modern%20office%20workspace%20business%20charts%20graphs%20laptop%20professional%20clean%20blue%20gray%20colors%20corporate%20minimalist%20style&width=400&height=300&seq=cat-business-005&orientation=landscape', true),
('Tecnologia', 'tecnologia', 'Programação e inovação digital', 'https://readdy.ai/api/search-image?query=computer%20code%20programming%20digital%20technology%20circuit%20board%20green%20blue%20neon%20colors%20tech%20modern%20design&width=400&height=300&seq=cat-tech-006&orientation=landscape', true),
('Saúde', 'saude', 'Bem-estar e qualidade de vida', 'https://readdy.ai/api/search-image?query=healthy%20lifestyle%20yoga%20meditation%20wellness%20nature%20green%20plants%20peaceful%20calm%20atmosphere%20natural%20colors&width=400&height=300&seq=cat-health-007&orientation=landscape', true),
('História', 'historia', 'Eventos e personagens históricos', 'https://readdy.ai/api/search-image?query=ancient%20library%20old%20books%20historical%20documents%20vintage%20sepia%20brown%20colors%20classic%20elegant%20atmosphere&width=400&height=300&seq=cat-history-008&orientation=landscape', true),
('Biografia', 'biografia', 'Vidas inspiradoras e trajetórias', 'https://readdy.ai/api/search-image?query=silhouette%20person%20standing%20spotlight%20stage%20dramatic%20lighting%20black%20gold%20colors%20inspirational%20elegant%20design&width=400&height=300&seq=cat-bio-009&orientation=landscape', true),
('Culinária', 'culinaria', 'Receitas e gastronomia', 'https://readdy.ai/api/search-image?query=gourmet%20food%20cooking%20kitchen%20fresh%20ingredients%20colorful%20vegetables%20warm%20inviting%20colors%20culinary%20art%20style&width=400&height=300&seq=cat-cooking-010&orientation=landscape', true)
ON CONFLICT (slug) DO NOTHING;

-- ============================================
-- DADOS INICIAIS: PRODUTOS
-- ============================================
INSERT INTO products (title, slug, author, sku, description, price, category_id, cover_url, page_count, language, format, is_active, is_featured) 
SELECT 
  'O Amor em Tempos Modernos',
  'o-amor-em-tempos-modernos',
  'Ana Silva',
  'EBOOK-ROM-001',
  'Uma história emocionante sobre amor e relacionamentos na era digital. Descubra como dois corações se encontram em meio ao caos da vida moderna.',
  12.99,
  id,
  'https://readdy.ai/api/search-image?query=romantic%20couple%20holding%20hands%20sunset%20city%20skyline%20modern%20urban%20love%20story%20warm%20pink%20orange%20colors%20elegant%20book%20cover%20design&width=400&height=600&seq=prod-romance-001&orientation=portrait',
  320,
  'pt',
  'pdf',
  true,
  true
FROM categories WHERE slug = 'romance'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO products (title, slug, author, sku, description, price, category_id, cover_url, page_count, language, format, is_active, is_featured) 
SELECT 
  'Viagem às Estrelas',
  'viagem-as-estrelas',
  'Carlos Mendes',
  'EBOOK-SCI-001',
  'Uma aventura épica pelo espaço sideral. Acompanhe a tripulação da nave Esperança em sua missão para salvar a humanidade.',
  16.99,
  id,
  'https://readdy.ai/api/search-image?query=spaceship%20traveling%20through%20colorful%20nebula%20stars%20planets%20cosmic%20journey%20blue%20purple%20colors%20science%20fiction%20book%20cover&width=400&height=600&seq=prod-scifi-001&orientation=portrait',
  450,
  'pt',
  'pdf',
  true,
  true
FROM categories WHERE slug = 'ficcao-cientifica'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO products (title, slug, author, sku, description, price, category_id, cover_url, page_count, language, format, is_active, is_featured) 
SELECT 
  'O Reino dos Dragões',
  'o-reino-dos-dragoes',
  'Maria Santos',
  'EBOOK-FAN-001',
  'Entre em um mundo mágico onde dragões e humanos coexistem. Uma jornada épica de coragem, magia e destino.',
  18.99,
  id,
  'https://readdy.ai/api/search-image?query=majestic%20dragon%20flying%20over%20medieval%20castle%20mountains%20magical%20fantasy%20world%20purple%20gold%20colors%20epic%20fantasy%20book%20cover&width=400&height=600&seq=prod-fantasy-001&orientation=portrait',
  520,
  'pt',
  'epub',
  true,
  true
FROM categories WHERE slug = 'fantasia'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO products (title, slug, author, sku, description, price, category_id, cover_url, page_count, language, format, is_active, is_featured) 
SELECT 
  'O Poder do Agora',
  'o-poder-do-agora',
  'João Costa',
  'EBOOK-AUT-001',
  'Descubra como viver o momento presente e transformar sua vida. Técnicas práticas para alcançar paz interior e felicidade.',
  19.99,
  id,
  'https://readdy.ai/api/search-image?query=person%20meditating%20peaceful%20nature%20sunrise%20mindfulness%20zen%20calm%20atmosphere%20soft%20green%20orange%20colors%20self%20help%20book%20cover&width=400&height=600&seq=prod-selfhelp-001&orientation=portrait',
  280,
  'pt',
  'pdf',
  true,
  true
FROM categories WHERE slug = 'autoajuda'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO products (title, slug, author, sku, description, price, category_id, cover_url, page_count, language, format, is_active, is_featured) 
SELECT 
  'De Zero a Um',
  'de-zero-a-um',
  'Pedro Oliveira',
  'EBOOK-NEG-001',
  'Como construir startups que criam o futuro. Estratégias inovadoras para empreendedores visionários.',
  24.99,
  id,
  'https://readdy.ai/api/search-image?query=startup%20rocket%20launching%20upward%20growth%20chart%20business%20success%20blue%20white%20colors%20modern%20professional%20book%20cover&width=400&height=600&seq=prod-business-001&orientation=portrait',
  350,
  'pt',
  'pdf',
  true,
  true
FROM categories WHERE slug = 'negocios'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO products (title, slug, author, sku, description, price, category_id, cover_url, page_count, language, format, is_active) 
SELECT 
  'Clean Code',
  'clean-code',
  'Robert Martin',
  'EBOOK-TEC-001',
  'Um guia completo para escrever código limpo e manutenível. Aprenda as melhores práticas de programação.',
  28.99,
  id,
  'https://readdy.ai/api/search-image?query=clean%20code%20programming%20computer%20screen%20elegant%20minimalist%20design%20green%20white%20colors%20tech%20book%20cover&width=400&height=600&seq=prod-tech-001&orientation=portrait',
  464,
  'pt',
  'pdf',
  true
FROM categories WHERE slug = 'tecnologia'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO products (title, slug, author, sku, description, price, category_id, cover_url, page_count, language, format, is_active) 
SELECT 
  'Saúde e Bem-Estar',
  'saude-e-bem-estar',
  'Dra. Beatriz Lima',
  'EBOOK-SAU-001',
  'Guia completo para uma vida saudável. Nutrição, exercícios e equilíbrio mental.',
  19.99,
  id,
  'https://readdy.ai/api/search-image?query=healthy%20lifestyle%20fruits%20vegetables%20yoga%20wellness%20fresh%20green%20colors%20health%20book%20cover&width=400&height=600&seq=prod-health-001&orientation=portrait',
  380,
  'pt',
  'pdf',
  true
FROM categories WHERE slug = 'saude'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO products (title, slug, author, sku, description, price, category_id, cover_url, page_count, language, format, is_active) 
SELECT 
  'História do Brasil',
  'historia-do-brasil',
  'Prof. Ricardo Alves',
  'EBOOK-HIS-001',
  'Uma jornada fascinante pela história do Brasil, desde o descobrimento até os dias atuais.',
  22.99,
  id,
  'https://readdy.ai/api/search-image?query=brazil%20history%20colonial%20architecture%20vintage%20sepia%20colors%20historical%20book%20cover&width=400&height=600&seq=prod-history-001&orientation=portrait',
  540,
  'pt',
  'pdf',
  true
FROM categories WHERE slug = 'historia'
ON CONFLICT (slug) DO NOTHING;

-- ============================================
-- DADOS INICIAIS: CUPONS
-- ============================================
INSERT INTO coupons (code, discount_type, discount_value, max_discount, min_purchase, valid_from, valid_until, usage_limit, is_active) VALUES
('BEMVINDO10', 'percentage', 10, NULL, NULL, NOW(), NOW() + INTERVAL '30 days', 100, true),
('VERAO2024', 'percentage', 20, 10, 30, NOW(), NOW() + INTERVAL '60 days', 200, true),
('DESCONTO5', 'fixed', 5, NULL, 15, NOW(), NOW() + INTERVAL '90 days', NULL, true)
ON CONFLICT (code) DO NOTHING;

-- ============================================
-- FIM DO SETUP
-- ============================================
