import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import { useCartStore } from '../../store/cartStore';
import { supabase } from '../../lib/supabase';
import { createPaymentIntent, calculateCartTotals } from '../../lib/stripe';
import toast from 'react-hot-toast';

const stripePromise = loadStripe(import.meta.env.VITE_PUBLIC_STRIPE_PUBLISHABLE_KEY || '');

export default function CheckoutPage() {
  const { items, clearCart } = useCartStore();
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    email: '',
    country: 'LU',
    couponCode: '',
  });

  const [coupon, setCoupon] = useState<any>(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState('');

  useEffect(() => {
    if (items.length === 0) {
      navigate('/catalog');
      return;
    }

    const checkUser = async () => {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (currentUser) {
        setUser(currentUser);
        setFormData(prev => ({ ...prev, email: currentUser.email || '' }));
      }
    };

    checkUser();
  }, [items, navigate]);

  const applyCoupon = async () => {
    if (!formData.couponCode.trim()) {
      setCouponError('Digite um código de cupom');
      return;
    }

    try {
      setCouponLoading(true);
      setCouponError('');

      const { data, error: fetchError } = await supabase
        .from('coupons')
        .select('*')
        .eq('code', formData.couponCode.toUpperCase())
        .eq('is_active', true)
        .single();

      if (fetchError || !data) {
        setCouponError('Cupom inválido ou expirado');
        setCoupon(null);
        return;
      }

      // Verificar validade
      const now = new Date();
      if (data.valid_from && new Date(data.valid_from) > now) {
        setCouponError('Este cupom ainda não está válido');
        setCoupon(null);
        return;
      }

      if (data.valid_until && new Date(data.valid_until) < now) {
        setCouponError('Este cupom expirou');
        setCoupon(null);
        return;
      }

      // Verificar limite de uso
      if (data.usage_limit && data.used_count >= data.usage_limit) {
        setCouponError('Este cupom atingiu o limite de uso');
        setCoupon(null);
        return;
      }

      // Verificar compra mínima
      const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
      if (data.min_purchase && subtotal < data.min_purchase) {
        setCouponError(`Compra mínima de €${data.min_purchase.toFixed(2)} necessária`);
        setCoupon(null);
        return;
      }

      setCoupon(data);
      setCouponError('');
      toast.success('Cupom aplicado com sucesso!');
    } catch (err) {
      setCouponError('Erro ao validar cupom');
      setCoupon(null);
    } finally {
      setCouponLoading(false);
    }
  };

  const removeCoupon = () => {
    setCoupon(null);
    setFormData(prev => ({ ...prev, couponCode: '' }));
    setCouponError('');
  };

  const totals = calculateCartTotals(items, formData.country, coupon);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.email) {
      setError('Email é obrigatório');
      toast.error('Email é obrigatório');
      return;
    }

    try {
      setLoading(true);
      toast.loading('Processando pagamento...');

      // Criar Payment Intent
      const { clientSecret, orderId } = await createPaymentIntent({
        amount: Math.round(totals.total * 100),
        currency: 'eur',
        orderData: {
          email: formData.email,
          country: formData.country,
          items: items.map(item => ({
            product_id: item.id,
            title: item.title,
            author: item.author,
            price: item.price,
            quantity: item.quantity,
          })),
          coupon_code: coupon?.code,
        },
      });

      // Redirecionar para Stripe Checkout
      const stripe = await stripePromise;
      if (!stripe) {
        throw new Error('Stripe não carregado');
      }

      const { error: stripeError } = await stripe.confirmPayment({
        clientSecret,
        confirmParams: {
          return_url: `${window.location.origin}/order-success/${orderId}`,
          payment_method_data: {
            billing_details: {
              email: formData.email,
            },
          },
        },
      });

      if (stripeError) {
        toast.dismiss();
        toast.error(stripeError.message || 'Erro ao processar pagamento');
        setError(stripeError.message || 'Erro ao processar pagamento');
      }
    } catch (err: any) {
      toast.dismiss();
      toast.error(err.message || 'Erro ao processar pagamento');
      setError(err.message || 'Erro ao processar pagamento');
    } finally {
      setLoading(false);
    }
  };

  const countries = [
    { code: 'LU', name: 'Luxemburgo', vat: 17 },
    { code: 'PT', name: 'Portugal', vat: 23 },
    { code: 'ES', name: 'Espanha', vat: 21 },
    { code: 'FR', name: 'França', vat: 20 },
    { code: 'DE', name: 'Alemanha', vat: 19 },
    { code: 'IT', name: 'Itália', vat: 22 },
    { code: 'BE', name: 'Bélgica', vat: 21 },
    { code: 'NL', name: 'Holanda', vat: 21 },
    { code: 'AT', name: 'Áustria', vat: 20 },
    { code: 'IE', name: 'Irlanda', vat: 23 },
    { code: 'GB', name: 'Reino Unido', vat: 20 },
    { code: 'US', name: 'Estados Unidos', vat: 0 },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FFF8E7] via-white to-[#A8E6CF]/20 py-8 sm:py-12 pt-16 sm:pt-20">
      <div className="max-w-6xl mx-auto px-4">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2" style={{ fontFamily: 'Playfair Display, serif' }}>
            Finalizar Compra
          </h1>
          <p className="text-sm sm:text-base text-gray-600">Complete seus dados para receber os ebooks</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
          {/* Formulário */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6 lg:p-8">
              {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email para receber os ebooks *
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4ECDC4] focus:border-transparent transition-all text-sm"
                    placeholder="seu@email.com"
                    disabled={!!user}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Os links de download serão enviados para este email
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    País *
                  </label>
                  <select
                    required
                    value={formData.country}
                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4ECDC4] focus:border-transparent transition-all text-sm cursor-pointer"
                  >
                    {countries.map(country => (
                      <option key={country.code} value={country.code}>
                        {country.name} (IVA {country.vat}%)
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cupom de Desconto
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={formData.couponCode}
                      onChange={(e) => setFormData({ ...formData, couponCode: e.target.value.toUpperCase() })}
                      className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4ECDC4] focus:border-transparent transition-all text-sm"
                      placeholder="Digite o código"
                      disabled={!!coupon}
                    />
                    {coupon ? (
                      <button
                        type="button"
                        onClick={removeCoupon}
                        className="px-4 sm:px-6 py-3 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 transition-colors whitespace-nowrap cursor-pointer text-sm"
                      >
                        Remover
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={applyCoupon}
                        disabled={couponLoading}
                        className="px-4 sm:px-6 py-3 bg-gray-800 text-white rounded-lg font-medium hover:bg-gray-900 transition-colors disabled:opacity-50 whitespace-nowrap cursor-pointer text-sm"
                      >
                        {couponLoading ? 'Validando...' : 'Aplicar'}
                      </button>
                    )}
                  </div>
                  {couponError && (
                    <p className="text-xs text-red-600 mt-1">{couponError}</p>
                  )}
                  {coupon && (
                    <p className="text-xs text-green-600 mt-1">
                      ✓ Cupom aplicado: {coupon.discount_type === 'percentage' ? `${coupon.discount_value}%` : `€${coupon.discount_value}`} de desconto
                    </p>
                  )}
                </div>

                <div className="border-t pt-6">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-[#4ECDC4] to-[#45B8B0] text-white py-3 sm:py-4 rounded-lg font-semibold text-base sm:text-lg hover:shadow-lg transform hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap cursor-pointer"
                  >
                    {loading ? (
                      <span className="flex items-center justify-center gap-2">
                        <i className="ri-loader-4-line animate-spin"></i>
                        Processando...
                      </span>
                    ) : (
                      `Pagar €${totals.total.toFixed(2)}`
                    )}
                  </button>
                  <div className="flex items-center justify-center gap-2 mt-4">
                    <i className="ri-lock-line text-gray-400 text-sm"></i>
                    <p className="text-xs text-gray-500 text-center">
                      Pagamento 100% seguro processado pelo Stripe
                    </p>
                  </div>
                </div>
              </form>
            </div>
          </div>

          {/* Resumo do Pedido */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6 lg:sticky lg:top-24">
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-4">Resumo do Pedido</h2>

              <div className="space-y-3 sm:space-y-4 mb-6 max-h-[300px] overflow-y-auto">
                {items.map((item) => (
                  <div key={item.id} className="flex gap-3">
                    <div className="w-12 h-16 sm:w-16 sm:h-20 bg-gray-100 rounded overflow-hidden flex-shrink-0">
                      <img
                        src={item.cover}
                        alt={item.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-xs sm:text-sm text-gray-900 line-clamp-2">
                        {item.title}
                      </h3>
                      <p className="text-xs text-gray-600">{item.author}</p>
                      <p className="text-sm font-medium text-gray-900 mt-1">
                        €{item.price.toFixed(2)} × {item.quantity}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-medium text-gray-900">€{totals.subtotal.toFixed(2)}</span>
                </div>

                {totals.discount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-green-600">Desconto</span>
                    <span className="font-medium text-green-600">-€{totals.discount.toFixed(2)}</span>
                  </div>
                )}

                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">IVA ({totals.vatRate}%)</span>
                  <span className="font-medium text-gray-900">€{totals.vat.toFixed(2)}</span>
                </div>

                <div className="border-t pt-2 flex justify-between">
                  <span className="font-bold text-gray-900">Total</span>
                  <span className="font-bold text-lg sm:text-xl text-[#4ECDC4]">€{totals.total.toFixed(2)}</span>
                </div>
              </div>

              <div className="mt-6 p-3 sm:p-4 bg-blue-50 rounded-lg">
                <div className="flex gap-2 text-xs sm:text-sm text-blue-800">
                  <i className="ri-information-line flex-shrink-0 mt-0.5"></i>
                  <p>
                    Após o pagamento, você receberá os links de download por email e poderá acessá-los na sua biblioteca.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
