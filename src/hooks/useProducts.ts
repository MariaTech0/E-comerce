import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export function useProducts() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProducts();

    // Subscrição em tempo real para atualizações automáticas
    const subscription = supabase
      .channel('products_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'products' },
        () => {
          loadProducts();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const loadProducts = async () => {
    try {
      // Cache no localStorage para carregamento instantâneo
      const cached = localStorage.getItem('products_cache');
      const cacheTime = localStorage.getItem('products_cache_time');
      
      if (cached && cacheTime) {
        const age = Date.now() - parseInt(cacheTime);
        if (age < 60000) { // Cache válido por 1 minuto
          setProducts(JSON.parse(cached));
          setLoading(false);
          return;
        }
      }

      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setProducts(data || []);
      
      // Salvar no cache
      localStorage.setItem('products_cache', JSON.stringify(data || []));
      localStorage.setItem('products_cache_time', Date.now().toString());
    } catch (error) {
      console.error('Erro ao carregar produtos:', error);
    } finally {
      setLoading(false);
    }
  };

  return { products, loading, refresh: loadProducts };
}
