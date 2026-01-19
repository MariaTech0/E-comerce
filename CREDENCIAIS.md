# 🔐 Credenciais e Configurações - E-commerce de Ebooks

## ⚠️ IMPORTANTE - LEIA PRIMEIRO

Este arquivo contém informações sensíveis sobre credenciais e configurações do sistema.

**NUNCA compartilhe este arquivo publicamente ou faça commit no Git!**

---

## 👤 Credenciais Admin Inicial

### Acesso ao Dashboard Admin

**URL:** `/admin`

**Credenciais Iniciais:**
- **Email:** `c-arminha1973@hotmail.com`
- **Senha Inicial:** `Carminha73#`
- **Nome:** Carminha Marques Damas

### ⚠️ AÇÃO OBRIGATÓRIA NO PRIMEIRO LOGIN

O sistema **forçará a troca de senha** no primeiro acesso por segurança.

**Passos:**
1. Acesse `/admin`
2. Faça login com as credenciais acima
3. Você será redirecionado para `/admin/trocar-senha`
4. Defina uma nova senha forte (mínimo 8 caracteres)
5. Confirme a nova senha
6. Faça login novamente com a nova senha

**Requisitos da Nova Senha:**
- Mínimo 8 caracteres
- Pelo menos 1 letra maiúscula
- Pelo menos 1 letra minúscula
- Pelo menos 1 número
- Pelo menos 1 caractere especial (@, #, $, %, etc.)

---

## 🔑 Chaves de API e Secrets

### Supabase

**Obter em:** https://app.supabase.com/project/_/settings/api

```env
VITE_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... (NUNCA expor no frontend!)
```

**Configurar Secrets nas Edge Functions:**
```bash
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=sua_chave_service_role
```

---

### Stripe

**Obter em:** https://dashboard.stripe.com/apikeys

#### Modo Teste (Desenvolvimento)
```env
VITE_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_51...
STRIPE_SECRET_KEY=sk_test_51...
```

#### Modo Live (Produção)
```env
VITE_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_51...
STRIPE_SECRET_KEY=sk_live_51...
```

**Webhook Secret:**
```env
STRIPE_WEBHOOK_SECRET=whsec_...
```

**Configurar Secret no Supabase:**
```bash
supabase secrets set STRIPE_SECRET_KEY=sk_test_...
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_...
```

**Cartões de Teste Stripe:**
- **Sucesso:** `4242 4242 4242 4242`
- **Falha:** `4000 0000 0000 0002`
- **3D Secure:** `4000 0027 6000 3184`
- **Qualquer CVC:** 3 dígitos
- **Qualquer data futura**

---

### PayPal (Opcional)

**Obter em:** https://developer.paypal.com/

#### Sandbox (Desenvolvimento)
```env
VITE_PUBLIC_PAYPAL_CLIENT_ID=AYSq3RDGsmBLJE-otTkBtM-jBRd1TCQwFf9RGfwddNXWz0uFU9ztymylOhRS
PAYPAL_CLIENT_SECRET=EGnHDxD_qRPdaLdZz8iCr8N7_MzF-YHPTkjs6NKYQvQSBngp4PTTVWkPZRbL
VITE_PUBLIC_PAYPAL_MODE=sandbox
```

#### Live (Produção)
```env
VITE_PUBLIC_PAYPAL_CLIENT_ID=seu_client_id_live
PAYPAL_CLIENT_SECRET=seu_client_secret_live
VITE_PUBLIC_PAYPAL_MODE=live
```

**Configurar Secret no Supabase:**
```bash
supabase secrets set PAYPAL_CLIENT_SECRET=seu_secret
```

---

### Email SMTP

#### Opção 1: Gmail

**Obter senha de app:** https://myaccount.google.com/apppasswords

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=seu_email@gmail.com
SMTP_PASSWORD=xxxx xxxx xxxx xxxx (senha de app)
SMTP_FROM_EMAIL=noreply@seudominio.com
SMTP_FROM_NAME=Livraria Digital
```

#### Opção 2: SendGrid

**Obter API Key:** https://app.sendgrid.com/settings/api_keys

```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASSWORD=SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

#### Opção 3: Mailgun

**Obter credenciais:** https://app.mailgun.com/

```env
SMTP_HOST=smtp.mailgun.org
SMTP_PORT=587
SMTP_USER=postmaster@seu-dominio.mailgun.org
SMTP_PASSWORD=sua_senha_mailgun
```

**Configurar Secret no Supabase:**
```bash
supabase secrets set SMTP_PASSWORD=sua_senha
supabase secrets set SMTP_USER=seu_usuario
```

---

## 🗄️ Banco de Dados

### Credenciais Supabase Database

**Obter em:** https://app.supabase.com/project/_/settings/database

```
Host: db.seu-projeto.supabase.co
Database: postgres
Port: 5432
User: postgres
Password: sua_senha_database
```

**Connection String:**
```
postgresql://postgres:sua_senha@db.seu-projeto.supabase.co:5432/postgres
```

### Backup Manual

```bash
# Exportar
pg_dump -h db.seu-projeto.supabase.co -U postgres -d postgres > backup.sql

# Importar
psql -h db.seu-projeto.supabase.co -U postgres -d postgres < backup.sql
```

---

## 🪣 Supabase Storage

### Buckets Criados

1. **ebooks** (Privado)
   - Para: Arquivos completos dos ebooks
   - Acesso: Apenas usuários autenticados com compra

2. **covers** (Público)
   - Para: Capas dos livros
   - Acesso: Público

3. **samples** (Público)
   - Para: Amostras gratuitas
   - Acesso: Público

### URLs dos Buckets

```
https://seu-projeto.supabase.co/storage/v1/object/public/covers/
https://seu-projeto.supabase.co/storage/v1/object/public/samples/
https://seu-projeto.supabase.co/storage/v1/object/sign/ebooks/ (requer token)
```

---

## 🔗 URLs e Endpoints

### Frontend (Desenvolvimento)
```
http://localhost:5173
```

### Frontend (Produção)
```
https://seu-dominio.com
```

### Edge Functions
```
https://seu-projeto.supabase.co/functions/v1/create-payment
https://seu-projeto.supabase.co/functions/v1/verify-payment
https://seu-projeto.supabase.co/functions/v1/generate-download
https://seu-projeto.supabase.co/functions/v1/send-email
```

### Webhooks

**Stripe Webhook URL:**
```
https://seu-projeto.supabase.co/functions/v1/verify-payment
```

**PayPal IPN URL:**
```
https://seu-projeto.supabase.co/functions/v1/paypal-ipn
```

---

## 🎫 Cupons de Teste

### Cupons Pré-configurados

| Código | Tipo | Valor | Mínimo | Máximo | Limite |
|--------|------|-------|--------|--------|--------|
| WELCOME10 | Percentual | 10% | €0 | - | 1000 |
| SAVE5 | Fixo | €5 | €20 | - | 500 |
| BLACKFRIDAY | Percentual | 30% | €50 | €20 | 100 |
| FIRSTBUY | Percentual | 15% | €0 | €10 | - |
| SUMMER2024 | Percentual | 20% | €30 | €15 | 200 |

**Criar Novos Cupons:**
```sql
INSERT INTO coupons (code, discount_type, discount_value, min_purchase, max_discount, usage_limit, is_active)
VALUES ('CODIGO', 'percentage', 10, 0, NULL, 100, true);
```

---

## 👥 Usuários de Teste

### Admin
- Email: `c-arminha1973@hotmail.com`
- Senha: `Carminha73#` (trocar no primeiro login)
- Role: admin
- Permissões: Acesso total

### Cliente Teste (Criar manualmente)
- Email: `cliente@teste.com`
- Senha: `Teste123#`
- Role: customer
- Permissões: Compras e downloads

---

## 🔐 Segurança

### JWT Secret

**Gerar novo secret:**
```bash
openssl rand -base64 32
```

```env
JWT_SECRET=sua_chave_secreta_jwt_aqui
```

### Rate Limiting

```env
RATE_LIMIT_PER_MINUTE=60
```

### Download Links

```env
VITE_DOWNLOAD_LINK_EXPIRY_HOURS=168  # 7 dias
VITE_MAX_DOWNLOADS_PER_PURCHASE=5
```

---

## 📊 Analytics (Opcional)

### Google Analytics 4

**Obter ID:** https://analytics.google.com/

```env
VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX
```

### Sentry

**Obter DSN:** https://sentry.io/

```env
VITE_SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx
```

---

## 🌍 Configurações de IVA

### Taxas por País

```env
VITE_VAT_RATE_LU=17  # Luxemburgo (padrão)
VITE_VAT_RATE_PT=23  # Portugal
VITE_VAT_RATE_DE=19  # Alemanha
VITE_VAT_RATE_FR=20  # França
VITE_VAT_RATE_ES=21  # Espanha
VITE_VAT_RATE_IT=22  # Itália
VITE_VAT_RATE_BE=21  # Bélgica
VITE_VAT_RATE_NL=21  # Holanda
VITE_VAT_RATE_DEFAULT=21  # Outros países
```

---

## 📝 Checklist de Segurança

Antes de ir para produção:

- [ ] Trocar senha admin inicial
- [ ] Usar chaves Stripe LIVE (não test)
- [ ] Configurar webhook Stripe em produção
- [ ] Usar SMTP real (não Gmail pessoal)
- [ ] Ativar HTTPS/SSL
- [ ] Configurar domínio customizado
- [ ] Ativar backups automáticos Supabase
- [ ] Configurar monitoramento (Sentry)
- [ ] Revisar políticas RLS
- [ ] Testar fluxo completo de compra
- [ ] Verificar emails sendo enviados
- [ ] Testar downloads funcionando
- [ ] Configurar rate limiting
- [ ] Adicionar CAPTCHA em formulários
- [ ] Configurar CSP headers
- [ ] Ativar 2FA para admin

---

## 🆘 Recuperação de Acesso

### Esqueci a Senha Admin

1. Acesse Supabase Dashboard
2. Vá em Authentication > Users
3. Encontre o usuário admin
4. Clique em "..." > "Send password recovery"
5. Verifique o email
6. Defina nova senha

### Resetar Senha Manualmente

```sql
-- No SQL Editor do Supabase
UPDATE auth.users
SET encrypted_password = crypt('NovaSenha123#', gen_salt('bf'))
WHERE email = 'c-arminha1973@hotmail.com';

-- Remover flag de troca forçada
UPDATE user_profiles
SET force_password_change = false
WHERE id = (SELECT id FROM auth.users WHERE email = 'c-arminha1973@hotmail.com');
```

---

## 📞 Suporte Técnico

**Em caso de problemas:**

1. Verificar logs no Supabase Dashboard
2. Verificar logs no Stripe Dashboard
3. Verificar console do navegador (F12)
4. Consultar documentação: `README.md` e `DEPLOY.md`
5. Verificar este arquivo para credenciais corretas

---

**⚠️ LEMBRE-SE: Nunca compartilhe este arquivo ou faça commit no Git!**

**Adicione ao .gitignore:**
```
CREDENCIAIS.md
.env
.env.local
.env.production
```
