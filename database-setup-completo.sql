-- ============================================
-- SCRIPT SQL COMPLETO PARA E-COMMERCE DE EBOOKS
-- Execute este script no SQL Editor do Supabase
-- ============================================

-- 1. TABELA DE PERFIS DE USUÁRIOS
-- ============================================
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'superadmin', 'editor', 'support')),
  force_password_change BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON user_profiles(role);
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON user_profiles(id);

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Usuários podem ver seu próprio perfil" ON user_profiles;
CREATE POLICY "Usuários podem ver seu próprio perfil" ON user_profiles
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Usuários podem atualizar seu próprio perfil" ON user_profiles;
CREATE POLICY "Usuários podem atualizar seu próprio perfil" ON user_profiles
  FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Admins podem ver todos os perfis" ON user_profiles;
CREATE POLICY "Admins podem ver todos os perfis" ON user_profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role IN ('superadmin', 'editor', 'support')
    )
  );

DROP POLICY IF EXISTS "Sistema pode inserir perfis" ON user_profiles;
CREATE POLICY "Sistema pode inserir perfis" ON user_profiles
  FOR INSERT WITH CHECK (true);

-- 2. TABELA DE CATEGORIAS
-- ============================================
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  parent_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug);
CREATE INDEX IF NOT EXISTS idx_categories_parent ON categories(parent_id);

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Categorias são públicas" ON categories;
CREATE POLICY "Categorias são públicas" ON categories FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins podem gerenciar categorias" ON categories;
CREATE POLICY "Admins podem gerenciar categorias" ON categories
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role IN ('superadmin', 'editor')
    )
  );

-- 3. TABELA DE PRODUTOS
-- ============================================
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  author TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  original_price DECIMAL(10,2),
  isbn TEXT,
  publisher TEXT,
  publication_year INTEGER,
  pages INTEGER,
  language TEXT DEFAULT 'pt',
  format TEXT[] DEFAULT ARRAY['pdf'],
  cover_url TEXT,
  sample_url TEXT,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  is_active BOOLEAN DEFAULT TRUE,
  is_featured BOOLEAN DEFAULT FALSE,
  downloads_count INTEGER DEFAULT 0,
  rating DECIMAL(3,2) DEFAULT 0,
  reviews_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_active ON products(is_active);
CREATE INDEX IF NOT EXISTS idx_products_featured ON products(is_featured);

ALTER TABLE products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Produtos ativos são públicos" ON products;
CREATE POLICY "Produtos ativos são públicos" ON products
  FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "Admins podem ver todos produtos" ON products;
CREATE POLICY "Admins podem ver todos produtos" ON products
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role IN ('superadmin', 'editor')
    )
  );

DROP POLICY IF EXISTS "Admins podem gerenciar produtos" ON products;
CREATE POLICY "Admins podem gerenciar produtos" ON products
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role IN ('superadmin', 'editor')
    )
  );

-- 4. TABELA DE PEDIDOS
-- ============================================
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT UNIQUE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  subtotal DECIMAL(10,2) NOT NULL,
  discount DECIMAL(10,2) DEFAULT 0,
  total DECIMAL(10,2) NOT NULL,
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
  payment_method TEXT,
  stripe_payment_id TEXT,
  coupon_code TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_email ON orders(email);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_orders_number ON orders(order_number);

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Usuários veem seus pedidos" ON orders;
CREATE POLICY "Usuários veem seus pedidos" ON orders
  FOR SELECT USING (auth.uid() = user_id OR email = auth.jwt()->>'email');

DROP POLICY IF EXISTS "Admins veem todos pedidos" ON orders;
CREATE POLICY "Admins veem todos pedidos" ON orders
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role IN ('superadmin', 'editor', 'support')
    )
  );

DROP POLICY IF EXISTS "Sistema pode criar pedidos" ON orders;
CREATE POLICY "Sistema pode criar pedidos" ON orders
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Admins podem atualizar pedidos" ON orders;
CREATE POLICY "Admins podem atualizar pedidos" ON orders
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role IN ('superadmin', 'editor', 'support')
    )
  );

