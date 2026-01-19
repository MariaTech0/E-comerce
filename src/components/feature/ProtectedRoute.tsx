import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

export default function ProtectedRoute({ children, requireAdmin = false }: ProtectedRouteProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    checkAuth();
  }, [location.pathname]);

  const checkAuth = async () => {
    try {
      // 1. Verificar se está autenticado
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast.error('Você precisa fazer login para acessar esta área');
        navigate('/login?redirect=' + location.pathname, { replace: true });
        return;
      }

      // 2. Se não requer admin, está autorizado
      if (!requireAdmin) {
        setAuthorized(true);
        setLoading(false);
        return;
      }

      // 3. Verificar se é admin
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('role, force_password_change')
        .eq('id', session.user.id)
        .single();

      if (profileError || !profile) {
        console.error('Erro ao buscar perfil:', profileError);
        toast.error('Perfil não encontrado');
        navigate('/login', { replace: true });
        return;
      }

      // 4. Verificar se tem permissão de admin
      const isAdmin = ['superadmin', 'editor', 'support'].includes(profile.role);
      
      if (!isAdmin) {
        toast.error('Acesso negado. Apenas administradores podem acessar esta área.');
        navigate('/', { replace: true });
        return;
      }

      // 5. Verificar se precisa trocar senha (exceto na página de trocar senha)
      if (profile.force_password_change && !location.pathname.includes('change-password')) {
        toast.error('Você precisa alterar sua senha antes de continuar');
        navigate('/admin/change-password', { replace: true });
        return;
      }

      // 6. Tudo OK, autorizar acesso
      setAuthorized(true);
      setLoading(false);

    } catch (error) {
      console.error('Erro ao verificar autenticação:', error);
      toast.error('Erro ao verificar permissões');
      navigate('/login', { replace: true });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <i className="ri-loader-4-line text-4xl text-teal-600 animate-spin mb-4"></i>
          <p className="text-gray-600">Verificando permissões...</p>
        </div>
      </div>
    );
  }

  if (!authorized) {
    return null;
  }

  return <>{children}</>;
}
