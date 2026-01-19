import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';

interface UserProfile {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  postal_code: string;
  country: string;
  role: string;
}

type TabType = 'profile' | 'orders' | 'favorites' | 'settings';

export default function ProfilePage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<UserProfile>({
    id: '',
    full_name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    postal_code: '',
    country: 'Portugal',
    role: 'customer',
  });

  // Abas
  const [activeTab, setActiveTab] = useState<TabType>('profile');

  // Estados para alteração de senha
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Estados para alteração de email
  const [showEmailChange, setShowEmailChange] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [emailPassword, setEmailPassword] = useState('');

  // Dark Mode
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('profile-dark-mode');
    return saved ? JSON.parse(saved) : false;
  });

  // Pedidos
  const [orders, setOrders] = useState<any[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  // Favoritos
  const [favorites, setFavorites] = useState<any[]>([]);
  const [loadingFavorites, setLoadingFavorites] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  // Salvar preferência de Dark Mode
  useEffect(() => {
    localStorage.setItem('profile-dark-mode', JSON.stringify(darkMode));
  }, [darkMode]);

  // Carregar dados quando mudar de aba
  useEffect(() => {
    if (activeTab === 'orders' && user) {
      loadOrders();
    } else if (activeTab === 'favorites' && user) {
      loadFavorites();
    }
  }, [activeTab, user]);

  const checkAuth = async () => {
    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      
      if (!currentUser) {
        toast.error('Você precisa fazer login para acessar esta página');
        navigate('/login');
        return;
      }

      setUser(currentUser);

      // Buscar perfil
      const { data: profileData, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', currentUser.id)
        .single();

      if (error) {
        console.error('Erro ao buscar perfil:', error);
      } else if (profileData) {
        setProfile({
          ...profileData,
          email: currentUser.email || '',
        });
      }
    } catch (error) {
      console.error('Erro ao verificar autenticação:', error);
      navigate('/login');
    } finally {
      setLoading(false);
    }
  };

  const loadOrders = async () => {
    setLoadingOrders(true);
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            *,
            products (title, cover_url)
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error('Erro ao carregar pedidos:', error);
      toast.error('Erro ao carregar pedidos');
    } finally {
      setLoadingOrders(false);
    }
  };

  const loadFavorites = async () => {
    setLoadingFavorites(true);
    try {
      const { data, error } = await supabase
        .from('user_favorites')
        .select(`
          *,
          products (*)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setFavorites(data || []);
    } catch (error) {
      console.error('Erro ao carregar favoritos:', error);
      toast.error('Erro ao carregar favoritos');
    } finally {
      setLoadingFavorites(false);
    }
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({
          full_name: profile.full_name,
          phone: profile.phone,
          address: profile.address,
          city: profile.city,
          postal_code: profile.postal_code,
          country: profile.country,
        })
        .eq('id', profile.id);

      if (error) throw error;

      toast.success('Perfil atualizado com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar perfil:', error);
      toast.error('Erro ao salvar perfil');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      toast.error('As senhas não coincidem');
      return;
    }

    if (newPassword.length < 8) {
      toast.error('A senha deve ter pelo menos 8 caracteres');
      return;
    }

    try {
      // Verificar senha atual fazendo login
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword,
      });

      if (signInError) {
        toast.error('Senha atual incorreta');
        return;
      }

      // Atualizar senha
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;

      toast.success('Senha alterada com sucesso!');
      setShowPasswordChange(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      console.error('Erro ao alterar senha:', error);
      toast.error('Erro ao alterar senha');
    }
  };

  const handleChangeEmail = async () => {
    if (!newEmail || !emailPassword) {
      toast.error('Preencha todos os campos');
      return;
    }

    try {
      // Verificar senha
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: emailPassword,
      });

      if (signInError) {
        toast.error('Senha incorreta');
        return;
      }

      // Atualizar email
      const { error } = await supabase.auth.updateUser({
        email: newEmail,
      });

      if (error) throw error;

      toast.success('Email de confirmação enviado! Verifique sua caixa de entrada.');
      setShowEmailChange(false);
      setNewEmail('');
      setEmailPassword('');
    } catch (error) {
      console.error('Erro ao alterar email:', error);
      toast.error('Erro ao alterar email');
    }
  };

  const handleRemoveFavorite = async (favoriteId: string) => {
    try {
      const { error } = await supabase
        .from('user_favorites')
        .delete()
        .eq('id', favoriteId);

      if (error) throw error;

      toast.success('Removido dos favoritos!');
      loadFavorites();
    } catch (error) {
      console.error('Erro ao remover favorito:', error);
      toast.error('Erro ao remover favorito');
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success('Logout realizado com sucesso!');
    navigate('/');
  };

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center pt-20 transition-colors duration-500 ${
        darkMode ? 'bg-gray-900' : 'bg-gray-50'
      }`}>
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#4ECDC4] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className={darkMode ? 'text-gray-300' : 'text-gray-600'}>Carregando perfil...</p>
        </div>
      </div>
    );
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'profile':
        return (
          <div className="space-y-6">
            {/* Informações Pessoais */}
            <div className={`rounded-xl border p-6 transition-colors duration-500 ${
              darkMode 
                ? 'bg-gray-800 border-gray-700' 
                : 'bg-white border-gray-200'
            }`}>
              <div className="flex items-center gap-4 mb-6">
                <div className="w-20 h-20 bg-gradient-to-br from-[#FF6B6B] to-[#4ECDC4] rounded-full flex items-center justify-center">
                  <i className="ri-user-line text-white text-3xl"></i>
                </div>
                <div>
                  <h2 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    {profile.full_name || 'Sem nome'}
                  </h2>
                  <p className={darkMode ? 'text-gray-400' : 'text-gray-600'}>{profile.email}</p>
                  {profile.role !== 'customer' && (
                    <span className="inline-block mt-1 px-3 py-1 bg-[#4ECDC4] text-white text-xs font-medium rounded-full">
                      {profile.role === 'superadmin' ? 'Super Admin' : profile.role === 'editor' ? 'Editor' : 'Suporte'}
                    </span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Nome Completo
                  </label>
                  <input
                    type="text"
                    value={profile.full_name}
                    onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#4ECDC4] focus:border-transparent transition-colors duration-500 ${
                      darkMode 
                        ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                    placeholder="Seu nome completo"
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Telefone
                  </label>
                  <input
                    type="tel"
                    value={profile.phone}
                    onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#4ECDC4] focus:border-transparent transition-colors duration-500 ${
                      darkMode 
                        ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                    placeholder="+351 123 456 789"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Endereço
                  </label>
                  <input
                    type="text"
                    value={profile.address}
                    onChange={(e) => setProfile({ ...profile, address: e.target.value })}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#4ECDC4] focus:border-transparent transition-colors duration-500 ${
                      darkMode 
                        ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                    placeholder="Rua, número, complemento"
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Cidade
                  </label>
                  <input
                    type="text"
                    value={profile.city}
                    onChange={(e) => setProfile({ ...profile, city: e.target.value })}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#4ECDC4] focus:border-transparent transition-colors duration-500 ${
                      darkMode 
                        ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                    placeholder="Lisboa"
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Código Postal
                  </label>
                  <input
                    type="text"
                    value={profile.postal_code}
                    onChange={(e) => setProfile({ ...profile, postal_code: e.target.value })}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#4ECDC4] focus:border-transparent transition-colors duration-500 ${
                      darkMode 
                        ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                    placeholder="1000-001"
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    País
                  </label>
                  <select
                    value={profile.country}
                    onChange={(e) => setProfile({ ...profile, country: e.target.value })}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#4ECDC4] focus:border-transparent transition-colors duration-500 ${
                      darkMode 
                        ? 'bg-gray-700 border-gray-600 text-white' 
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  >
                    <option value="Portugal">Portugal</option>
                    <option value="Brasil">Brasil</option>
                    <option value="Angola">Angola</option>
                    <option value="Moçambique">Moçambique</option>
                    <option value="Outro">Outro</option>
                  </select>
                </div>
              </div>

              <button
                onClick={handleSaveProfile}
                disabled={saving}
                className="mt-6 px-6 py-3 bg-[#4ECDC4] text-white rounded-lg font-medium hover:bg-[#4ECDC4]/90 transition-colors cursor-pointer whitespace-nowrap disabled:opacity-50"
              >
                {saving ? 'Salvando...' : 'Salvar Alterações'}
              </button>
            </div>

            {/* Segurança */}
            <div className={`rounded-xl border p-6 transition-colors duration-500 ${
              darkMode 
                ? 'bg-gray-800 border-gray-700' 
                : 'bg-white border-gray-200'
            }`}>
              <h3 className={`text-lg font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                Segurança da Conta
              </h3>

              {/* Alterar Email */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>Email</p>
                    <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{profile.email}</p>
                  </div>
                  <button
                    onClick={() => setShowEmailChange(!showEmailChange)}
                    className="px-4 py-2 text-[#4ECDC4] border border-[#4ECDC4] rounded-lg hover:bg-[#4ECDC4]/10 transition-colors cursor-pointer whitespace-nowrap"
                  >
                    Alterar Email
                  </button>
                </div>

                {showEmailChange && (
                  <div className={`rounded-lg p-4 space-y-3 ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                    <input
                      type="email"
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      placeholder="Novo email"
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#4ECDC4] focus:border-transparent ${
                        darkMode 
                          ? 'bg-gray-600 border-gray-500 text-white placeholder-gray-400' 
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                    />
                    <input
                      type="password"
                      value={emailPassword}
                      onChange={(e) => setEmailPassword(e.target.value)}
                      placeholder="Senha atual para confirmar"
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#4ECDC4] focus:border-transparent ${
                        darkMode 
                          ? 'bg-gray-600 border-gray-500 text-white placeholder-gray-400' 
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={handleChangeEmail}
                        className="px-4 py-2 bg-[#4ECDC4] text-white rounded-lg hover:bg-[#4ECDC4]/90 transition-colors cursor-pointer whitespace-nowrap"
                      >
                        Confirmar
                      </button>
                      <button
                        onClick={() => {
                          setShowEmailChange(false);
                          setNewEmail('');
                          setEmailPassword('');
                        }}
                        className={`px-4 py-2 rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
                          darkMode 
                            ? 'bg-gray-600 text-gray-200 hover:bg-gray-500' 
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Alterar Senha */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>Senha</p>
                    <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>••••••••</p>
                  </div>
                  <button
                    onClick={() => setShowPasswordChange(!showPasswordChange)}
                    className="px-4 py-2 text-[#4ECDC4] border border-[#4ECDC4] rounded-lg hover:bg-[#4ECDC4]/10 transition-colors cursor-pointer whitespace-nowrap"
                  >
                    Alterar Senha
                  </button>
                </div>

                {showPasswordChange && (
                  <div className={`rounded-lg p-4 space-y-3 ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                    <input
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Senha atual"
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#4ECDC4] focus:border-transparent ${
                        darkMode 
                          ? 'bg-gray-600 border-gray-500 text-white placeholder-gray-400' 
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                    />
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Nova senha (mínimo 8 caracteres)"
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#4ECDC4] focus:border-transparent ${
                        darkMode 
                          ? 'bg-gray-600 border-gray-500 text-white placeholder-gray-400' 
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                    />
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirmar nova senha"
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#4ECDC4] focus:border-transparent ${
                        darkMode 
                          ? 'bg-gray-600 border-gray-500 text-white placeholder-gray-400' 
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={handleChangePassword}
                        className="px-4 py-2 bg-[#4ECDC4] text-white rounded-lg hover:bg-[#4ECDC4]/90 transition-colors cursor-pointer whitespace-nowrap"
                      >
                        Confirmar
                      </button>
                      <button
                        onClick={() => {
                          setShowPasswordChange(false);
                          setCurrentPassword('');
                          setNewPassword('');
                          setConfirmPassword('');
                        }}
                        className={`px-4 py-2 rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
                          darkMode 
                            ? 'bg-gray-600 text-gray-200 hover:bg-gray-500' 
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        );

      case 'orders':
        return (
          <div className="space-y-6">
            {loadingOrders ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 border-4 border-[#4ECDC4] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className={darkMode ? 'text-gray-300' : 'text-gray-600'}>Carregando pedidos...</p>
              </div>
            ) : orders.length === 0 ? (
              <div className={`rounded-xl border p-12 text-center transition-colors duration-500 ${
                darkMode 
                  ? 'bg-gray-800 border-gray-700' 
                  : 'bg-white border-gray-200'
              }`}>
                <i className="ri-shopping-bag-line text-6xl text-gray-300 mb-4"></i>
                <p className={`mb-4 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  Você ainda não fez nenhum pedido
                </p>
                <button
                  onClick={() => navigate('/catalog')}
                  className="px-6 py-3 bg-[#4ECDC4] text-white rounded-lg font-medium hover:bg-[#4ECDC4]/90 transition-colors cursor-pointer whitespace-nowrap"
                >
                  Explorar Catálogo
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {orders.map((order) => (
                  <div
                    key={order.id}
                    className={`rounded-xl border p-6 transition-colors duration-500 ${
                      darkMode 
                        ? 'bg-gray-800 border-gray-700' 
                        : 'bg-white border-gray-200'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                          Pedido #{order.order_number}
                        </h3>
                        <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          {new Date(order.created_at).toLocaleDateString('pt-PT', {
                            day: '2-digit',
                            month: 'long',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                          €{order.total.toFixed(2)}
                        </p>
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                          order.payment_status === 'paid' 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-yellow-100 text-yellow-700'
                        }`}>
                          {order.payment_status === 'paid' ? 'Pago' : 'Pendente'}
                        </span>
                      </div>
                    </div>

                    {/* Itens do Pedido */}
                    <div className="space-y-3">
                      {order.order_items?.map((item: any) => (
                        <div key={item.id} className="flex items-center gap-4">
                          <div className={`w-16 h-20 rounded overflow-hidden flex-shrink-0 ${
                            darkMode ? 'bg-gray-700' : 'bg-gray-100'
                          }`}>
                            {item.products?.cover_url ? (
                              <img
                                src={item.products.cover_url}
                                alt={item.title}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <i className="ri-book-line text-2xl text-gray-400"></i>
                              </div>
                            )}
                          </div>
                          <div className="flex-1">
                            <p className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                              {item.title}
                            </p>
                            <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                              {item.author}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className={`font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                              €{item.price.toFixed(2)}
                            </p>
                            <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                              Qtd: {item.quantity}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>

                    {order.payment_status === 'paid' && (
                      <button
                        onClick={() => navigate('/my-library')}
                        className="mt-4 w-full px-4 py-3 bg-[#4ECDC4] text-white rounded-lg font-medium hover:bg-[#4ECDC4]/90 transition-colors cursor-pointer whitespace-nowrap"
                      >
                        <i className="ri-download-cloud-line mr-2"></i>
                        Baixar Produtos
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      case 'favorites':
        return (
          <div className="space-y-6">
            {loadingFavorites ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 border-4 border-[#4ECDC4] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className={darkMode ? 'text-gray-300' : 'text-gray-600'}>Carregando favoritos...</p>
              </div>
            ) : favorites.length === 0 ? (
              <div className={`rounded-xl border p-12 text-center transition-colors duration-500 ${
                darkMode 
                  ? 'bg-gray-800 border-gray-700' 
                  : 'bg-white border-gray-200'
              }`}>
                <i className="ri-heart-line text-6xl text-gray-300 mb-4"></i>
                <p className={`mb-4 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  Você ainda não tem favoritos
                </p>
                <button
                  onClick={() => navigate('/catalog')}
                  className="px-6 py-3 bg-[#4ECDC4] text-white rounded-lg font-medium hover:bg-[#4ECDC4]/90 transition-colors cursor-pointer whitespace-nowrap"
                >
                  Explorar Catálogo
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {favorites.map((favorite) => (
                  <div
                    key={favorite.id}
                    className={`rounded-xl border overflow-hidden transition-all duration-300 hover:shadow-lg ${
                      darkMode 
                        ? 'bg-gray-800 border-gray-700' 
                        : 'bg-white border-gray-200'
                    }`}
                  >
                    <div className={`h-64 flex items-center justify-center p-4 ${
                      darkMode ? 'bg-gray-700' : 'bg-gray-100'
                    }`}>
                      {favorite.products?.cover_url ? (
                        <img
                          src={favorite.products.cover_url}
                          alt={favorite.products.title}
                          className="h-full w-auto object-contain"
                        />
                      ) : (
                        <i className="ri-book-line text-6xl text-gray-400"></i>
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className={`font-bold mb-2 line-clamp-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        {favorite.products?.title}
                      </h3>
                      <p className={`text-sm mb-3 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        {favorite.products?.author}
                      </p>
                      <p className={`text-2xl font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        €{favorite.products?.price.toFixed(2)}
                      </p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => navigate(`/product/${favorite.products?.slug}`)}
                          className="flex-1 px-4 py-2 bg-[#4ECDC4] text-white rounded-lg hover:bg-[#4ECDC4]/90 transition-colors cursor-pointer whitespace-nowrap"
                        >
                          Ver Detalhes
                        </button>
                        <button
                          onClick={() => handleRemoveFavorite(favorite.id)}
                          className={`px-4 py-2 rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
                            darkMode 
                              ? 'bg-red-900/30 text-red-400 hover:bg-red-900/50' 
                              : 'bg-red-50 text-red-600 hover:bg-red-100'
                          }`}
                        >
                          <i className="ri-heart-fill"></i>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      case 'settings':
        return (
          <div className="space-y-6">
            {/* Dark Mode */}
            <div className={`rounded-xl border p-6 transition-colors duration-500 ${
              darkMode 
                ? 'bg-gray-800 border-gray-700' 
                : 'bg-white border-gray-200'
            }`}>
              <h3 className={`text-lg font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                Aparência
              </h3>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    Modo Escuro
                  </p>
                  <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Ative o modo escuro para reduzir o cansaço visual
                  </p>
                </div>
                <button
                  onClick={() => setDarkMode(!darkMode)}
                  className={`relative w-16 h-8 rounded-full transition-all duration-500 cursor-pointer ${
                    darkMode 
                      ? 'bg-gradient-to-r from-purple-600 to-pink-600' 
                      : 'bg-gray-300'
                  }`}
                >
                  <div
                    className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-transform duration-500 flex items-center justify-center ${
                      darkMode ? 'translate-x-8' : 'translate-x-0'
                    }`}
                  >
                    {darkMode ? (
                      <i className="ri-moon-fill text-purple-600 text-sm"></i>
                    ) : (
                      <i className="ri-sun-fill text-yellow-500 text-sm"></i>
                    )}
                  </div>
                </button>
              </div>
            </div>

            {/* Notificações */}
            <div className={`rounded-xl border p-6 transition-colors duration-500 ${
              darkMode 
                ? 'bg-gray-800 border-gray-700' 
                : 'bg-white border-gray-200'
            }`}>
              <h3 className={`text-lg font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                Notificações
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      Novos Produtos
                    </p>
                    <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      Receba notificações sobre novos lançamentos
                    </p>
                  </div>
                  <input type="checkbox" className="w-5 h-5 text-[#4ECDC4] rounded cursor-pointer" />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      Promoções
                    </p>
                    <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      Receba ofertas especiais e descontos
                    </p>
                  </div>
                  <input type="checkbox" className="w-5 h-5 text-[#4ECDC4] rounded cursor-pointer" />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      Newsletter
                    </p>
                    <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      Receba nossa newsletter semanal
                    </p>
                  </div>
                  <input type="checkbox" className="w-5 h-5 text-[#4ECDC4] rounded cursor-pointer" />
                </div>
              </div>
            </div>

            {/* Privacidade */}
            <div className={`rounded-xl border p-6 transition-colors duration-500 ${
              darkMode 
                ? 'bg-gray-800 border-gray-700' 
                : 'bg-white border-gray-200'
            }`}>
              <h3 className={`text-lg font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                Privacidade
              </h3>
              <div className="space-y-3">
                <button className={`w-full text-left px-4 py-3 rounded-lg transition-colors cursor-pointer ${
                  darkMode 
                    ? 'bg-gray-700 hover:bg-gray-600 text-white' 
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-900'
                }`}>
                  <i className="ri-file-text-line mr-2"></i>
                  Política de Privacidade
                </button>
                <button className={`w-full text-left px-4 py-3 rounded-lg transition-colors cursor-pointer ${
                  darkMode 
                    ? 'bg-gray-700 hover:bg-gray-600 text-white' 
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-900'
                }`}>
                  <i className="ri-shield-check-line mr-2"></i>
                  Termos de Uso
                </button>
                <button className={`w-full text-left px-4 py-3 rounded-lg transition-colors cursor-pointer ${
                  darkMode 
                    ? 'bg-gray-700 hover:bg-gray-600 text-white' 
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-900'
                }`}>
                  <i className="ri-download-line mr-2"></i>
                  Baixar Meus Dados
                </button>
              </div>
            </div>

            {/* Logout */}
            <button
              onClick={handleLogout}
              className="w-full px-6 py-3 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 transition-colors cursor-pointer whitespace-nowrap"
            >
              <i className="ri-logout-box-line mr-2"></i>
              Sair da Conta
            </button>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className={`min-h-screen pt-20 pb-12 transition-colors duration-500 ${
      darkMode ? 'bg-gray-900' : 'bg-gray-50'
    }`}>
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className={`text-3xl font-bold mb-2 transition-colors duration-500 ${
            darkMode ? 'text-white' : 'text-gray-900'
          }`}>
            Meu Perfil
          </h1>
          <p className={`transition-colors duration-500 ${
            darkMode ? 'text-gray-400' : 'text-gray-600'
          }`}>
            Gerencie suas informações pessoais e configurações de conta
          </p>
        </div>

        {/* Tabs */}
        <div className={`rounded-xl border p-2 mb-8 transition-colors duration-500 ${
          darkMode 
            ? 'bg-gray-800 border-gray-700' 
            : 'bg-white border-gray-200'
        }`}>
          <div className="flex gap-2 overflow-x-auto">
            <button
              onClick={() => setActiveTab('profile')}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all duration-300 cursor-pointer whitespace-nowrap ${
                activeTab === 'profile'
                  ? 'bg-gradient-to-r from-[#4ECDC4] to-[#45B7B8] text-white shadow-lg'
                  : darkMode
                    ? 'text-gray-300 hover:bg-gray-700'
                    : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <i className="ri-user-line text-lg"></i>
              Perfil
            </button>
            <button
              onClick={() => setActiveTab('orders')}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all duration-300 cursor-pointer whitespace-nowrap ${
                activeTab === 'orders'
                  ? 'bg-gradient-to-r from-[#4ECDC4] to-[#45B7B8] text-white shadow-lg'
                  : darkMode
                    ? 'text-gray-300 hover:bg-gray-700'
                    : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <i className="ri-shopping-bag-line text-lg"></i>
              Pedidos
            </button>
            <button
              onClick={() => setActiveTab('favorites')}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all duration-300 cursor-pointer whitespace-nowrap ${
                activeTab === 'favorites'
                  ? 'bg-gradient-to-r from-[#4ECDC4] to-[#45B7B8] text-white shadow-lg'
                  : darkMode
                    ? 'text-gray-300 hover:bg-gray-700'
                    : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <i className="ri-heart-line text-lg"></i>
              Favoritos
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all duration-300 cursor-pointer whitespace-nowrap ${
                activeTab === 'settings'
                  ? 'bg-gradient-to-r from-[#4ECDC4] to-[#45B7B8] text-white shadow-lg'
                  : darkMode
                    ? 'text-gray-300 hover:bg-gray-700'
                    : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <i className="ri-settings-3-line text-lg"></i>
              Configurações
            </button>
          </div>
        </div>

        {/* Content */}
        {renderContent()}
      </div>
    </div>
  );
}
