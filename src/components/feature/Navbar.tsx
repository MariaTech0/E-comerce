import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCartStore } from '../../store/cartStore';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';

export default function Navbar() {
  const { items, toggleCart } = useCartStore();
  const [isScrolled, setIsScrolled] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      setUser(currentUser);

      if (currentUser) {
        // Buscar perfil do usuário
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
    if (isLoggingOut) return; // Prevenir múltiplos cliques
    
    setIsLoggingOut(true);
    
    try {
      const { error } = await supabase.auth.signOut();
      
      if (error) throw error;
      
      // Limpar estados
      setUser(null);
      setUserProfile(null);
      setShowUserMenu(false);
      setShowMobileMenu(false);
      setIsUserMenuOpen(false);
      setIsMobileMenuOpen(false);
      
      toast.success('Logout realizado com sucesso!');
      
      // Redirecionar para home
      navigate('/');
    } catch (error: any) {
      console.error('Erro ao fazer logout:', error);
      toast.error('Erro ao fazer logout. Tente novamente.');
    } finally {
      setIsLoggingOut(false);
    }
  };

  // Verificar se é admin (superadmin, editor ou support)
  const isAdmin = userProfile && ['superadmin', 'editor', 'support'].includes(userProfile.role);

  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled ? 'bg-white shadow-lg' : 'bg-white/95 backdrop-blur-md shadow-md'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 py-3 sm:py-4">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 sm:gap-3 cursor-pointer group">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-[#FF6B6B] via-[#FF8E53] to-[#4ECDC4] rounded-lg flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
              <i className="ri-book-open-line text-white text-lg sm:text-xl"></i>
            </div>
            <span className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-[#FF6B6B] to-[#4ECDC4] bg-clip-text text-transparent">
              BookStore
            </span>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-8">
            <Link
              to="/"
              className="text-gray-800 hover:text-[#FF6B6B] font-semibold transition-colors duration-300 relative group"
            >
              Início
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-[#FF6B6B] to-[#4ECDC4] group-hover:w-full transition-all duration-300"></span>
            </Link>
            <Link
              to="/catalog"
              className="text-gray-800 hover:text-[#FF6B6B] font-semibold transition-colors duration-300 relative group"
            >
              Catálogo
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-[#FF6B6B] to-[#4ECDC4] group-hover:w-full transition-all duration-300"></span>
            </Link>
            <Link
              to="/about"
              className="text-gray-800 hover:text-[#FF6B6B] font-semibold transition-colors duration-300 relative group"
            >
              Sobre
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-[#FF6B6B] to-[#4ECDC4] group-hover:w-full transition-all duration-300"></span>
            </Link>
            <Link
              to="/contact"
              className="text-gray-800 hover:text-[#FF6B6B] font-semibold transition-colors duration-300 relative group"
            >
              Contato
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-[#FF6B6B] to-[#4ECDC4] group-hover:w-full transition-all duration-300"></span>
            </Link>
            {user && (
              <Link
                to="/my-library"
                className="text-gray-800 hover:text-[#FF6B6B] font-semibold transition-colors duration-300 relative group"
              >
                Minha Biblioteca
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-[#FF6B6B] to-[#4ECDC4] group-hover:w-full transition-all duration-300"></span>
              </Link>
            )}
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center gap-3 sm:gap-4">
            {/* Cart Button */}
            <button
              onClick={() => setIsCartOpen(true)}
              className="relative p-2 sm:p-2.5 hover:bg-gray-100 rounded-full transition-all duration-300 group cursor-pointer"
            >
              <i className="ri-shopping-cart-line text-xl sm:text-2xl text-gray-800 group-hover:text-[#FF6B6B] transition-colors duration-300"></i>
              {itemCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-gradient-to-r from-[#FF6B6B] to-[#FF8E53] text-white text-xs font-bold rounded-full w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center shadow-lg animate-pulse">
                  {itemCount}
                </span>
              )}
            </button>

            {/* User Menu */}
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center gap-2 p-2 sm:p-2.5 hover:bg-gray-100 rounded-full transition-all duration-300 group cursor-pointer"
                >
                  <div className="w-8 h-8 sm:w-9 sm:h-9 bg-gradient-to-br from-[#FF6B6B] to-[#4ECDC4] rounded-full flex items-center justify-center shadow-lg">
                    <span className="text-white font-bold text-sm sm:text-base">
                      {userProfile?.full_name?.charAt(0).toUpperCase() || 'U'}
                    </span>
                  </div>
                  <span className="hidden sm:block text-gray-800 font-semibold max-w-[120px] truncate group-hover:text-[#FF6B6B] transition-colors duration-300">
                    {userProfile?.full_name || 'Usuário'}
                  </span>
                  <i className={`ri-arrow-down-s-line text-gray-800 transition-transform duration-300 ${isUserMenuOpen ? 'rotate-180' : ''}`}></i>
                </button>

                {/* User Dropdown */}
                {isUserMenuOpen && (
                  <>
                    <div 
                      className="fixed inset-0 z-40" 
                      onClick={() => setIsUserMenuOpen(false)}
                    />
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-2xl py-2 border border-gray-100 z-50">
                      <div className="px-4 py-3 border-b border-gray-100">
                        <p className="text-sm font-semibold text-gray-800">{userProfile?.full_name}</p>
                        <p className="text-xs text-gray-500 truncate">{user.email}</p>
                      </div>
                      <Link
                        to="/profile"
                        className="flex items-center gap-3 px-4 py-2.5 text-gray-700 hover:bg-gradient-to-r hover:from-[#FF6B6B]/10 hover:to-[#4ECDC4]/10 hover:text-[#FF6B6B] transition-all duration-300 font-medium cursor-pointer"
                        onClick={() => setIsUserMenuOpen(false)}
                      >
                        <i className="ri-user-line text-lg"></i>
                        Meu Perfil
                      </Link>
                      <Link
                        to="/my-library"
                        className="flex items-center gap-3 px-4 py-2.5 text-gray-700 hover:bg-gradient-to-r hover:from-[#FF6B6B]/10 hover:to-[#4ECDC4]/10 hover:text-[#FF6B6B] transition-all duration-300 font-medium cursor-pointer"
                        onClick={() => setIsUserMenuOpen(false)}
                      >
                        <i className="ri-book-line text-lg"></i>
                        Minha Biblioteca
                      </Link>
                      {isAdmin && (
                        <Link
                          to="/dashboard"
                          className="flex items-center gap-3 px-4 py-2.5 text-gray-700 hover:bg-gradient-to-r hover:from-[#FF6B6B]/10 hover:to-[#4ECDC4]/10 hover:text-[#FF6B6B] transition-all duration-300 font-medium cursor-pointer"
                          onClick={() => setIsUserMenuOpen(false)}
                        >
                          <i className="ri-dashboard-line text-lg"></i>
                          Dashboard Admin
                        </Link>
                      )}
                      <button
                        onClick={handleLogout}
                        disabled={isLoggingOut}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-red-600 hover:bg-red-50 transition-all duration-300 font-medium cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <i className={`${isLoggingOut ? 'ri-loader-4-line animate-spin' : 'ri-logout-box-line'} text-lg`}></i>
                        {isLoggingOut ? 'Saindo...' : 'Sair'}
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="hidden sm:flex items-center gap-2">
                <Link
                  to="/login"
                  className="px-4 py-2 text-gray-800 hover:text-[#FF6B6B] font-semibold transition-colors duration-300 cursor-pointer whitespace-nowrap"
                >
                  Entrar
                </Link>
                <Link
                  to="/register"
                  className="px-5 py-2.5 bg-gradient-to-r from-[#FF6B6B] to-[#4ECDC4] text-white font-semibold rounded-full hover:shadow-lg hover:scale-105 transition-all duration-300 cursor-pointer whitespace-nowrap"
                >
                  Criar Conta
                </Link>
              </div>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 hover:bg-gray-100 rounded-lg transition-all duration-300 cursor-pointer"
            >
              <i className={`${isMobileMenuOpen ? 'ri-close-line' : 'ri-menu-line'} text-2xl text-gray-800`}></i>
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden mt-4 pb-4 border-t border-gray-100 pt-4 space-y-2">
            <Link
              to="/"
              className="block px-4 py-2.5 text-gray-800 hover:bg-gradient-to-r hover:from-[#FF6B6B]/10 hover:to-[#4ECDC4]/10 hover:text-[#FF6B6B] rounded-lg transition-all duration-300 font-semibold cursor-pointer"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Início
            </Link>
            <Link
              to="/catalog"
              className="block px-4 py-2.5 text-gray-800 hover:bg-gradient-to-r hover:from-[#FF6B6B]/10 hover:to-[#4ECDC4]/10 hover:text-[#FF6B6B] rounded-lg transition-all duration-300 font-semibold cursor-pointer"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Catálogo
            </Link>
            <Link
              to="/about"
              className="block px-4 py-2.5 text-gray-800 hover:bg-gradient-to-r hover:from-[#FF6B6B]/10 hover:to-[#4ECDC4]/10 hover:text-[#FF6B6B] rounded-lg transition-all duration-300 font-semibold cursor-pointer"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Sobre
            </Link>
            <Link
              to="/contact"
              className="block px-4 py-2.5 text-gray-800 hover:bg-gradient-to-r hover:from-[#FF6B6B]/10 hover:to-[#4ECDC4]/10 hover:text-[#FF6B6B] rounded-lg transition-all duration-300 font-semibold cursor-pointer"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Contato
            </Link>
            {user && (
              <Link
                to="/my-library"
                className="block px-4 py-2.5 text-gray-800 hover:bg-gradient-to-r hover:from-[#FF6B6B]/10 hover:to-[#4ECDC4]/10 hover:text-[#FF6B6B] rounded-lg transition-all duration-300 font-semibold cursor-pointer"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Minha Biblioteca
              </Link>
            )}
            {user && (
              <Link
                to="/profile"
                className="block px-4 py-2.5 text-gray-800 hover:bg-gradient-to-r hover:from-[#FF6B6B]/10 hover:to-[#4ECDC4]/10 hover:text-[#FF6B6B] rounded-lg transition-all duration-300 font-semibold cursor-pointer"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Meu Perfil
              </Link>
            )}
            {isAdmin && (
              <Link
                to="/dashboard"
                className="block px-4 py-2.5 text-gray-800 hover:bg-gradient-to-r hover:from-[#FF6B6B]/10 hover:to-[#4ECDC4]/10 hover:text-[#FF6B6B] rounded-lg transition-all duration-300 font-semibold cursor-pointer"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Dashboard Admin
              </Link>
            )}
            {!user && (
              <>
                <Link
                  to="/login"
                  className="block px-4 py-2.5 text-gray-800 hover:bg-gradient-to-r hover:from-[#FF6B6B]/10 hover:to-[#4ECDC4]/10 hover:text-[#FF6B6B] rounded-lg transition-all duration-300 font-semibold cursor-pointer"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Entrar
                </Link>
                <Link
                  to="/register"
                  className="block px-4 py-2.5 bg-gradient-to-r from-[#FF6B6B] to-[#4ECDC4] text-white rounded-lg hover:shadow-lg transition-all duration-300 font-semibold text-center cursor-pointer"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Criar Conta
                </Link>
              </>
            )}
            {user && (
              <button
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="w-full text-left px-4 py-2.5 text-red-600 hover:bg-red-50 rounded-lg transition-all duration-300 font-semibold cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <i className={`${isLoggingOut ? 'ri-loader-4-line animate-spin' : 'ri-logout-box-line'} mr-2`}></i>
                {isLoggingOut ? 'Saindo...' : 'Sair'}
              </button>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
