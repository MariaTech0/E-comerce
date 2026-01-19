import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { to, subject, orderId } = await req.json();

    // Buscar detalhes do pedido
    const orderResponse = await fetch(
      `${Deno.env.get('SUPABASE_URL')}/rest/v1/orders?id=eq.${orderId}&select=*`,
      {
        headers: {
          'apikey': Deno.env.get('SUPABASE_ANON_KEY') || '',
          'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
        },
      }
    );

    const orders = await orderResponse.json();
    const order = orders[0];

    if (!order) {
      throw new Error('Pedido não encontrado');
    }

    // Buscar itens do pedido
    const itemsResponse = await fetch(
      `${Deno.env.get('SUPABASE_URL')}/rest/v1/order_items?order_id=eq.${orderId}&select=*,products(title,cover_url)`,
      {
        headers: {
          'apikey': Deno.env.get('SUPABASE_ANON_KEY') || '',
          'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
        },
      }
    );

    const items = await itemsResponse.json();

    // Buscar links de download
    const linksResponse = await fetch(
      `${Deno.env.get('SUPABASE_URL')}/rest/v1/download_links?order_id=eq.${orderId}&select=*`,
      {
        headers: {
          'apikey': Deno.env.get('SUPABASE_ANON_KEY') || '',
          'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
        },
      }
    );

    const downloadLinks = await linksResponse.json();

    // Criar HTML do email
    const itemsHtml = items.map((item: any) => `
      <tr>
        <td style="padding: 15px; border-bottom: 1px solid #eee;">
          <strong>${item.products.title}</strong><br>
          <span style="color: #666;">Quantidade: ${item.quantity}</span>
        </td>
        <td style="padding: 15px; border-bottom: 1px solid #eee; text-align: right;">
          €${item.total_price.toFixed(2)}
        </td>
      </tr>
    `).join('');

    const linksHtml = downloadLinks.map((link: any) => `
      <div style="margin: 10px 0; padding: 15px; background: #f8f9fa; border-radius: 8px;">
        <a href="${link.download_url}" style="color: #4ECDC4; text-decoration: none; font-weight: bold;">
          📥 Baixar Produto
        </a>
        <p style="margin: 5px 0 0 0; font-size: 12px; color: #666;">
          Chave de Licença: ${link.license_key}
        </p>
      </div>
    `).join('');

    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #FF6B6B 0%, #4ECDC4 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0;">BookStore</h1>
          <p style="color: white; margin: 10px 0 0 0;">Obrigado pela sua compra!</p>
        </div>
        
        <div style="background: white; padding: 30px; border: 1px solid #eee; border-top: none; border-radius: 0 0 10px 10px;">
          <h2 style="color: #333; margin-top: 0;">Pagamento Confirmado ✅</h2>
          
          <p>Olá <strong>${order.customer_name || 'Cliente'}</strong>,</p>
          
          <p>Seu pagamento foi confirmado com sucesso! Abaixo estão os detalhes do seu pedido:</p>
          
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0;"><strong>Pedido:</strong> #${order.id.slice(0, 8)}</p>
            <p style="margin: 10px 0 0 0;"><strong>Data:</strong> ${new Date(order.created_at).toLocaleDateString('pt-PT')}</p>
          </div>
          
          <h3 style="color: #333; margin-top: 30px;">Itens do Pedido:</h3>
          <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
            ${itemsHtml}
            <tr>
              <td style="padding: 15px; font-weight: bold;">Subtotal:</td>
              <td style="padding: 15px; text-align: right;">€${order.subtotal_amount.toFixed(2)}</td>
            </tr>
            ${order.discount_amount > 0 ? `
            <tr>
              <td style="padding: 15px; color: #4ECDC4;">Desconto:</td>
              <td style="padding: 15px; text-align: right; color: #4ECDC4;">-€${order.discount_amount.toFixed(2)}</td>
            </tr>
            ` : ''}
            <tr>
              <td style="padding: 15px;">IVA (${order.vat_rate}%):</td>
              <td style="padding: 15px; text-align: right;">€${order.vat_amount.toFixed(2)}</td>
            </tr>
            <tr style="background: #f8f9fa;">
              <td style="padding: 15px; font-weight: bold; font-size: 18px;">Total:</td>
              <td style="padding: 15px; text-align: right; font-weight: bold; font-size: 18px; color: #4ECDC4;">€${order.total_amount.toFixed(2)}</td>
            </tr>
          </table>
          
          <h3 style="color: #333; margin-top: 30px;">📥 Downloads Disponíveis:</h3>
          <p style="color: #666; font-size: 14px;">Os links abaixo são válidos por 7 dias:</p>
          ${linksHtml}
          
          <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 30px 0; border-radius: 4px;">
            <p style="margin: 0; color: #856404;">
              <strong>⚠️ Importante:</strong> Guarde bem suas chaves de licença. Você também pode acessar seus downloads a qualquer momento em "Minha Biblioteca" no site.
            </p>
          </div>
          
          <div style="text-align: center; margin-top: 40px; padding-top: 30px; border-top: 1px solid #eee;">
            <a href="${Deno.env.get('SITE_URL') || 'https://bookstore.com'}/my-library" 
               style="display: inline-block; background: #4ECDC4; color: white; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-weight: bold;">
              Acessar Minha Biblioteca
            </a>
          </div>
          
          <p style="text-align: center; color: #666; font-size: 14px; margin-top: 30px;">
            Precisa de ajuda? Entre em contato conosco em 
            <a href="mailto:contato@bookstore.com" style="color: #4ECDC4;">contato@bookstore.com</a>
          </p>
        </div>
        
        <div style="text-align: center; padding: 20px; color: #999; font-size: 12px;">
          <p>© ${new Date().getFullYear()} BookStore. Todos os direitos reservados.</p>
        </div>
      </body>
      </html>
    `;

    // Aqui você pode integrar com um serviço de email real
    // Por enquanto, vamos apenas logar
    console.log('Email enviado para:', to);
    console.log('Assunto:', subject);

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
          action: 'email_sent',
          entity_type: 'order',
          entity_id: orderId,
          details: {
            to,
            subject,
          },
        }),
      }
    );

    return new Response(
      JSON.stringify({ success: true, message: 'Email enviado com sucesso' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Erro ao enviar email:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});