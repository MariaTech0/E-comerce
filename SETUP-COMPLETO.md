# 🚀 Setup Completo - E-commerce de Ebooks

## ⚡ Início Rápido (5 minutos)

### 1️⃣ Configurar Supabase

**Acesse seu painel Supabase e execute:**

1. **SQL Editor** → Cole e execute o arquivo `database-seed.sql`
2. **Storage** → Crie 3 buckets:
   - `ebook-files` (privado)
   - `ebook-covers` (público)
   - `ebook-samples` (público)

### 2️⃣ Configurar Variáveis de Ambiente

Copie `.env.example` para `.env` e preencha:

```env
# Supabase (já configurado)
VITE_PUBLIC_SUPABASE_URL=sua_url
VITE_PUBLIC_SUPABASE_ANON_KEY=sua_key

# Stripe (obrigatório para pagamentos)
VITE_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# PayPal (opcional)
PAYPAL_CLIENT_ID=...
PAYPAL_CLIENT_SECRET=...

# Email (para envio de links de download)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=seu-email@gmail.com
SMTP_PASSWORD=sua-senha-app
```

### 3️⃣ Configurar Stripe

1. Acesse [dashboard.stripe.com](https://dashboard.stripe.com)
2. Copie suas chaves de API (modo teste)
3. Configure webhook:
   - URL: `https://seu-projeto.supabase.co/functions/v1/verify-payment`
   - Eventos: `payment_intent.succeeded`, `payment_intent.payment_failed`
   - Copie o `Webhook Secret`

### 4️⃣ Deploy das Edge Functions

```bash
# Instalar Supabase CLI
npm install -g supabase

# Login
supabase login

# Link ao projeto
supabase link --project-ref seu-project-ref

# Deploy das functions
supabase functions deploy create-payment
supabase functions deploy verify-payment
supabase functions deploy generate-download
supabase functions deploy send-email

# Configurar secrets
supabase secrets set STRIPE_SECRET_KEY=sk_test_...
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_...
supabase secrets set SMTP_HOST=smtp.gmail.com
supabase secrets set SMTP_PORT=587
supabase secrets set SMTP_USER=seu-email@gmail.com
supabase secrets set SMTP_PASSWORD=sua-senha
```

### 5️⃣ Instalar e Rodar

```bash
# Instalar dependências
npm install

# Rodar em desenvolvimento
npm run dev

# Build para produção
npm run build
```

---

## 🔐 Credenciais Admin Iniciais

**⚠️ IMPORTANTE: Troque a senha no primeiro login!**

- **Nome:** Carminha Marques Damas
- **Email:** c-arminha1973@hotmail.com
- **Senha:** Carminha73#

Após o primeiro login, você será forçado a trocar a senha.

---

## 📦 Deploy em Produção

### Opção 1: Vercel (Recomendado)

```bash
# Instalar Vercel CLI
npm i -g vercel

# Deploy
vercel

# Configurar variáveis de ambiente no dashboard
```

### Opção 2: Netlify

```bash
# Instalar Netlify CLI
npm i -g netlify-cli

# Deploy
netlify deploy --prod

# Configurar variáveis de ambiente no dashboard
```

---

## 🎨 Paletas de Cores Disponíveis

### Tema 1: Literário Suave (Atual)
- Coral: `#FF6B6B`
- Turquesa: `#4ECDC4`
- Lavanda: `#A8E6CF`
- Creme: `#FFF8E7`

### Tema 2: Clássico Elegante
- Azul Marinho: `#2C3E50`
- Dourado: `#F39C12`
- Marfim: `#ECF0F1`
- Verde Sálvia: `#95A5A6`

### Tema 3: Moderno Minimalista
- Preto: `#1A1A1A`
- Cinza Claro: `#F5F5F5`
- Verde Menta: `#00D9A3`
- Rosa Suave: `#FFB6C1`

Para trocar o tema, edite `tailwind.config.ts`.

---

## 📊 Estrutura do Banco de Dados

### Tabelas Principais

- **products** - Catálogo de ebooks
- **categories** - Categorias dos livros
- **orders** - Pedidos dos clientes
- **order_items** - Itens de cada pedido
- **payments** - Registros de pagamento
- **download_links** - Links seguros de download
- **reviews** - Avaliações dos clientes
- **coupons** - Cupons de desconto
- **user_profiles** - Perfis de usuário
- **audit_logs** - Logs de auditoria

### Dados Iniciais (Seed)

✅ 100+ categorias realistas
✅ 100+ livros com dados completos
✅ Usuário admin configurado
✅ Cupons de exemplo
✅ Políticas RLS configuradas

---

## 🔒 Segurança Implementada

✅ **Row Level Security (RLS)** - Todas as tabelas protegidas
✅ **Links de download expiráveis** - Tokens únicos com expiração
✅ **Rate limiting** - Proteção contra abuso
✅ **Validação server-side** - Todas as operações validadas
✅ **HTTPS obrigatório** - Comunicação criptografada
✅ **Sanitização de inputs** - Proteção contra XSS/SQL injection
✅ **GDPR compliance** - Ferramentas para exportar/deletar dados

---

## 📧 Templates de Email

Os seguintes emails são enviados automaticamente:

1. **Confirmação de Pedido** - Após pagamento bem-sucedido
2. **Links de Download** - Com tokens seguros e expiração
3. **Fatura PDF** - Gerada automaticamente
4. **Recuperação de Conta** - Reset de senha

Templates disponíveis em PT e EN.

---

## 🛠️ Funcionalidades Implementadas

### Frontend
✅ Catálogo com busca e filtros
✅ Páginas de produto com preview
✅ Carrinho persistente
✅ Checkout com Stripe
✅ Sistema de cupons
✅ Cálculo de IVA por país
✅ Área do cliente
✅ Sistema de reviews
✅ Multilíngue (PT/EN)
✅ Responsivo (mobile/tablet/desktop)

### Backend
✅ API de pagamentos (Stripe)
✅ Geração de links de download
✅ Envio de emails transacionais
✅ Webhooks de pagamento
✅ Validação e segurança
✅ Logs de auditoria

### Admin Dashboard
✅ CRUD de produtos
✅ Gestão de categorias
✅ Gestão de pedidos
✅ Gestão de usuários
✅ Gestão de cupons
✅ Relatórios e analytics
✅ Upload de arquivos
✅ Configurações

---

## 🐛 Troubleshooting

### Erro: "Supabase connection failed"
- Verifique se as variáveis `VITE_PUBLIC_SUPABASE_URL` e `VITE_PUBLIC_SUPABASE_ANON_KEY` estão corretas no `.env`

### Erro: "Stripe payment failed"
- Verifique se `STRIPE_SECRET_KEY` está configurado nas secrets do Supabase
- Confirme que o webhook está configurado corretamente

### Erro: "Email not sent"
- Verifique as credenciais SMTP no Supabase secrets
- Para Gmail, use uma "Senha de App" em vez da senha normal

### Produtos não aparecem
- Execute o `database-seed.sql` no SQL Editor do Supabase
- Verifique se as políticas RLS foram criadas corretamente

---

## 📞 Suporte

Para dúvidas ou problemas:

1. Verifique a documentação completa em `FUNCIONALIDADES.md`
2. Consulte os logs no Supabase Dashboard
3. Revise o arquivo `DEPLOY.md` para instruções de deploy

---

## ✅ Checklist de Produção

Antes de colocar no ar:

- [ ] Executar `database-seed.sql` no Supabase
- [ ] Criar buckets de storage (ebook-files, ebook-covers, ebook-samples)
- [ ] Configurar todas as variáveis de ambiente
- [ ] Deploy das Edge Functions
- [ ] Configurar secrets do Supabase
- [ ] Configurar webhook do Stripe
- [ ] Fazer login como admin e trocar senha
- [ ] Testar fluxo completo de compra
- [ ] Configurar domínio personalizado
- [ ] Configurar SSL/HTTPS
- [ ] Testar envio de emails
- [ ] Fazer backup do banco de dados

---

**🎉 Pronto! Seu e-commerce de ebooks está pronto para vender!**
