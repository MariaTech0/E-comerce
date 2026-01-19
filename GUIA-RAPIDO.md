# 📖 Guia Rápido - E-commerce de Ebooks

## 🎯 O que foi criado?

Um e-commerce completo e pronto para produção para venda de livros digitais (ebooks) com:

### ✅ Frontend Completo
- **Página Inicial** - Hero, categorias, livros em destaque
- **Catálogo** - Busca, filtros, ordenação
- **Página de Produto** - Detalhes, preview, reviews
- **Carrinho** - Persistente com cupons e cálculo de IVA
- **Checkout** - Integração Stripe com 3D Secure
- **Autenticação** - Login, registro, recuperação de senha
- **Minha Biblioteca** - Downloads seguros e expiráveis
- **Área do Cliente** - Pedidos, biblioteca, perfil

### ✅ Backend Completo
- **Supabase Database** - PostgreSQL com RLS
- **Edge Functions** - Pagamentos, downloads, emails
- **Autenticação** - Supabase Auth
- **Storage** - Arquivos seguros

### ✅ Funcionalidades Avançadas
- Sistema de cupons de desconto
- Cálculo automático de IVA por país
- Links de download expiráveis e limitados
- Sistema de reviews com moderação
- Busca full-text com trigram
- Logs de auditoria
- Multilíngue (PT/EN)

---

## 🚀 Como Usar (3 Passos)

### 1️⃣ Configurar Supabase

**No painel do Supabase:**

1. Vá em **SQL Editor**
2. Cole e execute o arquivo `database-complete.sql`
3. Cole e execute o arquivo `database-seed.sql`
4. Vá em **Storage** e crie 3 buckets:
   - `ebook-files` (privado)
   - `ebook-covers` (público)
   - `ebook-samples` (público)

### 2️⃣ Configurar Stripe

