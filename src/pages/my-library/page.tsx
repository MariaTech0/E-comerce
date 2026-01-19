import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';

interface LibraryItem {
  id: string;
  order_id: string;
  product_id: string;
  title: string;
  author: string;
  cover_url: string;
  format: string;
  download_token: string;
  expires_at: string;
  download_count: number;
  max_downloads: number;
  order_date: string;
}

export default function MyLibraryPage() {
  const [library, setLibrary] = useState<LibraryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const fetchLibrary = async () => {
      try {
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        
        if (!currentUser) {
          window.location.href = '/auth/login';
          return;
        }

        setUser(currentUser);

        // Buscar pedidos do usuário
        const { data: orders } = await supabase
          .from('orders')
          .select('id, created_at')
          .eq('user_id', currentUser.id)
          .eq('payment_status', 'paid')
          .order('created_at', { ascending: false });

        if (!orders || orders.length === 0) {
          setLoading(false);
          return;
        }

        const orderIds = orders.map(o => o.id);

        // Buscar itens dos pedidos
        const { data: items } = await supabase
          .from('order_items')
          .select('*, products(cover_url, format)')
          .in('order_id', orderIds);

        // Buscar links de download
        const { data: downloadLinks } = await supabase
          .from('download_links')
          .select('*')
          .in('order_id', orderIds)
          .eq('is_active', true);

        // Combinar dados
        const libraryItems: LibraryItem[] = (items || []).map(item => {
          const order = orders.find(o => o.id === item.order_id);
          const link = downloadLinks?.find(l => l.product_id === item.product_id && l.order_id === item.order_id);
          const product = item.products as any;

          return {
            id: item.id,
            order_id: item.order_id,
            product_id: item.product_id,
            title: item.title,
            author: item.author,
            cover_url: product?.cover_url || '',
            format: product?.format || 'pdf',
            download_token: link?.token || '',
            expires_at: link?.expires_at || '',
            download_count: link?.download_count || 0,
            max_downloads: link?.max_downloads || 5,
            order_date: order?.created_at || '',
          };
        });

        setLibrary(libraryItems);
      } catch (error) {
        console.error('Erro ao carregar biblioteca:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchLibrary();
  }, []);

  const handleDownload = async (token: string, title: string) => {
    try {
      const supabaseUrl = import.meta.env.VITE_PUBLIC_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.VITE_PUBLIC_SUPABASE_ANON_KEY;

      const response = await fetch(`${supabaseUrl}/functions/v1/generate-download`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseAnonKey}`,
        },
        body: JSON.stringify({ token }),
      });

      if (!response.ok) {
        throw new Error('Erro ao gerar link de download');
      }

      const { downloadUrl } = await response.json();

      // Abrir download em nova aba
      window.open(downloadUrl, '_blank');
    } catch (error) {
      alert('Erro ao fazer download. Tente novamente.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#FFF8E7] via-white to-[#A8E6CF]/20 flex items-center justify-center pt-20">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#4ECDC4] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando sua biblioteca...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FFF8E7] via-white to-[#A8E6CF]/20 py-12 pt-20">
      <div className="max-w-7xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2" style={{ fontFamily: 'Playfair Display, serif' }}>
            Minha Biblioteca
          </h1>
          <p className="text-gray-600">Acesse seus ebooks comprados</p>
        </div>

        {library.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <i className="ri-book-3-line text-5xl text-gray-400"></i>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Sua biblioteca está vazia</h2>
            <p className="text-gray-600 mb-6">Comece a explorar nosso catálogo e adicione ebooks à sua coleção</p>
            <Link
              to="/catalog"
              className="inline-block bg-[#4ECDC4] text-white px-8 py-3 rounded-lg font-medium hover:bg-[#3db8af] transition-colors whitespace-nowrap cursor-pointer"
            >
              Explorar Catálogo
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {library.map((item) => {
              const isExpired = new Date(item.expires_at) < new Date();
              const downloadsRemaining = item.max_downloads - item.download_count;

              return (
                <div key={item.id} className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
                  <div className="aspect-[3/4] relative overflow-hidden bg-gray-100">
                    <img
                      src={item.cover_url}
                      alt={item.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-medium text-gray-700">
                      {item.format.toUpperCase()}
                    </div>
                  </div>

                  <div className="p-6">
                    <h3 className="font-bold text-lg text-gray-900 mb-1 line-clamp-2">
                      {item.title}
                    </h3>
                    <p className="text-sm text-gray-600 mb-4">{item.author}</p>

                    <div className="space-y-2 mb-4">
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>Downloads restantes:</span>
                        <span className="font-medium text-gray-700">{downloadsRemaining} de {item.max_downloads}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>Expira em:</span>
                        <span className={`font-medium ${isExpired ? 'text-red-600' : 'text-gray-700'}`}>
                          {isExpired ? 'Expirado' : new Date(item.expires_at).toLocaleDateString('pt-PT')}
                        </span>
                      </div>
                    </div>

                    {!isExpired && downloadsRemaining > 0 ? (
                      <button
                        onClick={() => handleDownload(item.download_token, item.title)}
                        className="w-full bg-[#4ECDC4] text-white py-2.5 rounded-lg font-medium hover:bg-[#3db8af] transition-colors flex items-center justify-center gap-2 whitespace-nowrap cursor-pointer"
                      >
                        <i className="ri-download-2-line"></i>
                        Fazer Download
                      </button>
                    ) : (
                      <div className="w-full bg-gray-100 text-gray-500 py-2.5 rounded-lg font-medium text-center">
                        {isExpired ? 'Link expirado' : 'Downloads esgotados'}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