-- 5. TABELA DE ITENS DO PEDIDO
-- ============================================
CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  title TEXT NOT NULL,
  author TEXT NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  quantity INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product ON order_items(product_id);

ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Usuários veem itens de seus pedidos" ON order_items;
CREATE POLICY "Usuários veem itens de seus pedidos" ON order_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id
      AND (orders.user_id = auth.uid() OR orders.email = auth.jwt()->>'email')
    )
  );

DROP POLICY IF EXISTS "Admins veem todos itens" ON order_items;
CREATE POLICY "Admins veem todos itens" ON order_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role IN ('superadmin', 'editor', 'support')
    )
  );

DROP POLICY IF EXISTS "Sistema pode criar itens" ON order_items;
CREATE POLICY "Sistema pode criar itens" ON order_items
  FOR INSERT WITH CHECK (true);

-- 6. TABELA DE CUPONS
-- ============================================
CREATE TABLE IF NOT EXISTS coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value DECIMAL(10,2) NOT NULL,
  min_purchase DECIMAL(10,2) DEFAULT 0,
  max_uses INTEGER,
  used_count INTEGER DEFAULT 0,
  valid_from TIMESTAMPTZ DEFAULT NOW(),
  valid_until TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_coupons_code ON coupons(code);
CREATE INDEX IF NOT EXISTS idx_coupons_active ON coupons(is_active);

ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Cupons ativos são públicos" ON coupons;
CREATE POLICY "Cupons ativos são públicos" ON coupons
  FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "Admins gerenciam cupons" ON coupons;
CREATE POLICY "Admins gerenciam cupons" ON coupons
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role IN ('superadmin', 'editor')
    )
  );

-- 7. TABELA DE AVALIAÇÕES
-- ============================================
CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title TEXT,
  comment TEXT,
  is_verified_purchase BOOLEAN DEFAULT FALSE,
  is_approved BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reviews_product ON reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user ON reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_approved ON reviews(is_approved);

ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Avaliações aprovadas são públicas" ON reviews;
CREATE POLICY "Avaliações aprovadas são públicas" ON reviews
  FOR SELECT USING (is_approved = true);

DROP POLICY IF EXISTS "Usuários veem suas avaliações" ON reviews;
CREATE POLICY "Usuários veem suas avaliações" ON reviews
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuários criam avaliações" ON reviews;
CREATE POLICY "Usuários criam avaliações" ON reviews
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins gerenciam avaliações" ON reviews;
CREATE POLICY "Admins gerenciam avaliações" ON reviews
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role IN ('superadmin', 'editor', 'support')
    )
  );

-- 8. TABELA DE LINKS DE DOWNLOAD
-- ============================================
CREATE TABLE IF NOT EXISTS download_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token TEXT UNIQUE NOT NULL,
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  email TEXT NOT NULL,
  downloads_count INTEGER DEFAULT 0,
  max_downloads INTEGER DEFAULT 3,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_download_links_token ON download_links(token);
CREATE INDEX IF NOT EXISTS idx_download_links_order ON download_links(order_id);
CREATE INDEX IF NOT EXISTS idx_download_links_user ON download_links(user_id);

ALTER TABLE download_links ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Usuários acessam seus downloads" ON download_links;
CREATE POLICY "Usuários acessam seus downloads" ON download_links
  FOR SELECT USING (
    auth.uid() = user_id OR email = auth.jwt()->>'email'
  );

DROP POLICY IF EXISTS "Sistema cria links" ON download_links;
CREATE POLICY "Sistema cria links" ON download_links
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Sistema atualiza contadores" ON download_links;
CREATE POLICY "Sistema atualiza contadores" ON download_links
  FOR UPDATE USING (true);

-- 9. TABELA DE TAGS DE PRODUTOS
-- ============================================
CREATE TABLE IF NOT EXISTS product_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  tag TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_product_tags_product ON product_tags(product_id);
CREATE INDEX IF NOT EXISTS idx_product_tags_tag ON product_tags(tag);

