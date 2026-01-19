-- ============================================
-- LIVRARIA DIGITAL - CONFIGURAÇÃO COMPLETA DO BANCO DE DADOS
-- ============================================
-- Este script cria todas as tabelas, políticas RLS, índices e dados iniciais
-- Execute este script no Supabase SQL Editor
-- ============================================

-- Limpar políticas existentes para evitar duplicação
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "Admins têm acesso total" ON ' || quote_ident(r.tablename);
        EXECUTE 'DROP POLICY IF EXISTS "Usuários podem ver seus próprios dados" ON ' || quote_ident(r.tablename);
        EXECUTE 'DROP POLICY IF EXISTS "Produtos são visíveis publicamente" ON ' || quote_ident(r.tablename);
        EXECUTE 'DROP POLICY IF EXISTS "Categorias são visíveis publicamente" ON ' || quote_ident(r.tablename);
        EXECUTE 'DROP POLICY IF EXISTS "Usuários podem ver seus próprios pedidos" ON ' || quote_ident(r.tablename);
        EXECUTE 'DROP POLICY IF EXISTS "Usuários podem criar pedidos" ON ' || quote_ident(r.tablename);
        EXECUTE 'DROP POLICY IF EXISTS "Usuários podem ver seus próprios links" ON ' || quote_ident(r.tablename);
        EXECUTE 'DROP POLICY IF EXISTS "Reviews são visíveis publicamente" ON ' || quote_ident(r.tablename);
        EXECUTE 'DROP POLICY IF EXISTS "Usuários podem criar reviews" ON ' || quote_ident(r.tablename);
        EXECUTE 'DROP POLICY IF EXISTS "Cupons são visíveis publicamente" ON ' || quote_ident(r.tablename);
    END LOOP;
END $$;

-- ============================================
-- 1. TABELA: user_profiles
-- ============================================
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT,
    phone TEXT,
    address TEXT,
    city TEXT,
    postal_code TEXT,
    country TEXT DEFAULT 'Portugal',
    role TEXT DEFAULT 'customer' CHECK (role IN ('customer', 'editor', 'support', 'superadmin')),
    force_password_change BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 2. TABELA: categories
-- ============================================
CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    image_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 3. TABELA: products
-- ============================================
CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    cover_url TEXT,
    file_url TEXT,
    is_featured BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    download_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 4. TABELA: orders
-- ============================================
CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    total_amount DECIMAL(10,2) NOT NULL,
    payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
    order_status TEXT DEFAULT 'processing' CHECK (order_status IN ('processing', 'completed', 'cancelled')),
    stripe_payment_id TEXT,
    customer_email TEXT NOT NULL,
    customer_name TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 5. TABELA: order_items
-- ============================================
CREATE TABLE IF NOT EXISTS order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE SET NULL,
    product_title TEXT NOT NULL,
    product_price DECIMAL(10,2) NOT NULL,
    quantity INTEGER DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 6. TABELA: download_links
-- ============================================
CREATE TABLE IF NOT EXISTS download_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    token TEXT UNIQUE NOT NULL,
    download_count INTEGER DEFAULT 0,
    max_downloads INTEGER DEFAULT 5,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 7. TABELA: reviews
-- ============================================
CREATE TABLE IF NOT EXISTS reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    is_approved BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 8. TABELA: coupons
-- ============================================
CREATE TABLE IF NOT EXISTS coupons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT UNIQUE NOT NULL,
    discount_type TEXT CHECK (discount_type IN ('percentage', 'fixed')),
    discount_value DECIMAL(10,2) NOT NULL,
    min_purchase_amount DECIMAL(10,2) DEFAULT 0,
    max_uses INTEGER,
    current_uses INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- ATIVAR ROW LEVEL SECURITY (RLS)
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
-- POLÍTICAS RLS: user_profiles
-- ============================================
CREATE POLICY "Usuários podem ver seus próprios dados"
    ON user_profiles FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Usuários podem atualizar seus próprios dados"
    ON user_profiles FOR UPDATE
    USING (auth.uid() = id);

