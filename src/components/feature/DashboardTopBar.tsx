import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';

export default function DashboardTopBar() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showSiteMenu, setShowSiteMenu] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      setUser(currentUser);

      if (currentUser) {
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', currentUser.id)
          .single();
        
        setUserProfile(profile);
      }
    };

    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setUser(session?.user || null);
      
      if (session?.user) {
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();
        
        setUserProfile(profile);
      } else {
        setUserProfile(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleLogout = async () => {
    if (isLoggingOut) return;
    
    setIsLoggingOut(true);
    
    try {
      const { error } = await supabase.auth.signOut();
      
      if (error) throw error;
      
      toast.success('Logout realizado com sucesso!');
      navigate('/');
    } catch (error: any) {
      console.error('Erro ao fazer logout:', error);
      toast.error('Erro ao fazer logout. Tente novamente.');
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <div className="fixed top-0 left-64 right-0 h-16 bg-white border-b border-gray-200 z-40 flex items-center justify-between px-8">
      {/* Logo e Título */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-gradient-to-br from-[#FF6B6B] to-[#4ECDC4] rounded-lg flex items-center justify-center">
          <i className="ri-dashboard-line text-white text-lg"></i>
        </div>
        <div>
          <h1 className="text-lg font-bold text-gray-900">Dashboard Pessoal</h1>
          <p className="text-xs text-gray-500">Painel de Controle</p>
        </div>
      </div>

      {/* Ações */}
      <div className="flex items-center gap-3">
        {/* Menu do Site */}
        <div className="relative">
          <button
            onClick={() => setShowSiteMenu(!showSiteMenu)}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors cursor-pointer whitespace-nowrap"
          >
            <i className="ri-global-line"></i>
            <span className="text-sm font-medium">Ir para o Site</span>
            <i className="ri-arrow-down-s-line"></i>
          </button>

          {showSiteMenu && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowSiteMenu(false)}
              />
              <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-50">
                <Link
                  to="/"
                  onClick={() => setShowSiteMenu(false)}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  <i className="ri-home-line text-gray-600"></i>
                  <span className="text-sm text-gray-700">Início</span>
                </Link>
                <Link
                  to="/catalog"
                  onClick={() => setShowSiteMenu(false)}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  <i className="ri-book-line text-gray-600"></i>
                  <span className="text-sm text-gray-700">Catálogo</span>
                </Link>
                <Link
                  to="/about"
                  onClick={() => setShowSiteMenu(false)}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  <i className="ri-information-line text-gray-600"></i>
                  <span className="text-sm text-gray-700">Sobre</span>
                </Link>
                <Link
                  to="/contact"
                  onClick={() => setShowSiteMenu(false)}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  <i className="ri-mail-line text-gray-600"></i>
                  <span className="text-sm text-gray-700">Contato</span>
                </Link>
                <Link
                  to="/my-library"
                  onClick={() => setShowSiteMenu(false)}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  <i className="ri-book-2-line text-gray-600"></i>
                  <span className="text-sm text-gray-700">Minha Biblioteca</span>
                </Link>
              </div>
            </>
          )}
        </div>

        {/* Menu do Usuário */}
        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
          >
            <div className="w-8 h-8 bg-gradient-to-br from-[#FF6B6B] to-[#4ECDC4] rounded-full flex items-center justify-center">
              <i className="ri-user-line text-white text-sm"></i>
            </div>
            <span className="text-sm font-medium text-gray-700">
              {userProfile?.full_name || user?.email?.split('@')[0]}
            </span>
            <i className="ri-arrow-down-s-line text-gray-600"></i>
          </button>

          {showUserMenu && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowUserMenu(false)}
              />
              <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-50">
                <Link
                  to="/profile"
                  onClick={() => setShowUserMenu(false)}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  <i className="ri-user-settings-line text-gray-600"></i>
                  <span className="text-sm text-gray-700">Perfil</span>
                </Link>
                
                <div className="border-t border-gray-100 my-2"></div>
                <button
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors w-full text-left cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <i className={`${isLoggingOut ? 'ri-loader-4-line animate-spin' : 'ri-logout-box-line'} text-red-600`}></i>
                  <span className="text-sm text-red-600">{isLoggingOut ? 'Saindo...' : 'Sair'}</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
