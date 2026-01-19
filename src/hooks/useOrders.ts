import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export function useOrders(userId?: string) {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userId) {
      loadOrders();

      // Subscrição em tempo real
      const subscription = supabase
        .channel('orders_changes')
        .on('postgres_changes',
          { event: '*', schema: 'public', table: 'orders', filter: `user_id=eq.${userId}` },
          () => {
            loadOrders();
          }
        )
        .subscribe();

      return () => {
        subscription.unsubscribe();
      };
    }
  }, [userId]);

  const loadOrders = async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      // Cache no localStorage
      const cacheKey = `orders_cache_${userId}`;
      const cacheTimeKey = `orders_cache_time_${userId}`;
      const cached = localStorage.getItem(cacheKey);
      const cacheTime = localStorage.getItem(cacheTimeKey);
      
      if (cached && cacheTime) {
        const age = Date.now() - parseInt(cacheTime);
        if (age < 30000) { // Cache válido por 30 segundos
          setOrders(JSON.parse(cached));
          setLoading(false);
          return;
        }
      }

      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            *,
            products (*)
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setOrders(data || []);
      
      // Salvar no cache
      localStorage.setItem(cacheKey, JSON.stringify(data || []));
      localStorage.setItem(cacheTimeKey, Date.now().toString());
    } catch (error) {
      console.error('Erro ao carregar pedidos:', error);
    } finally {
      setLoading(false);
    }
  };

  return { orders, loading, refresh: loadOrders };
}
