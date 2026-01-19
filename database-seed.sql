-- ============================================
-- SEED DATA PARA ECOMMERCE DE EBOOKS
-- ============================================

-- Limpar dados existentes (cuidado em produção!)
TRUNCATE TABLE download_links CASCADE;
TRUNCATE TABLE order_items CASCADE;
TRUNCATE TABLE orders CASCADE;
TRUNCATE TABLE reviews CASCADE;
TRUNCATE TABLE coupons CASCADE;
TRUNCATE TABLE products CASCADE;
TRUNCATE TABLE categories CASCADE;

-- ============================================
-- CATEGORIAS
-- ============================================

INSERT INTO categories (id, name, slug, description, is_active) VALUES
('cat-001', 'Romance', 'romance', 'Histórias de amor e relacionamentos', true),
('cat-002', 'Ficção Científica', 'ficcao-cientifica', 'Aventuras futuristas e tecnológicas', true),
('cat-003', 'Fantasia', 'fantasia', 'Mundos mágicos e criaturas fantásticas', true),
('cat-004', 'Autoajuda', 'autoajuda', 'Desenvolvimento pessoal e motivação', true),
('cat-005', 'Negócios', 'negocios', 'Empreendedorismo e gestão', true),
('cat-006', 'Tecnologia', 'tecnologia', 'Programação e inovação', true),
('cat-007', 'Saúde', 'saude', 'Bem-estar e qualidade de vida', true),
('cat-008', 'História', 'historia', 'Eventos e personagens históricos', true),
('cat-009', 'Biografia', 'biografia', 'Vidas inspiradoras', true),
('cat-010', 'Culinária', 'culinaria', 'Receitas e gastronomia', true);

-- ============================================
-- PRODUTOS (EBOOKS)
-- ============================================

INSERT INTO products (
  id, title, slug, author, isbn, sku, description, price, category_id,
  cover_url, page_count, language, publisher, published_date,
  file_size_mb, format, is_active, downloads_count, rating_avg, rating_count
) VALUES
(
  'prod-001',
  'O Amor em Tempos Modernos',
  'o-amor-em-tempos-modernos',
  'Ana Silva',
  '978-1234567890',
  'ROM-001',
  'Uma história emocionante sobre amor, tecnologia e conexões humanas no século XXI. Acompanhe a jornada de dois corações que se encontram através das telas, mas precisam aprender a amar no mundo real.',
  12.99,
  'cat-001',
  'https://readdy.ai/api/search-image?query=romantic%20couple%20holding%20hands%20walking%20in%20modern%20city%20at%20sunset%20with%20soft%20warm%20lighting%20and%20dreamy%20atmosphere%20beautiful%20cover%20art%20illustration&width=400&height=600&seq=rom001&orientation=portrait',
  320,
  'pt',
  'Editora Romance',
  '2024-01-15',
  2.5,
  'pdf',
  true,
  1250,
  4.7,
  89
),
(
  'prod-002',
  'Viagem às Estrelas',
  'viagem-as-estrelas',
  'Carlos Mendes',
  '978-1234567891',
  'SCI-001',
  'Uma épica aventura espacial que leva a humanidade aos confins do universo. Descubra civilizações alienígenas, tecnologias avançadas e os mistérios do cosmos nesta saga inesquecível.',
  16.99,
  'cat-002',
  'https://readdy.ai/api/search-image?query=futuristic%20spaceship%20traveling%20through%20colorful%20nebula%20and%20stars%20in%20deep%20space%20with%20glowing%20engines%20and%20sleek%20design%20science%20fiction%20book%20cover%20art&width=400&height=600&seq=sci001&orientation=portrait',
  450,
  'pt',
  'Editora Sci-Fi',
  '2024-02-20',
  3.2,
  'epub',
  true,
  2100,
  4.8,
  156
),
(
  'prod-003',
  'O Reino dos Dragões',
  'o-reino-dos-dragoes',
  'Maria Santos',
  '978-1234567892',
  'FAN-001',
  'Entre em um mundo mágico onde dragões governam os céus e heróis improváveis precisam salvar o reino. Uma fantasia épica repleta de magia, batalhas e amizades inesperadas.',
  18.99,
  'cat-003',
  'https://readdy.ai/api/search-image?query=majestic%20dragon%20flying%20over%20medieval%20fantasy%20castle%20with%20mountains%20and%20magical%20glowing%20sky%20epic%20fantasy%20book%20cover%20illustration&width=400&height=600&seq=fan001&orientation=portrait',
  520,
  'pt',
  'Editora Fantasia',
  '2024-03-10',
  4.1,
  'pdf',
  true,
  1800,
  4.9,
  203
),
(
  'prod-004',
  'O Poder do Agora',
  'o-poder-do-agora',
  'João Costa',
  '978-1234567893',
  'AUT-001',
  'Descubra como viver plenamente no presente e transformar sua vida. Um guia prático para alcançar paz interior, superar ansiedade e encontrar felicidade genuína através da consciência plena.',
  19.99,
  'cat-004',
  'https://readdy.ai/api/search-image?query=peaceful%20meditation%20scene%20with%20person%20sitting%20in%20lotus%20position%20surrounded%20by%20soft%20golden%20light%20and%20nature%20elements%20minimalist%20self%20help%20book%20cover&width=400&height=600&seq=aut001&orientation=portrait',
  280,
  'pt',
  'Editora Vida',
  '2024-01-05',
  1.8,
  'epub',
  true,
  3500,
  4.6,
  412
),
(
  'prod-005',
  'De Zero a Um',
  'de-zero-a-um',
  'Pedro Oliveira',
  '978-1234567894',
  'NEG-001',
  'O guia definitivo para criar startups inovadoras e construir o futuro. Aprenda com os maiores empreendedores do Vale do Silício e descubra como transformar ideias em negócios bilionários.',
  24.99,
  'cat-005',
  'https://readdy.ai/api/search-image?query=modern%20business%20startup%20concept%20with%20rocket%20launching%20upward%20against%20clean%20white%20background%20with%20geometric%20shapes%20professional%20book%20cover%20design&width=400&height=600&seq=neg001&orientation=portrait',
  350,
  'pt',
  'Editora Negócios',
  '2024-02-01',
  2.3,
  'pdf',
  true,
  2800,
  4.8,
  267
),
(
  'prod-006',
  'Clean Code',
  'clean-code',
  'Roberto Tech',
  '978-1234567895',
  'TEC-001',
  'Aprenda a escrever código limpo, elegante e manutenível. Um guia essencial para desenvolvedores que querem se tornar verdadeiros artesãos do software e criar sistemas robustos e escaláveis.',
  28.99,
  'cat-006',
  'https://readdy.ai/api/search-image?query=clean%20minimalist%20code%20editor%20screen%20with%20colorful%20syntax%20highlighting%20on%20dark%20background%20modern%20tech%20book%20cover%20design&width=400&height=600&seq=tec001&orientation=portrait',
  420,
  'pt',
  'Editora Tech',
  '2024-03-15',
  3.5,
  'pdf',
  true,
  1600,
  4.9,
  198
),
(
  'prod-007',
  'Saúde e Bem-Estar',
  'saude-e-bem-estar',
  'Dra. Fernanda Lima',
  '978-1234567896',
  'SAU-001',
  'Um guia completo para uma vida saudável e equilibrada. Descubra os segredos da nutrição, exercícios físicos, sono de qualidade e saúde mental para viver melhor e mais feliz.',
  19.99,
  'cat-007',
  'https://readdy.ai/api/search-image?query=healthy%20lifestyle%20with%20fresh%20fruits%20vegetables%20yoga%20mat%20and%20wellness%20items%20on%20clean%20white%20surface%20bright%20natural%20lighting%20health%20book%20cover&width=400&height=600&seq=sau001&orientation=portrait',
  300,
  'pt',
  'Editora Saúde',
  '2024-01-20',
  2.1,
  'epub',
  true,
  2200,
  4.7,
  178
),
(
  'prod-008',
  'História do Brasil',
  'historia-do-brasil',
  'Prof. Ricardo Alves',
  '978-1234567897',
  'HIS-001',
  'Uma jornada fascinante pela história do Brasil, desde o descobrimento até os dias atuais. Conheça os eventos, personagens e transformações que moldaram nossa nação.',
  22.99,
  'cat-008',
  'https://readdy.ai/api/search-image?query=brazilian%20historical%20monuments%20and%20landmarks%20collage%20with%20vintage%20sepia%20tones%20and%20classic%20book%20cover%20design%20elegant%20typography&width=400&height=600&seq=his001&orientation=portrait',
  480,
  'pt',
  'Editora História',
  '2024-02-10',
  3.8,
  'pdf',
  true,
  950,
  4.6,
  87
);