CREATE POLICY "Admins têm acesso total a perfis"
    ON user_profiles FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE id = auth.uid()
            AND role IN ('superadmin', 'editor', 'support')
        )
    );

-- ============================================
-- POLÍTICAS RLS: categories
-- ============================================
CREATE POLICY "Categorias são visíveis publicamente"
    ON categories FOR SELECT
    TO public
    USING (true);

CREATE POLICY "Admins podem gerenciar categorias"
    ON categories FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE id = auth.uid()
            AND role IN ('superadmin', 'editor')
        )
    );

-- ============================================
-- POLÍTICAS RLS: products
-- ============================================
CREATE POLICY "Produtos são visíveis publicamente"
    ON products FOR SELECT
    TO public
    USING (is_active = true);

CREATE POLICY "Admins podem gerenciar produtos"
    ON products FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE id = auth.uid()
            AND role IN ('superadmin', 'editor')
        )
    );

-- ============================================
-- POLÍTICAS RLS: orders
-- ============================================
CREATE POLICY "Usuários podem ver seus próprios pedidos"
    ON orders FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem criar pedidos"
    ON orders FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins podem ver todos os pedidos"
    ON orders FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE id = auth.uid()
            AND role IN ('superadmin', 'editor', 'support')
        )
    );

CREATE POLICY "Admins podem atualizar pedidos"
    ON orders FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE id = auth.uid()
            AND role IN ('superadmin', 'editor', 'support')
        )
    );

-- ============================================
-- POLÍTICAS RLS: order_items
-- ============================================
CREATE POLICY "Usuários podem ver itens de seus pedidos"
    ON order_items FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM orders
            WHERE orders.id = order_items.order_id
            AND orders.user_id = auth.uid()
        )
    );

CREATE POLICY "Admins podem ver todos os itens"
    ON order_items FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE id = auth.uid()
            AND role IN ('superadmin', 'editor', 'support')
        )
    );

-- ============================================
-- POLÍTICAS RLS: download_links
-- ============================================
CREATE POLICY "Usuários podem ver seus próprios links"
    ON download_links FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Sistema pode criar links"
    ON download_links FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Admins podem gerenciar links"
    ON download_links FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE id = auth.uid()
            AND role IN ('superadmin', 'editor', 'support')
        )
    );

-- ============================================
-- POLÍTICAS RLS: reviews
-- ============================================
CREATE POLICY "Reviews aprovadas são visíveis publicamente"
    ON reviews FOR SELECT
    TO public
    USING (is_approved = true);

CREATE POLICY "Usuários podem criar reviews"
    ON reviews FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem editar suas próprias reviews"
    ON reviews FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Admins podem gerenciar reviews"
    ON reviews FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE id = auth.uid()
            AND role IN ('superadmin', 'editor', 'support')
        )
    );

-- ============================================
-- POLÍTICAS RLS: coupons
-- ============================================
CREATE POLICY "Cupons ativos são visíveis publicamente"
    ON coupons FOR SELECT
    TO public
    USING (is_active = true AND (expires_at IS NULL OR expires_at > NOW()));

CREATE POLICY "Admins podem gerenciar cupons"
    ON coupons FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE id = auth.uid()
            AND role IN ('superadmin', 'editor')
        )
    );