ALTER TABLE product_tags ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Tags são públicas" ON product_tags;
CREATE POLICY "Tags são públicas" ON product_tags FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins gerenciam tags" ON product_tags;
CREATE POLICY "Admins gerenciam tags" ON product_tags
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role IN ('superadmin', 'editor')
    )
  );

-- 10. TABELA DE ARQUIVOS DE PRODUTOS
-- ============================================
CREATE TABLE IF NOT EXISTS product_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  file_type TEXT NOT NULL CHECK (file_type IN ('pdf', 'epub', 'mobi', 'sample')),
  file_path TEXT NOT NULL,
  file_size BIGINT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_product_files_product ON product_files(product_id);

ALTER TABLE product_files ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins gerenciam arquivos" ON product_files;
CREATE POLICY "Admins gerenciam arquivos" ON product_files
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role IN ('superadmin', 'editor')
    )
  );

-- 11. TABELA DE LOGS DE AUDITORIA
-- ============================================
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  old_data JSONB,
  new_data JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at);

ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins veem logs" ON audit_logs;
CREATE POLICY "Admins veem logs" ON audit_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role IN ('superadmin', 'support')
    )
  );

DROP POLICY IF EXISTS "Sistema cria logs" ON audit_logs;
CREATE POLICY "Sistema cria logs" ON audit_logs
  FOR INSERT WITH CHECK (true);

-- 12. TABELA DE PAGAMENTOS
-- ============================================
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  stripe_payment_intent_id TEXT UNIQUE,
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'eur',
  status TEXT NOT NULL CHECK (status IN ('pending', 'succeeded', 'failed', 'refunded')),
  payment_method TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payments_order ON payments(order_id);
CREATE INDEX IF NOT EXISTS idx_payments_stripe ON payments(stripe_payment_intent_id);

ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins veem pagamentos" ON payments;
CREATE POLICY "Admins veem pagamentos" ON payments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role IN ('superadmin', 'editor', 'support')
    )
  );

DROP POLICY IF EXISTS "Sistema gerencia pagamentos" ON payments;
CREATE POLICY "Sistema gerencia pagamentos" ON payments
  FOR ALL USING (true);

-- 13. VIEWS
-- ============================================

-- View de produtos completos
CREATE OR REPLACE VIEW products_full AS
SELECT 
  p.*,
  c.name as category_name,
  c.slug as category_slug,
  COALESCE(array_agg(DISTINCT pt.tag) FILTER (WHERE pt.tag IS NOT NULL), ARRAY[]::TEXT[]) as tags
FROM products p
LEFT JOIN categories c ON p.category_id = c.id
LEFT JOIN product_tags pt ON p.id = pt.product_id
GROUP BY p.id, c.name, c.slug;

-- View de pedidos completos
CREATE OR REPLACE VIEW orders_full AS
SELECT 
  o.*,
  up.full_name as user_full_name,
  COUNT(oi.id) as items_count,
  json_agg(
    json_build_object(
      'id', oi.id,
      'product_id', oi.product_id,
      'title', oi.title,
      'author', oi.author,
      'price', oi.price,
      'quantity', oi.quantity
    )
  ) as items
FROM orders o
LEFT JOIN user_profiles up ON o.user_id = up.id
LEFT JOIN order_items oi ON o.id = oi.order_id
GROUP BY o.id, up.full_name;

-- 14. FUNÇÕES
-- ============================================

-- Função para gerar número de pedido
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TEXT AS $$
DECLARE
  new_number TEXT;
  exists_check BOOLEAN;
BEGIN
  LOOP
    new_number := 'ORD-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
    SELECT EXISTS(SELECT 1 FROM orders WHERE order_number = new_number) INTO exists_check;
    EXIT WHEN NOT exists_check;
  END LOOP;
  RETURN new_number;
END;
$$ LANGUAGE plpgsql;

-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 15. TRIGGERS
-- ============================================

DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON user_profiles;
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_categories_updated_at ON categories;
CREATE TRIGGER update_categories_updated_at
  BEFORE UPDATE ON categories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_products_updated_at ON products;
CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_orders_updated_at ON orders;
CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_coupons_updated_at ON coupons;
CREATE TRIGGER update_coupons_updated_at
  BEFORE UPDATE ON coupons
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_reviews_updated_at ON reviews;
CREATE TRIGGER update_reviews_updated_at
  BEFORE UPDATE ON reviews
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_payments_updated_at ON payments;
CREATE TRIGGER update_payments_updated_at
  BEFORE UPDATE ON payments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 16. DADOS INICIAIS - CATEGORIAS
-- ============================================

INSERT INTO categories (name, slug, description, display_order) VALUES
('Romance', 'romance', 'Histórias de amor e relacionamentos', 1),
('Ficção Científica', 'ficcao-cientifica', 'Aventuras futuristas e tecnológicas', 2),
('Fantasia', 'fantasia', 'Mundos mágicos e criaturas fantásticas', 3),
('Mistério', 'misterio', 'Suspense e investigações', 4),
('Thriller', 'thriller', 'Histórias de suspense e ação', 5),
('Terror', 'terror', 'Histórias assustadoras', 6),
('Biografia', 'biografia', 'Histórias de vida reais', 7),
('Autoajuda', 'autoajuda', 'Desenvolvimento pessoal', 8),
('Negócios', 'negocios', 'Empreendedorismo e gestão', 9),
('História', 'historia', 'Eventos históricos', 10),
('Filosofia', 'filosofia', 'Pensamento e reflexão', 11),
('Psicologia', 'psicologia', 'Mente e comportamento', 12),
('Ciência', 'ciencia', 'Descobertas científicas', 13),
('Tecnologia', 'tecnologia', 'Inovação e programação', 14),
('Culinária', 'culinaria', 'Receitas e gastronomia', 15),
('Viagem', 'viagem', 'Destinos e aventuras', 16),
('Arte', 'arte', 'Pintura, escultura e design', 17),
('Música', 'musica', 'Teoria e história musical', 18),
('Esportes', 'esportes', 'Atividades físicas', 19),
('Saúde', 'saude', 'Bem-estar e medicina', 20)
ON CONFLICT (slug) DO NOTHING;

-- 17. DADOS INICIAIS - PRODUTOS
-- ============================================

-- Romance
INSERT INTO products (title, slug, author, description, price, original_price, isbn, publisher, publication_year, pages, category_id, cover_url, is_active, is_featured) 
SELECT 
  'O Amor em Tempos Modernos',
  'o-amor-em-tempos-modernos',
  'Sofia Martins',
  'Uma história emocionante sobre encontrar o amor verdadeiro na era digital.',
  12.99,
  19.99,
  '978-1234567890',
  'Editora Romance',
  2023,
  320,
  id,
  'https://readdy.ai/api/search-image?query=romantic%20book%20cover%20with%20modern%20city%20skyline%20at%20sunset%20couple%20silhouette%20warm%20pink%20and%20purple%20gradient%20elegant%20typography%20professional%20book%20design%20simple%20background&width=400&height=600&seq=rom1&orientation=portrait',
  true,
  true
FROM categories WHERE slug = 'romance'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO products (title, slug, author, description, price, isbn, publisher, publication_year, pages, category_id, cover_url, is_active) 
SELECT 
  'Corações Entrelaçados',
  'coracoes-entrelacados',
  'Ana Costa',
  'Dois destinos que se cruzam em uma jornada inesquecível.',
  14.99,
  '978-1234567891',
  'Editora Romance',
  2023,
  280,
  id,
  'https://readdy.ai/api/search-image?query=romantic%20book%20cover%20with%20intertwined%20hearts%20design%20soft%20pastel%20colors%20dreamy%20atmosphere%20elegant%20floral%20elements%20professional%20typography%20simple%20clean%20background&width=400&height=600&seq=rom2&orientation=portrait',
  true
FROM categories WHERE slug = 'romance'
ON CONFLICT (slug) DO NOTHING;

