# 🚀 Guia Rápido de Deploy - E-commerce de Ebooks

## ⚡ Passos Críticos (15 minutos)

### 1️⃣ Criar Usuário Admin (OBRIGATÓRIO)

**No Supabase Dashboard:**

1. Vá em **Authentication** > **Users**
2. Clique em **Add user** > **Create new user**
3. Preencha:
   - Email: `c-arminha1973@hotmail.com`
   - Password: `Carminha73#`
   - ✅ Marque "Auto Confirm User"
4. Clique em **Create user**
5. **COPIE O UUID** do usuário criado

**No SQL Editor:**

```sql
-- Substitua 'UUID_COPIADO' pelo UUID real do usuário
INSERT INTO user_profiles (id, full_name, role, is_admin, force_password_change)
VALUES (
  'UUID_COPIADO',
  'Carminha Marques Damas',
  'admin',
  true,
  true
);
```

### 2️⃣ Popular Banco de Dados

**No SQL Editor do Supabase:**

1. Abra o arquivo `database-seed.sql`
2. Copie TODO o conteúdo
3. Cole no SQL Editor
4. Clique em **Run**
5. Aguarde conclusão (pode levar 1-2 minutos)

✅ Isso criará:
- 100+ categorias
- 15+ livros de exemplo (expandível para 100+)
- 5 cupons de teste
- Políticas RLS de segurança
- Índices de performance
- Views para relatórios

### 3️⃣ Configurar Stripe

**Obter Chaves:**

1. Acesse: https://dashboard.stripe.com/test/apikeys
2. Copie:
   - **Publishable key** (começa com `pk_test_`)
   - **Secret key** (começa com `sk_test_`)

**Adicionar ao .env:**

```env
VITE_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_sua_chave_aqui
STRIPE_SECRET_KEY=sk_test_sua_chave_aqui
```

**Configurar Webhook:**

1. Acesse: https://dashboard.stripe.com/test/webhooks
2. Clique em **Add endpoint**
3. URL: `https://SEU_PROJETO.supabase.co/functions/v1/verify-payment`
4. Selecione eventos:
   - ✅ `payment_intent.succeeded`
   - ✅ `payment_intent.payment_failed`
5. Clique em **Add endpoint**
6. Copie o **Signing secret** (começa com `whsec_`)

**Adicionar Secret no Supabase:**

```bash
# No terminal
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_sua_chave_aqui
```

### 4️⃣ Configurar Supabase Storage

**Criar Buckets:**

1. Vá em **Storage** no Supabase Dashboard
2. Clique em **New bucket**
3. Crie 3 buckets:

**Bucket 1: ebooks** (Privado)
- Name: `ebooks`
- ❌ Public bucket: OFF
- Para: arquivos completos dos ebooks

**Bucket 2: covers** (Público)
- Name: `covers`
- ✅ Public bucket: ON
- Para: capas dos livros

**Bucket 3: samples** (Público)
- Name: `samples`
- ✅ Public bucket: ON
- Para: amostras gratuitas

**Configurar Políticas RLS:**

No SQL Editor:

```sql
-- Bucket ebooks: apenas downloads autorizados
CREATE POLICY "Authenticated downloads"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'ebooks');

-- Bucket covers: público
CREATE POLICY "Public covers"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'covers');

-- Bucket samples: público
CREATE POLICY "Public samples"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'samples');

-- Admins podem fazer upload
CREATE POLICY "Admin uploads"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id IN ('ebooks', 'covers', 'samples') AND
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE id = auth.uid() AND is_admin = true
  )
);
```

### 5️⃣ Testar Fluxo Completo

**Teste de Compra:**

1. Acesse: http://localhost:5173
2. Navegue até o catálogo
3. Adicione um livro ao carrinho
4. Vá para checkout
5. Use cupom: `WELCOME10`
6. Preencha dados:
   - Nome: Teste
   - Email: seu@email.com
   - País: Portugal
7. Clique em "Continuar para Pagamento"
8. Use cartão de teste Stripe:
   - Número: `4242 4242 4242 4242`
   - Data: qualquer data futura
   - CVC: qualquer 3 dígitos
   - CEP: qualquer
