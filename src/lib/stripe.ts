import { loadStripe, Stripe } from '@stripe/stripe-js';

let stripePromise: Promise<Stripe | null>;

export const getStripe = () => {
  if (!stripePromise) {
    const key = import.meta.env.VITE_PUBLIC_STRIPE_PUBLISHABLE_KEY;
    if (!key) {
      console.error('Chave pública do Stripe não configurada');
      return null;
    }
    stripePromise = loadStripe(key);
  }
  return stripePromise;
};

// Tipos para pagamento
export interface PaymentIntentRequest {
  amount: number;
  currency: string;
  orderData: {
    email: string;
    country: string;
    items: Array<{
      product_id: string;
      title: string;
      author: string;
      price: number;
      quantity: number;
    }>;
    coupon_code?: string;
  };
}

export interface PaymentIntentResponse {
  clientSecret: string;
  orderId: string;
  orderNumber: string;
}

// Criar Payment Intent via Edge Function
export const createPaymentIntent = async (
  data: PaymentIntentRequest
): Promise<PaymentIntentResponse> => {
  const supabaseUrl = import.meta.env.VITE_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.VITE_PUBLIC_SUPABASE_ANON_KEY;

  const response = await fetch(`${supabaseUrl}/functions/v1/create-payment`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${supabaseAnonKey}`,
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Erro ao criar pagamento');
  }

  return response.json();
};

// Calcular IVA por país
export const getVATRate = (country: string): number => {
  const vatRates: Record<string, number> = {
    'LU': 17, // Luxemburgo
    'PT': 23, // Portugal
    'ES': 21, // Espanha
    'FR': 20, // França
    'DE': 19, // Alemanha
    'IT': 22, // Itália
    'BE': 21, // Bélgica
    'NL': 21, // Holanda
    'AT': 20, // Áustria
    'IE': 23, // Irlanda
    'GB': 20, // Reino Unido
    'US': 0,  // Estados Unidos (sem IVA)
  };

  return vatRates[country] || 0;
};

// Calcular totais do carrinho
export interface CartCalculation {
  subtotal: number;
  discount: number;
  vat: number;
  vatRate: number;
  total: number;
}

export const calculateCartTotals = (
  items: Array<{ price: number; quantity: number }>,
  country: string,
  coupon?: { discount_type: 'percentage' | 'fixed'; discount_value: number; max_discount?: number }
): CartCalculation => {
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  
  let discount = 0;
  if (coupon) {
    if (coupon.discount_type === 'percentage') {
      discount = subtotal * (coupon.discount_value / 100);
      if (coupon.max_discount) {
        discount = Math.min(discount, coupon.max_discount);
      }
    } else {
      discount = coupon.discount_value;
    }
  }

  const subtotalAfterDiscount = subtotal - discount;
  const vatRate = getVATRate(country);
  const vat = subtotalAfterDiscount * (vatRate / 100);
  const total = subtotalAfterDiscount + vat;

  return {
    subtotal,
    discount,
    vat,
    vatRate,
    total,
  };
};