1. Acesse [dashboard.stripe.com](https://dashboard.stripe.com)
2. Copie suas chaves (modo teste):
   - Publishable key: `pk_test_...`
   - Secret key: `sk_test_...`
3. Configure webhook:
   - URL: `https://seu-projeto.supabase.co/functions/v1/verify-payment`
   - Eventos: `payment_intent.succeeded`, `payment_intent.payment_failed`
   - Copie o Webhook Secret: `whsec_...`

### 3️⃣ Deploy

```bash
# Instalar dependências
npm install

# Configurar variáveis de ambiente (copie .env.example para .env)
# Preencha com suas chaves do Supabase e Stripe

# Deploy das Edge Functions
supabase functions deploy create-payment
supabase functions deploy verify-payment
supabase functions deploy generate-download
supabase functions deploy send-email

# Configurar secrets
supabase secrets set STRIPE_SECRET_KEY=sk_test_...
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_...

# Rodar localmente
npm run dev

# Build para produção
npm run build
```

---

## 🔐 Credenciais Admin

**⚠️ IMPORTANTE: Troque no primeiro login!**

- **Email:** c-arminha1973@hotmail.com
- **Senha:** Carminha73#

Após login, você será forçado a trocar a senha.

---

## 📁 Estrutura de Arquivos

```
├── src/
│   ├── components/
│   │   ├── feature/          # Navbar, Footer, Cart
│   │   └── base/             # Componentes reutilizáveis
│   ├── pages/
│   │   ├── home/             # Página inicial
│   │   ├── catalog/          # Catálogo de produtos
│   │   ├── product/          # Detalhes do produto
│   │   ├── checkout/         # Finalizar compra
│   │   ├── auth/             # Login, registro
│   │   ├── my-library/       # Biblioteca do usuário
│   │   └── admin/            # Dashboard admin
│   ├── lib/
│   │   ├── supabase.ts       # Cliente Supabase
│   │   ├── stripe.ts         # Integração Stripe
│   │   └── auth.ts           # Autenticação
│   ├── hooks/                # Custom hooks
│   ├── store/                # Zustand stores
│   └── mocks/                # Dados de exemplo
├── supabase/
│   └── functions/            # Edge Functions
├── database-complete.sql     # Estrutura do banco
├── database-seed.sql         # Dados iniciais
├── SETUP-COMPLETO.md         # Guia completo
└── DEPLOY.md                 # Instruções de deploy
```

---

## 🎨 Personalização

### Trocar Cores

Edite `tailwind.config.ts`:

```typescript
theme: {
  extend: {
    colors: {
      primary: '#4ECDC4',    // Turquesa
      secondary: '#FF6B6B',  // Coral
      accent: '#A8E6CF',     // Lavanda
    }
  }
}
```

### Trocar Logo

Edite `src/components/feature/Navbar.tsx` e substitua o ícone/texto.

### Adicionar Idiomas

1. Crie arquivo em `src/i18n/local/[idioma]/common.ts`
2. Adicione traduções
3. Importe em `src/i18n/local/index.ts`

---

## 🔧 Funcionalidades Principais

### Carrinho Persistente
- Salvo no localStorage
- Sincronizado entre abas
- Cálculo automático de totais

### Sistema de Cupons
- Desconto percentual ou fixo
- Limite de uso
- Validade por data
- Compra mínima

### Cálculo de IVA
- Automático por país
- 12 países suportados
- Exibição clara no checkout

### Links de Download
- Tokens únicos e seguros
- Expiração configurável
- Limite de downloads
- Rastreamento de uso

### Sistema de Reviews
- Avaliações com estrelas
- Comentários
- Moderação (aprovação)
- Verificação de compra

---

## 📊 Banco de Dados

### Tabelas Principais

| Tabela | Descrição |
|--------|-----------|
| `products` | Catálogo de ebooks |
| `categories` | Categorias dos livros |
| `orders` | Pedidos dos clientes |
| `order_items` | Itens de cada pedido |
| `payments` | Registros de pagamento |
| `download_links` | Links seguros de download |
| `reviews` | Avaliações dos clientes |
| `coupons` | Cupons de desconto |
| `user_profiles` | Perfis de usuário |
| `audit_logs` | Logs de auditoria |

### Segurança (RLS)

Todas as tabelas têm Row Level Security habilitado:
- Usuários só veem seus próprios dados
- Produtos e categorias são públicos
- Reviews aprovadas são públicas
- Downloads requerem autenticação

---

## 🛠️ Comandos Úteis

```bash
# Desenvolvimento
npm run dev              # Rodar localmente
npm run build            # Build para produção
npm run preview          # Preview do build

# Supabase
supabase login           # Login no Supabase
supabase link            # Linkar projeto
supabase db push         # Aplicar migrations
supabase functions deploy # Deploy functions

# Deploy
vercel                   # Deploy no Vercel
netlify deploy --prod    # Deploy no Netlify
```

---

## 🐛 Problemas Comuns

### Erro: "Supabase connection failed"
✅ Verifique as variáveis `VITE_PUBLIC_SUPABASE_URL` e `VITE_PUBLIC_SUPABASE_ANON_KEY` no `.env`

### Erro: "Stripe payment failed"
✅ Configure `STRIPE_SECRET_KEY` nas secrets do Supabase
✅ Verifique se o webhook está configurado corretamente

### Produtos não aparecem
✅ Execute `database-seed.sql` no SQL Editor
✅ Verifique se as políticas RLS foram criadas

### Email não enviado
✅ Configure credenciais SMTP nas secrets
✅ Para Gmail, use "Senha de App"

---

## 📞 Próximos Passos

1. ✅ Execute os scripts SQL no Supabase
2. ✅ Configure Stripe e webhook
3. ✅ Deploy das Edge Functions
4. ✅ Faça login como admin e troque a senha
5. ✅ Teste o fluxo completo de compra
6. ✅ Configure domínio personalizado
7. ✅ Ative SSL/HTTPS
8. ✅ Configure backup automático

---

## 🎉 Pronto!

Seu e-commerce de ebooks está completo e pronto para vender!

Para mais detalhes, consulte:
- `SETUP-COMPLETO.md` - Guia completo de configuração
- `DEPLOY.md` - Instruções detalhadas de deploy
- `FUNCIONALIDADES.md` - Lista completa de funcionalidades
