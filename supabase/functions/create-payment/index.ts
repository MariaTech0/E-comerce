import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import Stripe from 'https://esm.sh/stripe@14.10.0?target=deno';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// IVA por país da UE
const EU_VAT_RATES: Record<string, number> = {
  AT: 20, BE: 21, BG: 20, HR: 25, CY: 19, CZ: 21, DK: 25, EE: 20,
  FI: 24, FR: 20, DE: 19, GR: 24, HU: 27, IE: 23, IT: 22, LV: 21,
  LT: 21, LU: 17, MT: 18, NL: 21, PL: 23, PT: 23, RO: 19, SK: 20,
  SI: 22, ES: 21, SE: 25
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
    if (!stripeKey) {
      throw new Error('STRIPE_SECRET_KEY não configurada');
    }

    const stripe = new Stripe(stripeKey, {
      apiVersion: '2023-10-16',
      httpClient: Stripe.createFetchHttpClient(),
    });

    const { items, customerEmail, customerName, country, couponCode } = await req.json();

    if (!items || !Array.isArray(items) || items.length === 0) {
      throw new Error('Itens inválidos');
    }

    if (!customerEmail) {
      throw new Error('Email do cliente é obrigatório');
    }

    // Calcular subtotal
    let subtotal = 0;
    for (const item of items) {
      subtotal += item.price * item.quantity;
    }

    // Aplicar cupom se fornecido
    let discount = 0;
    let couponData = null;
    if (couponCode) {
      const { data: coupon, error: couponError } = await fetch(
        `${Deno.env.get('SUPABASE_URL')}/rest/v1/coupons?code=eq.${couponCode}&is_active=eq.true`,
        {
          headers: {
            'apikey': Deno.env.get('SUPABASE_ANON_KEY') || '',
            'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
          },
        }
      ).then(r => r.json());

      if (coupon && coupon.length > 0) {
        const c = coupon[0];
        const now = new Date();
        const validFrom = c.valid_from ? new Date(c.valid_from) : null;
        const validUntil = c.valid_until ? new Date(c.valid_until) : null;

        if ((!validFrom || now >= validFrom) && (!validUntil || now <= validUntil)) {
          if (!c.min_purchase_amount || subtotal >= c.min_purchase_amount) {
            if (!c.max_uses || c.times_used < c.max_uses) {
              if (c.discount_type === 'percentage') {
                discount = (subtotal * c.discount_value) / 100;
              } else {
                discount = c.discount_value;
              }
              couponData = c;
            }
          }
        }
      }
    }

    const subtotalAfterDiscount = Math.max(0, subtotal - discount);

    // Calcular IVA
    const vatRate = EU_VAT_RATES[country?.toUpperCase()] || 0;
    const vatAmount = (subtotalAfterDiscount * vatRate) / 100;
    const total = subtotalAfterDiscount + vatAmount;

    // Criar Payment Intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(total * 100), // Stripe usa centavos
      currency: 'eur',
      receipt_email: customerEmail,
      metadata: {
        customerEmail,
        customerName: customerName || '',
        country: country || '',
        subtotal: subtotal.toFixed(2),
        discount: discount.toFixed(2),
        vatRate: vatRate.toString(),
        vatAmount: vatAmount.toFixed(2),
        total: total.toFixed(2),
        couponCode: couponCode || '',
        items: JSON.stringify(items),
      },
      automatic_payment_methods: {
        enabled: true,
      },
    });

    // Criar pedido no Supabase
    const orderData = {
      customer_email: customerEmail,
      customer_name: customerName || '',
      subtotal_amount: subtotal,
      discount_amount: discount,
      vat_rate: vatRate,
      vat_amount: vatAmount,
      total_amount: total,
      payment_status: 'pending',
      payment_intent_id: paymentIntent.id,
      country: country || '',
      coupon_code: couponCode || null,
    };

    const orderResponse = await fetch(
      `${Deno.env.get('SUPABASE_URL')}/rest/v1/orders`,
      {
        method: 'POST',
        headers: {
          'apikey': Deno.env.get('SUPABASE_ANON_KEY') || '',
          'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation',
        },
        body: JSON.stringify(orderData),
      }
    );

    const orders = await orderResponse.json();
    const order = orders[0];

    if (!order) {
      throw new Error('Erro ao criar pedido');
    }

    // Criar itens do pedido
    for (const item of items) {
      await fetch(
        `${Deno.env.get('SUPABASE_URL')}/rest/v1/order_items`,
        {
          method: 'POST',
          headers: {
            'apikey': Deno.env.get('SUPABASE_ANON_KEY') || '',
            'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            order_id: order.id,
            product_id: item.id,
            quantity: item.quantity,
            unit_price: item.price,
            total_price: item.price * item.quantity,
          }),
        }
      );
    }

    // Atualizar uso do cupom
    if (couponData) {
      await fetch(
        `${Deno.env.get('SUPABASE_URL')}/rest/v1/coupons?id=eq.${couponData.id}`,
        {
          method: 'PATCH',
          headers: {
            'apikey': Deno.env.get('SUPABASE_ANON_KEY') || '',
            'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            times_used: (couponData.times_used || 0) + 1,
          }),
        }
      );
    }

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
          action: 'payment_created',
          entity_type: 'order',
          entity_id: order.id,
          details: {
            payment_intent_id: paymentIntent.id,
            amount: total,
            customer_email: customerEmail,
          },
        }),
      }
    );

    return new Response(
      JSON.stringify({
        clientSecret: paymentIntent.client_secret,
        orderId: order.id,
        amount: total,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Erro:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});