-- Ficção Científica
INSERT INTO products (title, slug, author, description, price, original_price, isbn, publisher, publication_year, pages, category_id, cover_url, is_active, is_featured) 
SELECT 
  'Viagem às Estrelas',
  'viagem-as-estrelas',
  'Carlos Silva',
  'Uma aventura épica através da galáxia em busca de novos mundos.',
  16.99,
  24.99,
  '978-1234567892',
  'Editora Sci-Fi',
  2023,
  450,
  id,
  'https://readdy.ai/api/search-image?query=science%20fiction%20book%20cover%20with%20spaceship%20traveling%20through%20colorful%20nebula%20stars%20and%20planets%20futuristic%20design%20blue%20and%20purple%20cosmic%20colors%20professional%20scifi%20typography%20simple%20space%20background&width=400&height=600&seq=scifi1&orientation=portrait',
  true,
  true
FROM categories WHERE slug = 'ficcao-cientifica'
ON CONFLICT (slug) DO NOTHING;

-- Fantasia
INSERT INTO products (title, slug, author, description, price, original_price, isbn, publisher, publication_year, pages, category_id, cover_url, is_active, is_featured) 
SELECT 
  'O Reino dos Dragões',
  'o-reino-dos-dragoes',
  'Maria Oliveira',
  'Uma jornada mágica por terras encantadas e criaturas místicas.',
  18.99,
  26.99,
  '978-1234567894',
  'Editora Fantasia',
  2023,
  520,
  id,
  'https://readdy.ai/api/search-image?query=fantasy%20book%20cover%20with%20majestic%20dragon%20flying%20over%20medieval%20castle%20magical%20atmosphere%20golden%20and%20emerald%20colors%20mystical%20clouds%20epic%20fantasy%20design%20simple%20background&width=400&height=600&seq=fant1&orientation=portrait',
  true,
  true
FROM categories WHERE slug = 'fantasia'
ON CONFLICT (slug) DO NOTHING;

-- Autoajuda
INSERT INTO products (title, slug, author, description, price, isbn, publisher, publication_year, pages, category_id, cover_url, is_active, is_featured) 
SELECT 
  'O Poder do Agora',
  'o-poder-do-agora',
  'Eckhart Tolle',
  'Um guia para a iluminação espiritual e vida no presente.',
  19.99,
  '978-1234567900',
  'Editora Autoajuda',
  2023,
  240,
  id,
  'https://readdy.ai/api/search-image?query=selfhelp%20book%20cover%20with%20peaceful%20zen%20garden%20sunrise%20meditation%20scene%20calming%20colors%20mindfulness%20concept%20serene%20atmosphere%20inspirational%20design%20simple%20clean%20background&width=400&height=600&seq=auto1&orientation=portrait',
  true,
  true
FROM categories WHERE slug = 'autoajuda'
ON CONFLICT (slug) DO NOTHING;

-- Negócios
INSERT INTO products (title, slug, author, description, price, isbn, publisher, publication_year, pages, category_id, cover_url, is_active, is_featured) 
SELECT 
  'De Zero a Um',
  'de-zero-a-um',
  'Peter Thiel',
  'Notas sobre startups e como construir o futuro.',
  24.99,
  '978-1234567902',
  'Editora Negócios',
  2023,
  280,
  id,
  'https://readdy.ai/api/search-image?query=business%20book%20cover%20with%20upward%20arrow%20from%20zero%20to%20one%20startup%20concept%20professional%20corporate%20design%20navy%20blue%20and%20gold%20colors%20success%20theme%20simple%20background&width=400&height=600&seq=neg1&orientation=portrait',
  true,
  true
FROM categories WHERE slug = 'negocios'
ON CONFLICT (slug) DO NOTHING;

-- Psicologia
INSERT INTO products (title, slug, author, description, price, isbn, publisher, publication_year, pages, category_id, cover_url, is_active, is_featured) 
SELECT 
  'Rápido e Devagar',
  'rapido-e-devagar',
  'Daniel Kahneman',
  'Duas formas de pensar que moldam nossas decisões.',
  23.99,
  '978-1234567905',
  'Editora Psicologia',
  2023,
  610,
  id,
  'https://readdy.ai/api/search-image?query=psychology%20book%20cover%20with%20brain%20divided%20in%20two%20halves%20fast%20and%20slow%20thinking%20concept%20modern%20scientific%20design%20blue%20and%20orange%20contrast%20simple%20clean%20background&width=400&height=600&seq=psic1&orientation=portrait',
  true,
  true
