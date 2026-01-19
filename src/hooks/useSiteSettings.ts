import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface SiteSetting {
  id: string;
  section: string;
  key: string;
  value: string;
  type: string;
}

export function useSiteSettings(section?: string) {
  const [settings, setSettings] = useState<SiteSetting[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSettings();
  }, [section]);

  const fetchSettings = async () => {
    try {
      let query = supabase.from('site_settings').select('*');
      
      if (section) {
        query = query.eq('section', section);
      }

      const { data, error } = await query;

      if (error) throw error;
      setSettings(data || []);
    } catch (error) {
      console.error('Erro ao buscar configurações:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSetting = (key: string, defaultValue: string = '') => {
    const setting = settings.find(s => s.key === key);
    return setting?.value || defaultValue;
  };

  const updateSetting = async (key: string, value: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) throw new Error('Usuário não autenticado');

      const setting = settings.find(s => s.key === key);

      if (setting) {
        const { error } = await supabase
          .from('site_settings')
          .update({ value, updated_at: new Date().toISOString(), updated_by: user.id })
          .eq('id', setting.id);

        if (error) throw error;
      } else if (section) {
        const { error } = await supabase
          .from('site_settings')
          .insert([{ section, key, value, updated_by: user.id }]);

        if (error) throw error;
      }

      await fetchSettings();
      return true;
    } catch (error) {
      console.error('Erro ao atualizar configuração:', error);
      return false;
    }
  };

  return { settings, loading, getSetting, updateSetting, refetch: fetchSettings };
}