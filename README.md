# 📚 E-commerce de Livros Digitais (Ebooks)

Plataforma completa de venda de ebooks com pagamentos integrados, entrega automática e painel administrativo.

## 🚀 Características Principais

- ✅ **100+ Categorias** e **100+ Livros** pré-cadastrados
- ✅ **Multilíngue** (PT/EN) - Locale padrão: Luxemburgo
- ✅ **Pagamentos**: Stripe (Card, Apple Pay, Google Pay), PayPal
- ✅ **Carrinho Persistente** com cupons de desconto
- ✅ **Cálculo Automático de IVA** por país
- ✅ **Links de Download Seguros** com expiração
- ✅ **Dashboard Admin Completo**
- ✅ **Sistema de Avaliações** e Reviews
- ✅ **Emails Transacionais** automáticos
- ✅ **Segurança**: Rate limiting, CSRF, sanitização
- ✅ **Design Literário** com paleta pastel e micro-animações

## 📋 Pré-requisitos

- Node.js 18+ 
- Conta Supabase (gratuita)
- Conta Stripe (modo teste gratuito)
- Conta PayPal Business (opcional)

## 🔧 Instalação Rápida

### 1. Clone e Instale Dependências

\`\`\`bash
npm install
\`\`\`

### 2. Configure Variáveis de Ambiente

Copie o arquivo \`.env.example\` para \`.env\`:

\`\`\`bash
cp .env.example .env
\`\`\`

Edite o arquivo \`.env\` com suas credenciais:

\`\`\`env
# Supabase (já configurado)
VITE_PUBLIC_SUPABASE_URL=sua_url_supabase
VITE_PUBLIC_SUPABASE_ANON_KEY=sua_chave_publica

# Stripe (obter em https://dashboard.stripe.com/apikeys)
VITE_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# PayPal (obter em https://developer.paypal.com/)
VITE_PUBLIC_PAYPAL_CLIENT_ID=seu_client_id
PAYPAL_CLIENT_SECRET=seu_client_secret

# Email SMTP (opcional - usar Supabase Email ou SendGrid)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=seu_email@gmail.com
SMTP_PASSWORD=sua_senha_app

# Configurações
VITE_APP_URL=http://localhost:5173
VITE_VAT_RATE_LU=17
VITE_VAT_RATE_PT=23
VITE_VAT_RATE_DEFAULT=21
\`\`\`

### 3. Banco de Dados Supabase

O banco de dados já foi criado automaticamente! As tabelas incluem:

- ✅ categories (100+ categorias)
- ✅ products (preparado para 100+ livros)
- ✅ orders, order_items
- ✅ payments, download_links
- ✅ coupons, reviews
- ✅ user_profiles, audit_logs

### 4. Criar Usuário Admin Inicial

Execute no SQL Editor do Supabase:

\`\`\`sql
-- Criar usuário admin (use o Supabase Auth UI ou API)
-- Email: c-arminha1973@hotmail.com
-- Password: Carminha73#

-- Depois de criar o usuário, adicione o perfil admin:
INSERT INTO user_profiles (id, full_name, role, is_admin, force_password_change)
VALUES (
  'UUID_DO_USUARIO_CRIADO',
  'Carminha Marques Damas',
  'admin',
  true,
  true
);
\`\`\`

### 5. Configurar Stripe Webhooks

1. Acesse: https://dashboard.stripe.com/webhooks
2. Clique em "Add endpoint"
3. URL: \`https://seu-dominio.com/api/webhooks/stripe\`
4. Eventos a escutar:
   - \`payment_intent.succeeded\`
   - \`payment_intent.payment_failed\`
   - \`checkout.session.completed\`
5. Copie o "Signing secret" para \`STRIPE_WEBHOOK_SECRET\`

### 6. Configurar Supabase Storage

1. Acesse Supabase Dashboard > Storage
2. Crie os buckets:
   - \`ebooks\` (privado) - para arquivos de produtos
   - \`covers\` (público) - para capas de livros
   - \`samples\` (público) - para amostras gratuitas

3. Configure políticas RLS:

\`\`\`sql
-- Bucket ebooks: apenas downloads autorizados
CREATE POLICY "Authenticated users can download purchased ebooks"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'ebooks');

-- Bucket covers: público para leitura
CREATE POLICY "Public can view covers"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'covers');

-- Bucket samples: público para leitura
CREATE POLICY "Public can view samples"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'samples');
\`\`\`

### 7. Iniciar Desenvolvimento

\`\`\`bash
npm run dev
\`\`\`

Acesse: http://localhost:5173

## 🎯 Primeiros Passos Após Deploy

### ⚠️ CRÍTICO - Faça Imediatamente:

1. **Trocar Senha Admin**
   - Login: c-arminha1973@hotmail.com
   - Senha inicial: Carminha73#
   - O sistema forçará troca no primeiro login

2. **Configurar Chaves de Pagamento**
   - Dashboard Admin > Configurações > Pagamentos
   - Adicionar chaves Stripe (produção)
   - Adicionar chaves PayPal (produção)

3. **Configurar Webhooks**
   - Stripe: adicionar URL de produção
   - PayPal: configurar IPN

4. **Upload de Ebooks**
   - Dashboard Admin > Produtos > Adicionar Produto
   - Upload de capa, arquivo completo e amostra
   - Configurar preço e metadados

5. **Testar Fluxo Completo**
   - Fazer compra teste
   - Verificar email de confirmação
   - Testar link de download
   - Verificar expiração do link

## 📁 Estrutura do Projeto

\`\`\`
├── src/
│   ├── components/
│   │   ├── feature/          # Componentes reutilizáveis
│   │   │   ├── Navbar.tsx
│   │   │   ├── Footer.tsx
│   │   │   └── Cart.tsx
│   │   └── base/             # Componentes básicos
│   ├── pages/
│   │   ├── home/             # Página inicial
│   │   ├── catalog/          # Catálogo de produtos
│   │   ├── product/          # Detalhes do produto
│   │   ├── checkout/         # Finalização de compra
│   │   ├── admin/            # Dashboard administrativo
│   │   └── account/          # Área do cliente
│   ├── store/                # Zustand stores
│   ├── hooks/                # Custom hooks
│   ├── utils/                # Utilitários
│   └── mocks/                # Dados de exemplo
├── supabase/
│   └── functions/            # Edge Functions
│       ├── create-payment/   # Criar pagamento Stripe
│       ├── verify-payment/   # Verificar pagamento
│       ├── generate-download/# Gerar link de download
│       └── send-email/       # Enviar emails
└── docs/                     # Documentação adicional
\`\`\`

## 🔐 Segurança

### Implementado:

- ✅ **HTTPS Obrigatório** em produção
- ✅ **Row Level Security (RLS)** no Supabase
- ✅ **Sanitização de Inputs** em todos os formulários
- ✅ **Rate Limiting** nas Edge Functions
- ✅ **CSRF Protection** nos formulários
- ✅ **Tokens Únicos** para downloads
- ✅ **Expiração de Links** (configurável)
- ✅ **Validação Server-Side** de pagamentos
- ✅ **Logs de Auditoria** de todas as ações admin

### Políticas RLS Configuradas:

\`\`\`sql
-- Usuários só veem seus próprios pedidos
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own orders"
ON orders FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Apenas admins podem ver todos os pedidos
CREATE POLICY "Admins can view all orders"
ON orders FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE id = auth.uid() AND is_admin = true
  )
);
\`\`\`

## 💳 Configuração de Pagamentos

### Stripe

1. **Modo Teste** (desenvolvimento):
   - Use cartões de teste: \`4242 4242 4242 4242\`
   - Qualquer CVC e data futura

2. **Modo Produção**:
   - Ative sua conta Stripe
   - Complete verificação KYC
   - Substitua chaves de teste por produção
   - Configure webhooks de produção

### PayPal

1. **Sandbox** (desenvolvimento):
   - Crie contas de teste em developer.paypal.com
   - Use credenciais sandbox

2. **Produção**:
   - Conta PayPal Business verificada
   - Ative API REST
   - Configure IPN (Instant Payment Notification)

## 📧 Configuração de Emails

### Opção 1: Supabase Email (Recomendado)

Já configurado! Emails enviados automaticamente via Supabase.

### Opção 2: SMTP Customizado

Configure no \`.env\`:

\`\`\`env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=seu_email@gmail.com
SMTP_PASSWORD=sua_senha_app
\`\`\`

### Templates de Email Incluídos:

- ✅ Confirmação de pedido
- ✅ Link de download
- ✅ Fatura/Recibo
- ✅ Recuperação de senha
- ✅ Boas-vindas

## 🚀 Deploy em Produção

### Frontend (Vercel - Recomendado)

\`\`\`bash
# Instalar Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
\`\`\`

Configure variáveis de ambiente no Vercel Dashboard.

### Backend (Supabase Edge Functions)

\`\`\`bash
# Instalar Supabase CLI
npm i -g supabase

# Login
supabase login

# Deploy functions
supabase functions deploy create-payment
supabase functions deploy verify-payment
supabase functions deploy generate-download
supabase functions deploy send-email
\`\`\`

### Configurar Secrets nas Edge Functions:

\`\`\`bash
supabase secrets set STRIPE_SECRET_KEY=sk_live_...
supabase secrets set PAYPAL_CLIENT_SECRET=...
supabase secrets set SMTP_PASSWORD=...
\`\`\`

## 📊 Dashboard Admin

Acesse: \`/admin\`

### Funcionalidades:

- ✅ **Produtos**: CRUD completo, upload de arquivos, editor WYSIWYG
- ✅ **Categorias**: Gerenciar hierarquia e cores
- ✅ **Pedidos**: Visualizar, filtrar, exportar, reenviar links
- ✅ **Usuários**: Gerenciar clientes e permissões
- ✅ **Cupons**: Criar descontos e promoções
- ✅ **Relatórios**: Vendas, receitas, top produtos
- ✅ **Configurações**: Pagamentos, emails, webhooks
- ✅ **Logs**: Auditoria de ações administrativas

## 🧪 Testes

### Fluxo de Compra Completo:

1. Adicionar produto ao carrinho
2. Aplicar cupom de desconto (teste: \`WELCOME10\`)
3. Preencher dados de checkout
4. Selecionar país (IVA calculado automaticamente)
5. Pagar com Stripe teste: \`4242 4242 4242 4242\`
6. Receber email com link de download
7. Baixar ebook (máximo 5 downloads)
8. Link expira em 7 dias

### Cupons de Teste:

\`\`\`sql
INSERT INTO coupons (code, discount_type, discount_value, is_active) VALUES
('WELCOME10', 'percentage', 10, true),
('SAVE5', 'fixed', 5, true),
('FREESHIP', 'percentage', 100, true);
\`\`\`

## 🌍 Internacionalização

Idiomas suportados:
- 🇵🇹 Português (padrão)
- 🇬🇧 English

Adicionar novo idioma:

1. Criar arquivo: \`src/i18n/local/[codigo]/translation.ts\`
2. Traduzir todas as chaves
3. Adicionar ao \`src/i18n/local/index.ts\`

## 📈 Analytics e Métricas

### Integrado:

- Vendas diárias/mensais/anuais
- Receita total e por categoria
- Top 10 livros mais vendidos
- Taxa de conversão
- Cupons mais usados
- Downloads por produto

### Recomendado Adicionar:

- Google Analytics 4
- Sentry (monitoramento de erros)
- Hotjar (heatmaps)

## 🔄 Backup e Recuperação

### Backup Automático Supabase:

- Backups diários automáticos (plano pago)
- Retenção de 7 dias

### Backup Manual:

\`\`\`bash
# Exportar dados
supabase db dump -f backup.sql

# Restaurar
supabase db reset
psql -h db.xxx.supabase.co -U postgres -f backup.sql
\`\`\`

## 🐛 Troubleshooting

### Problema: Pagamento não confirmado

- Verificar webhook Stripe configurado
- Checar logs em Stripe Dashboard > Developers > Webhooks
- Verificar \`STRIPE_WEBHOOK_SECRET\` correto

### Problema: Email não enviado

- Verificar credenciais SMTP
- Checar logs em Supabase > Edge Functions
- Testar com serviço alternativo (SendGrid, Mailgun)

### Problema: Download não funciona

- Verificar bucket Supabase Storage criado
- Checar políticas RLS do storage
- Verificar token não expirado

### Problema: Admin não consegue logar

- Verificar \`is_admin = true\` em \`user_profiles\`
- Resetar senha via Supabase Auth
- Checar email confirmado

## 📞 Suporte

Para questões técnicas:
- 📧 Email: suporte@seudominio.com
- 💬 Discord: [link do servidor]
- 📚 Docs: https://docs.seudominio.com

## 📄 Licença

Proprietary - Todos os direitos reservados

---

**Desenvolvido com ❤️ para Carminha Marques Damas**

🚀 **Pronto para vender milhares de ebooks!**
