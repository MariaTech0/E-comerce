import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';

interface OrderDetails {
  order_number: string;
  email: string;
  total: number;
  status: string;
  payment_status: string;
  created_at: string;
  items: Array<{
    title: string;
    author: string;
    price: number;
    quantity: number;
  }>;
}

export default function OrderSuccessPage() {
  const { orderId } = useParams();
  const [order, setOrder] = useState<OrderDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchOrder = async () => {
      if (!orderId) {
        setError('ID do pedido não encontrado');
        setLoading(false);
        return;
      }

      try {
        // Buscar pedido
        const { data: orderData, error: orderError } = await supabase
          .from('orders')
          .select('*')
          .eq('id', orderId)
          .single();

        if (orderError || !orderData) {
          setError('Pedido não encontrado');
          setLoading(false);
          return;
        }

        // Buscar itens do pedido
        const { data: itemsData, error: itemsError } = await supabase
          .from('order_items')
          .select('*')
          .eq('order_id', orderId);

        if (itemsError) {
          setError('Erro ao carregar itens do pedido');
          setLoading(false);
          return;
        }

        setOrder({
          order_number: orderData.order_number,
          email: orderData.email,
          total: orderData.total,
          status: orderData.status,
          payment_status: orderData.payment_status,
          created_at: orderData.created_at,
          items: itemsData || [],
        });
      } catch (err) {
        setError('Erro ao carregar pedido');
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#FFF8E7] via-white to-[#A8E6CF]/20 flex items-center justify-center pt-20">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#4ECDC4] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando pedido...</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#FFF8E7] via-white to-[#A8E6CF]/20 flex items-center justify-center pt-20">
        <div className="text-center">
          <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <i className="ri-error-warning-line text-5xl text-red-600"></i>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Erro</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <Link
            to="/"
            className="inline-block bg-[#4ECDC4] text-white px-8 py-3 rounded-lg font-medium hover:bg-[#3db8af] transition-colors whitespace-nowrap cursor-pointer"
          >
            Voltar para a loja
          </Link>
        </div>
      </div>
    );
  }

  const isPaid = order.payment_status === 'paid';

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FFF8E7] via-white to-[#A8E6CF]/20 py-12 pt-20">
      <div className="max-w-3xl mx-auto px-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12 text-center">
          {isPaid ? (
            <>
              <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <i className="ri-check-line text-5xl text-green-600"></i>
              </div>
              <h1 className="text-4xl font-bold text-gray-900 mb-3" style={{ fontFamily: 'Playfair Display, serif' }}>
                Pagamento Confirmado!
              </h1>
              <p className="text-lg text-gray-600 mb-8">
                Obrigado pela sua compra. Seu pedido foi processado com sucesso.
              </p>
            </>
          ) : (
            <>
              <div className="w-24 h-24 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <i className="ri-time-line text-5xl text-yellow-600"></i>
              </div>
              <h1 className="text-4xl font-bold text-gray-900 mb-3" style={{ fontFamily: 'Playfair Display, serif' }}>
                Pagamento Pendente
              </h1>
              <p className="text-lg text-gray-600 mb-8">
                Seu pedido foi criado e está aguardando confirmação do pagamento.
              </p>
            </>
          )}

          <div className="bg-gray-50 rounded-xl p-6 mb-8 text-left">
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-sm text-gray-600 mb-1">Número do Pedido</p>
                <p className="font-bold text-gray-900">{order.order_number}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Total</p>
                <p className="font-bold text-gray-900">€{order.total.toFixed(2)}</p>
              </div>
            </div>

            <div className="border-t pt-4">
              <p className="text-sm text-gray-600 mb-2">Itens do Pedido</p>
              <div className="space-y-2">
                {order.items.map((item, index) => (
                  <div key={index} className="flex justify-between text-sm">
                    <span className="text-gray-700">
                      {item.title} × {item.quantity}
                    </span>
                    <span className="font-medium text-gray-900">
                      €{(item.price * item.quantity).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {isPaid && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-8">
              <div className="flex items-start gap-3 text-left">
                <i className="ri-mail-line text-2xl text-blue-600 flex-shrink-0 mt-1"></i>
                <div>
                  <h3 className="font-bold text-gray-900 mb-1">Email Enviado</h3>
                  <p className="text-sm text-gray-700">
                    Enviamos os links de download para <strong>{order.email}</strong>
                  </p>
                  <p className="text-xs text-gray-600 mt-2">
                    Não recebeu? Verifique sua caixa de spam ou acesse sua biblioteca.
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {isPaid && (
              <Link
                to="/my-library"
                className="inline-block bg-[#4ECDC4] text-white px-8 py-3 rounded-lg font-medium hover:bg-[#3db8af] transition-colors whitespace-nowrap cursor-pointer"
              >
                <i className="ri-book-3-line mr-2"></i>
                Acessar Minha Biblioteca
              </Link>
            )}
            <Link
              to="/catalog"
              className="inline-block bg-gray-800 text-white px-8 py-3 rounded-lg font-medium hover:bg-gray-900 transition-colors whitespace-nowrap cursor-pointer"
            >
              Continuar Comprando
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