-- ============================================
-- CUPONS DE DESCONTO
-- ============================================

INSERT INTO coupons (
  id, code, discount_type, discount_value, max_discount, min_purchase,
  valid_from, valid_until, usage_limit, used_count, is_active
) VALUES
(
  'coup-001',
  'BEMVINDO10',
  'percentage',
  10,
  NULL,
  NULL,
  NOW(),
  NOW() + INTERVAL '90 days',
  100,
  0,
  true
),
(
  'coup-002',
  'VERAO2024',
  'percentage',
  20,
  50,
  30,
  NOW(),
  NOW() + INTERVAL '60 days',
  200,
  0,
  true
),
(
  'coup-003',
  'DESCONTO5',
  'fixed',
  5,
  NULL,
  15,
  NOW(),
  NOW() + INTERVAL '120 days',
  NULL,
  0,
  true
);

-- ============================================
-- MENSAGEM DE SUCESSO
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '✅ Seed data inserido com sucesso!';
  RAISE NOTICE '📚 8 produtos cadastrados';
  RAISE NOTICE '🏷️ 10 categorias criadas';
  RAISE NOTICE '🎁 3 cupons ativos';
  RAISE NOTICE '';
  RAISE NOTICE '🔐 PRÓXIMO PASSO: Criar usuário admin';
  RAISE NOTICE '1. Vá em Authentication → Users';
  RAISE NOTICE '2. Crie usuário: c-arminha1973@hotmail.com';
  RAISE NOTICE '3. Copie o UUID do usuário';
  RAISE NOTICE '4. Execute:';
  RAISE NOTICE 'INSERT INTO user_profiles (id, full_name, role, force_password_change)';
  RAISE NOTICE 'VALUES (''SEU_UUID'', ''Carminha'', ''superadmin'', false);';
END $$;
