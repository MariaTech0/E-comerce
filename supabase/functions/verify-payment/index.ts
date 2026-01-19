import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import Stripe from 'https://esm.sh/stripe@14.10.0?target=deno';

serve(async (req) => {
  try {
    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');
    
    if (!stripeKey) {
      throw new Error('STRIPE_SECRET_KEY não configurada');
    }

    const stripe = new Stripe(stripeKey, {
      apiVersion: '2023-10-16',
      httpClient: Stripe.createFetchHttpClient(),
    });

    const signature = req.headers.get('stripe-signature');
    const body = await req.text();

    let event;
    if (webhookSecret && signature) {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } else {
      event = JSON.parse(body);
    }

    if (event.type === 'payment_intent.succeeded') {
      const paymentIntent = event.data.object;

      // Atualizar pedido
      const updateResponse = await fetch(
        `${Deno.env.get('SUPABASE_URL')}/rest/v1/orders?payment_intent_id=eq.${paymentIntent.id}`,
        {
          method: 'PATCH',
          headers: {
            'apikey': Deno.env.get('SUPABASE_ANON_KEY') || '',
            'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation',
          },
          body: JSON.stringify({
            payment_status: 'paid',
            paid_at: new Date().toISOString(),
          }),
        }
      );

      const orders = await updateResponse.json();
      const order = orders[0];

      if (order) {
        // Buscar itens do pedido
        const itemsResponse = await fetch(
          `${Deno.env.get('SUPABASE_URL')}/rest/v1/order_items?order_id=eq.${order.id}&select=*,products(*)`,
          {
            headers: {
              'apikey': Deno.env.get('SUPABASE_ANON_KEY') || '',
              'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
            },
          }
        );

        const items = await itemsResponse.json();

        // Gerar links de download para cada produto
        for (const item of items) {
          if (item.products && item.products.file_url) {
            const expiresAt = new Date();
            expiresAt.setDate(expiresAt.getDate() + 7); // 7 dias

            await fetch(
              `${Deno.env.get('SUPABASE_URL')}/rest/v1/download_links`,
              {
                method: 'POST',
                headers: {
                  'apikey': Deno.env.get('SUPABASE_ANON_KEY') || '',
                  'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  order_id: order.id,
                  product_id: item.product_id,
                  download_url: item.products.file_url,
                  expires_at: expiresAt.toISOString(),
                  license_key: crypto.randomUUID(),
                }),
              }
            );
          }
        }

        // Enviar email de confirmação
        await fetch(
          `${Deno.env.get('SUPABASE_URL')}/functions/v1/send-email`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              to: order.customer_email,
              subject: 'Pagamento Confirmado - BookStore',
              orderId: order.id,
            }),
          }
        );

        // Log de auditoria
        await fetch(
          `${Deno.env.get('SUPABASE_URL')}/rest/v1/audit_logs`,
          {
            method: 'POST',
            headers: {
              'apikey': Deno.env.get('SUPABASE_ANON_KEY') || '',
              'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              action: 'payment_confirmed',
              entity_type: 'order',
              entity_id: order.id,
              details: {
                payment_intent_id: paymentIntent.id,
                amount: order.total_amount,
              },
            }),
          }
        );
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error('Erro no webhook:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});