9. Confirme pagamento
10. ✅ Você será redirecionado para página de sucesso
11. ✅ Verifique email (se configurado)

### 6️⃣ Primeiro Login Admin

1. Acesse: http://localhost:5173/admin
2. Login:
   - Email: `c-arminha1973@hotmail.com`
   - Password: `Carminha73#`
3. ⚠️ O sistema forçará troca de senha
4. Defina nova senha segura
5. ✅ Acesse o dashboard admin

---

## 🔐 Configurações de Segurança

### Secrets do Supabase

Configure os secrets nas Edge Functions:

```bash
# Stripe
supabase secrets set STRIPE_SECRET_KEY=sk_test_...
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_...

# PayPal (opcional)
supabase secrets set PAYPAL_CLIENT_SECRET=...

# Email SMTP (opcional)
supabase secrets set SMTP_PASSWORD=...
```

### Variáveis de Ambiente

Arquivo `.env` completo:

```env
# Supabase (já configurado)
VITE_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_PUBLIC_SUPABASE_ANON_KEY=sua_chave_aqui

# Stripe
VITE_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# App
VITE_APP_URL=http://localhost:5173
VITE_VAT_RATE_LU=17
VITE_VAT_RATE_PT=23
VITE_DOWNLOAD_LINK_EXPIRY_HOURS=168
VITE_MAX_DOWNLOADS_PER_PURCHASE=5
```

---

## 📦 Deploy em Produção

### Vercel (Frontend)

```bash
# Instalar CLI
npm i -g vercel

# Deploy
vercel --prod

# Configurar variáveis de ambiente no dashboard
```

### Supabase (Backend)

```bash
# Deploy Edge Functions
supabase functions deploy create-payment
supabase functions deploy verify-payment
supabase functions deploy generate-download
supabase functions deploy send-email

# Configurar secrets de produção
supabase secrets set STRIPE_SECRET_KEY=sk_live_...
```

### Atualizar Webhook Stripe

1. Acesse: https://dashboard.stripe.com/webhooks
2. Edite o endpoint
3. Atualize URL para: `https://SEU_PROJETO.supabase.co/functions/v1/verify-payment`
4. Mude para modo **Live**
5. Atualize chaves no `.env` para `pk_live_` e `sk_live_`

---

## ✅ Checklist Final

Antes de ir para produção:

- [ ] Usuário admin criado e senha alterada
- [ ] Banco de dados populado com produtos
- [ ] Stripe configurado (modo live)
- [ ] Webhooks Stripe funcionando
- [ ] Buckets Supabase Storage criados
- [ ] Políticas RLS configuradas
- [ ] Edge Functions deployadas
- [ ] Secrets configurados
- [ ] Teste de compra completo realizado
- [ ] Email transacional funcionando
- [ ] Links de download testados
- [ ] Dashboard admin acessível
- [ ] SSL/HTTPS ativo
- [ ] Domínio customizado configurado

---

## 🆘 Troubleshooting Rápido

**Erro: "Não autenticado"**
- Verifique se o usuário está logado
- Limpe cache e cookies
- Tente fazer login novamente

**Erro: "Cupom inválido"**
- Execute o script `database-seed.sql`
- Verifique se cupons foram criados
- Use código em MAIÚSCULAS

**Erro: "Pagamento falhou"**
- Verifique chaves Stripe corretas
- Use cartão de teste: 4242 4242 4242 4242
- Verifique console do navegador

**Erro: "Download não funciona"**
- Verifique buckets criados
- Verifique políticas RLS do storage
- Verifique se pedido foi pago

**Erro: "Admin não consegue logar"**
- Verifique UUID correto no user_profiles
- Verifique is_admin = true
- Resete senha via Supabase Auth

---

## 📞 Suporte

**Documentação Completa:** Ver `README.md`

**Logs de Erro:**
- Supabase: Dashboard > Edge Functions > Logs
- Stripe: Dashboard > Developers > Logs
- Browser: Console (F12)

---

**🎉 Pronto! Seu e-commerce está funcionando!**

Tempo estimado de configuração: **15-20 minutos**
