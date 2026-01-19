import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export function useCategories() {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCategories();

    // Subscrição em tempo real
    const subscription = supabase
      .channel('categories_changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'categories' },
        () => {
          loadCategories();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const loadCategories = async () => {
    try {
      // Cache no localStorage
      const cached = localStorage.getItem('categories_cache');
      const cacheTime = localStorage.getItem('categories_cache_time');
      
      if (cached && cacheTime) {
        const age = Date.now() - parseInt(cacheTime);
        if (age < 300000) { // Cache válido por 5 minutos
          setCategories(JSON.parse(cached));
          setLoading(false);
          return;
        }
      }

      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name');

      if (error) throw error;

      setCategories(data || []);
      
      // Salvar no cache
      localStorage.setItem('categories_cache', JSON.stringify(data || []));
      localStorage.setItem('categories_cache_time', Date.now().toString());
    } catch (error) {
      console.error('Erro ao carregar categorias:', error);
    } finally {
      setLoading(false);
    }
  };

  return { categories, loading, refresh: loadCategories };
}