FROM categories WHERE slug = 'psicologia'
ON CONFLICT (slug) DO NOTHING;

-- Ciência
INSERT INTO products (title, slug, author, description, price, isbn, publisher, publication_year, pages, category_id, cover_url, is_active) 
SELECT 
  'Uma Breve História do Tempo',
  'uma-breve-historia-do-tempo',
  'Stephen Hawking',
  'Do Big Bang aos buracos negros.',
  20.99,
  '978-1234567906',
  'Editora Ciência',
  2023,
  256,
  id,
  'https://readdy.ai/api/search-image?query=science%20book%20cover%20with%20cosmic%20space%20black%20hole%20galaxies%20stars%20universe%20concept%20deep%20blue%20and%20purple%20colors%20scientific%20illustration%20simple%20space%20background&width=400&height=600&seq=cien1&orientation=portrait',
  true
FROM categories WHERE slug = 'ciencia'
ON CONFLICT (slug) DO NOTHING;

-- Tecnologia
INSERT INTO products (title, slug, author, description, price, original_price, isbn, publisher, publication_year, pages, category_id, cover_url, is_active) 
SELECT 
  'Clean Code',
  'clean-code',
  'Robert C. Martin',
  'Manual de boas práticas para desenvolvimento de software.',
  28.99,
  35.99,
  '978-1234567907',
  'Editora Tecnologia',
  2023,
  464,
  id,
  'https://readdy.ai/api/search-image?query=technology%20book%20cover%20with%20clean%20code%20syntax%20programming%20concept%20modern%20tech%20design%20green%20matrix%20style%20developer%20theme%20simple%20background&width=400&height=600&seq=tech1&orientation=portrait',
  true
FROM categories WHERE slug = 'tecnologia'
ON CONFLICT (slug) DO NOTHING;

-- Saúde
INSERT INTO products (title, slug, author, description, price, original_price, isbn, publisher, publication_year, pages, category_id, cover_url, is_active, is_featured) 
SELECT 
  'Saúde e Bem-Estar',
  'saude-bem-estar',
  'Dr. Pedro Almeida',
  'Guia completo para uma vida saudável.',
  19.99,
  24.99,
  '978-1234567913',
  'Editora Saúde',
  2023,
  340,
  id,
  'https://readdy.ai/api/search-image?query=health%20wellness%20book%20cover%20with%20yoga%20meditation%20healthy%20food%20fitness%20concept%20fresh%20green%20colors%20holistic%20lifestyle%20peaceful%20atmosphere%20simple%20clean%20background&width=400&height=600&seq=saud1&orientation=portrait',
  true,
  true
FROM categories WHERE slug = 'saude'
ON CONFLICT (slug) DO NOTHING;

-- 18. DADOS INICIAIS - CUPONS
-- ============================================

INSERT INTO coupons (code, discount_type, discount_value, min_purchase, max_uses, valid_until, is_active) VALUES
('BEMVINDO10', 'percentage', 10.00, 0, 100, NOW() + INTERVAL '30 days', true),
('PRIMEIRACOMPRA', 'percentage', 15.00, 20.00, 50, NOW() + INTERVAL '60 days', true),
('VERAO2024', 'percentage', 20.00, 30.00, 200, NOW() + INTERVAL '90 days', true),
('DESCONTO5', 'fixed', 5.00, 15.00, NULL, NOW() + INTERVAL '30 days', true)
ON CONFLICT (code) DO NOTHING;

-- ============================================
-- FIM DO SCRIPT
-- ============================================

-- IMPORTANTE: Após executar este script, você precisa:
-- 1. Criar sua conta admin no Supabase Authentication
-- 2. Copiar o UUID do usuário criado
-- 3. Executar o comando abaixo substituindo SEU_USER_ID pelo UUID:

-- INSERT INTO user_profiles (id, full_name, role, force_password_change) 
-- VALUES ('SEU_USER_ID', 'Carminha', 'superadmin', false);