-- ============================================
-- ÍNDICES PARA PERFORMANCE
-- ============================================
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_featured ON products(is_featured) WHERE is_featured = true;
CREATE INDEX IF NOT EXISTS idx_products_active ON products(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(payment_status, order_status);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product ON order_items(product_id);
CREATE INDEX IF NOT EXISTS idx_download_links_user ON download_links(user_id);
CREATE INDEX IF NOT EXISTS idx_download_links_token ON download_links(token);
CREATE INDEX IF NOT EXISTS idx_reviews_product ON reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_reviews_approved ON reviews(is_approved) WHERE is_approved = true;

-- ============================================
-- TRIGGERS PARA ATUALIZAR updated_at
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reviews_updated_at BEFORE UPDATE ON reviews
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- DADOS INICIAIS: CATEGORIAS
-- ============================================
INSERT INTO categories (name, slug, description) VALUES
('Romance', 'romance', 'Histórias de amor e relacionamentos'),
('Ficção Científica', 'ficcao-cientifica', 'Aventuras futuristas e tecnológicas'),
('Fantasia', 'fantasia', 'Mundos mágicos e criaturas fantásticas'),
('Autoajuda', 'autoajuda', 'Desenvolvimento pessoal e motivação'),
('Negócios', 'negocios', 'Empreendedorismo e gestão'),
('Tecnologia', 'tecnologia', 'Programação e inovação'),
('Saúde', 'saude', 'Bem-estar e qualidade de vida'),
('História', 'historia', 'Eventos e personagens históricos'),
('Biografia', 'biografia', 'Histórias de vida inspiradoras'),
('Culinária', 'culinaria', 'Receitas e gastronomia')
ON CONFLICT (slug) DO NOTHING;

-- ============================================
-- DADOS INICIAIS: PRODUTOS
-- ============================================
INSERT INTO products (title, slug, description, price, category_id, cover_url, file_url, is_featured, is_active) VALUES
(
    'O Amor em Tempos Modernos',
    'o-amor-em-tempos-modernos',
    'Uma história emocionante sobre amor, tecnologia e conexões humanas no século XXI. Acompanhe a jornada de dois corações que se encontram através das telas.',
    12.99,
    (SELECT id FROM categories WHERE slug = 'romance' LIMIT 1),
    'https://readdy.ai/api/search-image?query=Modern%20romantic%20couple%20holding%20hands%20in%20a%20minimalist%20urban%20setting%20with%20soft%20pastel%20colors%20and%20warm%20lighting%2C%20simple%20clean%20background%2C%20professional%20book%20cover%20style&width=400&height=600&seq=romance1&orientation=portrait',
    'https://exemplo.com/livros/amor-tempos-modernos.pdf',
    true,
    true
),
(
    'Viagem às Estrelas',
    'viagem-as-estrelas',
    'Uma aventura épica pelo cosmos. Explore galáxias distantes, encontre civilizações alienígenas e descubra os mistérios do universo nesta saga de ficção científica.',
    16.99,
    (SELECT id FROM categories WHERE slug = 'ficcao-cientifica' LIMIT 1),
    'https://readdy.ai/api/search-image?query=Futuristic%20spaceship%20traveling%20through%20colorful%20nebula%20and%20stars%20in%20deep%20space%2C%20cosmic%20adventure%20scene%20with%20vibrant%20colors%2C%20simple%20clean%20background%2C%20professional%20book%20cover%20style&width=400&height=600&seq=scifi1&orientation=portrait',
    'https://exemplo.com/livros/viagem-estrelas.pdf',
    true,
    true
),
(
    'O Reino dos Dragões',
    'o-reino-dos-dragoes',
    'Entre em um mundo mágico onde dragões governam os céus e heróis improváveis surgem para salvar o reino. Uma fantasia épica cheia de magia, aventura e coragem.',
    18.99,
    (SELECT id FROM categories WHERE slug = 'fantasia' LIMIT 1),
    'https://readdy.ai/api/search-image?query=Majestic%20dragon%20flying%20over%20medieval%20fantasy%20castle%20with%20mountains%20and%20magical%20glowing%20sky%2C%20epic%20fantasy%20scene%20with%20rich%20colors%2C%20simple%20clean%20background%2C%20professional%20book%20cover%20style&width=400&height=600&seq=fantasy1&orientation=portrait',
    'https://exemplo.com/livros/reino-dragoes.pdf',
    true,
    true
),
(
    'O Poder do Agora',
    'o-poder-do-agora',
    'Descubra como viver plenamente no presente e transformar sua vida. Um guia prático para alcançar paz interior, felicidade e realização pessoal.',
    19.99,
    (SELECT id FROM categories WHERE slug = 'autoajuda' LIMIT 1),
    'https://readdy.ai/api/search-image?query=Peaceful%20meditation%20scene%20with%20person%20in%20lotus%20position%20surrounded%20by%20soft%20golden%20light%20and%20nature%20elements%2C%20zen%20minimalist%20style%2C%20simple%20clean%20background%2C%20professional%20book%20cover%20style&width=400&height=600&seq=selfhelp1&orientation=portrait',
    'https://exemplo.com/livros/poder-agora.pdf',
    true,
    true
),
(
    'De Zero a Um',
    'de-zero-a-um',
    'Como construir o futuro através da inovação. Aprenda os segredos dos empreendedores de sucesso e descubra como criar algo verdadeiramente único.',
    24.99,
    (SELECT id FROM categories WHERE slug = 'negocios' LIMIT 1),
    'https://readdy.ai/api/search-image?query=Modern%20business%20startup%20concept%20with%20ascending%20arrow%20graph%20and%20innovative%20technology%20symbols%2C%20professional%20corporate%20style%20with%20blue%20and%20gold%20tones%2C%20simple%20clean%20background%2C%20professional%20book%20cover%20style&width=400&height=600&seq=business1&orientation=portrait',
    'https://exemplo.com/livros/zero-um.pdf',
    true,
    true
),
(
    'Clean Code',
    'clean-code',
    'O guia definitivo para escrever código limpo, legível e manutenível. Aprenda as melhores práticas de programação com exemplos reais e conselhos de especialistas.',
    28.99,
    (SELECT id FROM categories WHERE slug = 'tecnologia' LIMIT 1),
    'https://readdy.ai/api/search-image?query=Computer%20code%20on%20screen%20with%20clean%20organized%20syntax%20highlighting%20in%20green%20and%20blue%20colors%2C%20modern%20tech%20aesthetic%2C%20simple%20clean%20background%2C%20professional%20book%20cover%20style&width=400&height=600&seq=tech1&orientation=portrait',
    'https://exemplo.com/livros/clean-code.pdf',
    false,
    true
),
(
    'Saúde e Bem-Estar',
    'saude-bem-estar',
    'Um guia completo para uma vida mais saudável. Descubra dicas de nutrição, exercícios e hábitos que transformarão sua qualidade de vida.',
    19.99,
    (SELECT id FROM categories WHERE slug = 'saude' LIMIT 1),
    'https://readdy.ai/api/search-image?query=Healthy%20lifestyle%20with%20fresh%20fruits%20vegetables%20and%20yoga%20mat%20in%20bright%20natural%20light%2C%20wellness%20and%20vitality%20concept%2C%20simple%20clean%20background%2C%20professional%20book%20cover%20style&width=400&height=600&seq=health1&orientation=portrait',
    'https://exemplo.com/livros/saude-bem-estar.pdf',
    false,
    true
),
(
    'História do Brasil',
    'historia-do-brasil',
    'Uma jornada fascinante pela história brasileira, desde o descobrimento até os dias atuais. Conheça os eventos e personagens que moldaram a nação.',
    22.99,
    (SELECT id FROM categories WHERE slug = 'historia' LIMIT 1),
    'https://readdy.ai/api/search-image?query=Brazilian%20historical%20landmarks%20and%20cultural%20symbols%20in%20artistic%20vintage%20style%20with%20green%20and%20yellow%20tones%2C%20educational%20history%20book%20aesthetic%2C%20simple%20clean%20background%2C%20professional%20book%20cover%20style&width=400&height=600&seq=history1&orientation=portrait',
    'https://exemplo.com/livros/historia-brasil.pdf',
    false,
    true
)
ON CONFLICT (slug) DO NOTHING;

-- ============================================
-- DADOS INICIAIS: CUPONS
-- ============================================
INSERT INTO coupons (code, discount_type, discount_value, min_purchase_amount, max_uses, is_active) VALUES
('BEMVINDO10', 'percentage', 10, 0, 100, true),
('VERAO2024', 'percentage', 20, 30, 200, true),
('DESCONTO5', 'fixed', 5, 15, NULL, true)
ON CONFLICT (code) DO NOTHING;

-- ============================================
-- CONCLUÍDO!
-- ============================================
-- Banco de dados configurado com sucesso!
-- Próximo passo: Criar seu usuário admin no Authentication
-- ============================================
