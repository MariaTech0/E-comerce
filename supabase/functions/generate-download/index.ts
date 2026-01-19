import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const {
      data: { user },
    } = await supabaseClient.auth.getUser();

    if (!user) {
      throw new Error('Não autenticado');
    }

    const { token } = await req.json();

    // Buscar link de download
    const { data: downloadLink, error: linkError } = await supabaseClient
      .from('download_links')
      .select('*, orders(*), products(*)')
      .eq('token', token)
      .eq('is_active', true)
      .single();

    if (linkError || !downloadLink) {
      throw new Error('Link de download inválido ou expirado');
    }

    // Verificar se o link pertence ao usuário
    if (downloadLink.orders.user_id !== user.id) {
      throw new Error('Você não tem permissão para acessar este download');
    }

    // Verificar expiração
    const now = new Date();
    const expiresAt = new Date(downloadLink.expires_at);
    if (now > expiresAt) {
      await supabaseClient
        .from('download_links')
        .update({ is_active: false })
        .eq('id', downloadLink.id);
      throw new Error('Link de download expirado');
    }

    // Verificar limite de downloads
    if (downloadLink.download_count >= downloadLink.max_downloads) {
      throw new Error('Limite de downloads atingido');
    }

    // Buscar arquivo do produto
    const { data: productFile } = await supabaseClient
      .from('product_files')
      .select('*')
      .eq('product_id', downloadLink.product_id)
      .eq('is_sample', false)
      .single();

    if (!productFile) {
      throw new Error('Arquivo não encontrado');
    }

    // Gerar URL assinada do Supabase Storage (válida por 1 hora)
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { data: signedUrl, error: urlError } = await supabaseAdmin.storage
      .from('ebooks')
      .createSignedUrl(productFile.file_path, 3600); // 1 hora

    if (urlError || !signedUrl) {
      throw new Error('Erro ao gerar URL de download');
    }

    // Incrementar contador de downloads
    await supabaseClient
      .from('download_links')
      .update({ download_count: downloadLink.download_count + 1 })
      .eq('id', downloadLink.id);

    // Atualizar contador de downloads do produto
    await supabaseClient
      .from('products')
      .update({ downloads_count: downloadLink.products.downloads_count + 1 })
      .eq('id', downloadLink.product_id);

    // Log de auditoria
    await supabaseClient.from('audit_logs').insert({
      user_id: user.id,
      action: 'download_file',
      entity_type: 'product',
      entity_id: downloadLink.product_id,
      new_values: {
        order_id: downloadLink.order_id,
        download_count: downloadLink.download_count + 1,
      },
    });

    return new Response(
      JSON.stringify({
        downloadUrl: signedUrl.signedUrl,
        fileName: productFile.file_name,
        fileSize: productFile.file_size,
        remainingDownloads: downloadLink.max_downloads - downloadLink.download_count - 1,
        expiresAt: downloadLink.expires_at,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});