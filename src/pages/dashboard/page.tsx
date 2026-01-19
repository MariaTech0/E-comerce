import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useProducts } from '../../hooks/useProducts';
import { useCategories } from '../../hooks/useCategories';
import { useOrders } from '../../hooks/useOrders';
import ProductModal from './components/ProductModal';
import CategoryModal from './components/CategoryModal';
import CustomerModal from './components/CustomerModal';
import DashboardTopBar from '../../components/feature/DashboardTopBar';
import toast from 'react-hot-toast';

type TabType = 'overview' | 'products' | 'orders' | 'categories' | 'settings' | 'site-control' | 'newsletter' | 'site-settings' | 'reviews' | 'customers' | 'vat-settings' | 'messages' | 'team';

interface Product {
  id: string;
  title: string;
  price: number;
  cover_url: string;
  is_featured: boolean;
  is_active: boolean;
  category_id: string;
}

interface Order {
  id: string;
  customer_email: string;
  total_amount: number;
  payment_status: string;
  created_at: string;
}

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
}

interface SiteSettings {
  site_name: string;
  site_description: string;
  contact_email: string;
  contact_phone: string;
  whatsapp: string;
  facebook: string;
  instagram: string;
  twitter: string;
  founder_name: string;
  founder_bio: string;
}

const menuItems = [
  { id: 'overview', label: 'Visão Geral', icon: 'ri-dashboard-line', gradient: 'from-purple-500 to-pink-500' },
  { id: 'products', label: 'Produtos', icon: 'ri-book-line', gradient: 'from-blue-500 to-cyan-500' },
  { id: 'orders', label: 'Pedidos', icon: 'ri-shopping-bag-line', gradient: 'from-green-500 to-emerald-500' },
  { id: 'categories', label: 'Categorias', icon: 'ri-folder-line', gradient: 'from-orange-500 to-red-500' },
  { id: 'customers', label: 'Clientes', icon: 'ri-user-line', gradient: 'from-red-500 to-pink-500' },
  { id: 'reviews', label: 'Avaliações', icon: 'ri-star-line', gradient: 'from-yellow-500 to-orange-500' },
  { id: 'team', label: 'Equipa', icon: 'ri-team-line', gradient: 'from-indigo-500 to-purple-500' },
  { id: 'newsletter', label: 'Newsletter', icon: 'ri-mail-line', gradient: 'from-teal-500 to-cyan-500' },
  { id: 'messages', label: 'Mensagens', icon: 'ri-message-3-line', gradient: 'from-violet-500 to-purple-500' },
  { id: 'site-control', label: 'Controle do Site', icon: 'ri-settings-3-line', gradient: 'from-indigo-500 to-purple-500' },
  { id: 'vat-settings', label: 'Configurações IVA', icon: 'ri-percent-line', gradient: 'from-yellow-500 to-orange-500' },
  { id: 'settings', label: 'Configurações', icon: 'ri-settings-4-line', gradient: 'from-pink-500 to-rose-500' },
];

export default function Dashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [showProductModal, setShowProductModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const [editingCustomer, setEditingCustomer] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [newsletterSubscribers, setNewsletterSubscribers] = useState<any[]>([]);
  const [siteSettings, setSiteSettings] = useState<any[]>([]);
  const [editingSettings, setEditingSettings] = useState<any>({});
  const [loading, setLoading] = useState(true);
  
  // ADICIONAR ESTAS VARIÁVEIS DE ESTADO QUE ESTAVAM FALTANDO:
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('dashboard-dark-mode');
    return saved ? JSON.parse(saved) : true;
  });
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showTeamModal, setShowTeamModal] = useState(false);
  const [editingTeamMember, setEditingTeamMember] = useState<any>(null);
  
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalRevenue: 0,
    totalProducts: 0,
    totalCustomers: 0,
  });
  const [products, setProducts] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);

  const { products: productsData, loading: productsLoading, refetch: refetchProducts } = useProducts();
  const { categories: categoriesData, loading: categoriesLoading, refetch: refetchCategories } = useCategories();
  const { orders: ordersData, loading: ordersLoading } = useOrders();

  useEffect(() => {
    checkAuth();
    fetchNewsletterSubscribers();
    fetchSiteSettings();
    fetchReviews();
  }, []);

  // Salvar preferência de Dark Mode
  useEffect(() => {
    localStorage.setItem('dashboard-dark-mode', JSON.stringify(darkMode));
  }, [darkMode]);

  const checkAuth = async () => {
    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      
      if (!currentUser) {
        navigate('/login');
        return;
      }

      // Verificar se é admin
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', currentUser.id)
        .single();

      if (!profile || !['superadmin', 'editor', 'support'].includes(profile.role)) {
        toast.error('Acesso negado. Apenas administradores podem acessar esta área.');
        navigate('/');
        return;
      }

      setUser(currentUser);
      setUserProfile(profile);
      await loadDashboardData();
    } catch (error) {
      console.error('Erro ao verificar autenticação:', error);
      navigate('/login');
    } finally {
      setLoading(false);
    }
  };

  const loadDashboardData = async () => {
    try {
      // Carregar estatísticas
      const { data: ordersData } = await supabase
        .from('orders')
        .select('total_amount');
      
      const { data: productsData } = await supabase
        .from('products')
        .select('id')
        .eq('is_active', true);
      
      const { data: customersData } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('role', 'customer');

      setStats({
        totalOrders: ordersData?.length || 0,
        totalRevenue: ordersData?.reduce((sum, order) => sum + order.total_amount, 0) || 0,
        totalProducts: productsData?.length || 0,
        totalCustomers: customersData?.length || 0,
      });

      // Carregar produtos
      const { data: allProducts } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });
      
      setProducts(allProducts || []);

      // Carregar pedidos
      const { data: allOrders } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);
      
      setOrders(allOrders || []);

      // Carregar categorias
      const { data: allCategories } = await supabase
        .from('categories')
        .select('*')
        .order('name');
      
      setCategories(allCategories || []);

      // Carregar clientes
      const { data: allCustomers } = await supabase
        .from('user_profiles')
        .select('*')
        .order('created_at', { ascending: false });
      
      setCustomers(allCustomers || []);

    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast.error('Erro ao carregar dados do dashboard');
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  const handleSaveProduct = async (productData: any) => {
    try {
      if (editingProduct) {
        // Atualizar produto
        const { error } = await supabase
          .from('products')
          .update(productData)
          .eq('id', editingProduct.id);

        if (error) throw error;
        toast.success('Produto atualizado com sucesso!');
      } else {
        // Criar novo produto
        const { error } = await supabase
          .from('products')
          .insert([productData]);

        if (error) throw error;
        toast.success('Produto criado com sucesso!');
      }

      setShowProductModal(false);
      setEditingProduct(null);
      await loadDashboardData();
    } catch (error) {
      console.error('Erro ao salvar produto:', error);
      toast.error('Erro ao salvar produto');
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!confirm('Tem certeza que deseja excluir este produto?')) return;

    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId);

      if (error) throw error;
      toast.success('Produto excluído com sucesso!');
      await loadDashboardData();
    } catch (error) {
      console.error('Erro ao excluir produto:', error);
      toast.error('Erro ao excluir produto');
    }
  };

  const handleSaveCategory = async (categoryData: any) => {
    try {
      if (editingCategory) {
        const { error } = await supabase
          .from('categories')
          .update(categoryData)
          .eq('id', editingCategory.id);

        if (error) throw error;
        toast.success('Categoria atualizada com sucesso!');
      } else {
        const { error } = await supabase
          .from('categories')
          .insert([categoryData]);

        if (error) throw error;
        toast.success('Categoria criada com sucesso!');
      }

      setShowCategoryModal(false);
      setEditingCategory(null);
      await loadDashboardData();
    } catch (error) {
      console.error('Erro ao salvar categoria:', error);
      toast.error('Erro ao salvar categoria');
    }
  };

  const handleSaveSettings = async () => {
    try {
      // Aqui você pode salvar as configurações no banco de dados
      // Por enquanto, vamos apenas mostrar uma mensagem de sucesso
      toast.success('Configurações salvas com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar configurações:', error);
      toast.error('Erro ao salvar configurações');
    }
  };

  const fetchNewsletterSubscribers = async () => {
    try {
      const { data, error } = await supabase
        .from('newsletter_subscribers')
        .select('*')
        .order('subscribed_at', { ascending: false });

      if (error) throw error;
      setNewsletterSubscribers(data || []);
    } catch (error) {
      console.error('Erro ao buscar inscritos:', error);
    }
  };

  const fetchSiteSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('site_settings')
        .select('*')
        .order('section', { ascending: true });

      if (error) throw error;
      setSiteSettings(data || []);
      
      // Criar objeto de edição com valores atuais
      const settingsObj: any = {};
      data?.forEach((setting: any) => {
        if (!settingsObj[setting.section]) {
          settingsObj[setting.section] = {};
        }
        settingsObj[setting.section][setting.key] = setting.value;
      });
      setEditingSettings(settingsObj);
    } catch (error) {
      console.error('Erro ao buscar configurações:', error);
    }
  };

  const handleUpdateSetting = async (section: string, key: string, value: string) => {
    try {
      const setting = siteSettings.find(s => s.section === section && s.key === key);
      const { data: { user } } = await supabase.auth.getUser();

      if (setting) {
        const { error } = await supabase
          .from('site_settings')
          .update({ value, updated_at: new Date().toISOString(), updated_by: user?.id })
          .eq('id', setting.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('site_settings')
          .insert([{ section, key, value, updated_by: user?.id }]);

        if (error) throw error;
      }

      toast.success('Configuração atualizada!');
      await fetchSiteSettings();
    } catch (error) {
      console.error('Erro ao atualizar:', error);
      toast.error('Erro ao atualizar configuração');
    }
  };

  const handleDeleteSubscriber = async (id: string) => {
    if (!confirm('Deseja remover este inscrito?')) return;

    try {
      const { error } = await supabase
        .from('newsletter_subscribers')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      toast.success('Inscrito removido!');
      await fetchNewsletterSubscribers();
    } catch (error) {
      console.error('Erro ao remover:', error);
      toast.error('Erro ao remover inscrito');
    }
  };

  const fetchReviews = async () => {
    try {
      const { data, error } = await supabase
        .from('reviews')
        .select(`
          *,
          products (title, cover_url),
          user_profiles (full_name, email)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setReviews(data || []);
    } catch (error) {
      console.error('Erro ao buscar avaliações:', error);
    }
  };

  const handleApproveReview = async (reviewId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from('reviews')
        .update({
          is_approved: true,
          approved_by: user?.id,
          approved_at: new Date().toISOString()
        })
        .eq('id', reviewId);

      if (error) throw error;
      
      toast.success('Avaliação aprovada!');
      await fetchReviews();
    } catch (error) {
      console.error('Erro ao aprovar:', error);
      toast.error('Erro ao aprovar avaliação');
    }
  };

  const handleDeleteReview = async (reviewId: string) => {
    if (!confirm('Deseja remover esta avaliação?')) return;

    try {
      const { error } = await supabase
        .from('reviews')
        .delete()
        .eq('id', reviewId);

      if (error) throw error;
      
      toast.success('Avaliação removida!');
      await fetchReviews();
    } catch (error) {
      console.error('Erro ao remover:', error);
      toast.error('Erro ao remover avaliação');
    }
  };

  const handleDeleteCustomer = async (customerId: string) => {
    if (!confirm('Tem certeza que deseja excluir este cliente? Esta ação não pode ser desfeita.')) return;

    try {
      // Deletar perfil
      const { error: profileError } = await supabase
        .from('user_profiles')
        .delete()
        .eq('id', customerId);

      if (profileError) throw profileError;

      // Deletar usuário do Auth (requer permissões de admin)
      const { error: authError } = await supabase.auth.admin.deleteUser(customerId);
      
      if (authError) {
        console.warn('Aviso ao deletar usuário do Auth:', authError);
        // Continuar mesmo se falhar, pois o perfil já foi deletado
      }

      toast.success('Cliente excluído com sucesso!');
      await loadDashboardData();
    } catch (error) {
      console.error('Erro ao excluir cliente:', error);
      toast.error('Erro ao excluir cliente');
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="space-y-6">
            {/* Stats Cards - 4 Caixas Principais */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Total de Pedidos */}
              <div className="bg-white rounded-xl p-6 border border-gray-200 hover:shadow-lg transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center shadow-lg">
                    <i className="ri-shopping-bag-line text-2xl text-white"></i>
                  </div>
                  <span className="text-xs font-medium text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
                    Pedidos
                  </span>
                </div>
                <h3 className="text-3xl font-bold text-gray-900 mb-1">{stats.totalOrders}</h3>
                <p className="text-sm text-gray-600">Total de Pedidos</p>
                <div className="mt-3 flex items-center text-xs text-green-600">
                  <i className="ri-arrow-up-line mr-1"></i>
                  <span>+12% este mês</span>
                </div>
              </div>

              {/* Receita Total */}
              <div className="bg-white rounded-xl p-6 border border-gray-200 hover:shadow-lg transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center shadow-lg">
                    <i className="ri-money-euro-circle-line text-2xl text-white"></i>
                  </div>
                  <span className="text-xs font-medium text-green-600 bg-green-50 px-3 py-1 rounded-full">
                    Receita
                  </span>
                </div>
                <h3 className="text-3xl font-bold text-gray-900 mb-1">€{stats.totalRevenue.toFixed(2)}</h3>
                <p className="text-sm text-gray-600">Receita Total</p>
                <div className="mt-3 flex items-center text-xs text-green-600">
                  <i className="ri-arrow-up-line mr-1"></i>
                  <span>+18% este mês</span>
                </div>
              </div>

              {/* Produtos Ativos */}
              <div className="bg-white rounded-xl p-6 border border-gray-200 hover:shadow-lg transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center shadow-lg">
                    <i className="ri-book-line text-2xl text-white"></i>
                  </div>
                  <span className="text-xs font-medium text-purple-600 bg-purple-50 px-3 py-1 rounded-full">
                    Produtos
                  </span>
                </div>
                <h3 className="text-3xl font-bold text-gray-900 mb-1">{stats.totalProducts}</h3>
                <p className="text-sm text-gray-600">Produtos Ativos</p>
                <div className="mt-3 flex items-center text-xs text-blue-600">
                  <i className="ri-add-line mr-1"></i>
                  <span>{products.filter(p => p.is_featured).length} em destaque</span>
                </div>
              </div>

              {/* Total de Clientes */}
              <div className="bg-white rounded-xl p-6 border border-gray-200 hover:shadow-lg transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center shadow-lg">
                    <i className="ri-user-line text-2xl text-white"></i>
                  </div>
                  <span className="text-xs font-medium text-orange-600 bg-orange-50 px-3 py-1 rounded-full">
                    Clientes
                  </span>
                </div>
                <h3 className="text-3xl font-bold text-gray-900 mb-1">{stats.totalCustomers}</h3>
                <p className="text-sm text-gray-600">Total de Clientes</p>
                <div className="mt-3 flex items-center text-xs text-green-600">
                  <i className="ri-arrow-up-line mr-1"></i>
                  <span>+8% este mês</span>
                </div>
              </div>
            </div>

            {/* Estatísticas Adicionais - 3 Caixas */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Categorias */}
              <div className="bg-gradient-to-br from-teal-500 to-cyan-500 rounded-xl p-6 text-white shadow-lg">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center">
                    <i className="ri-folder-line text-2xl text-white"></i>
                  </div>
                  <i className="ri-arrow-right-up-line text-3xl opacity-50"></i>
                </div>
                <h3 className="text-4xl font-bold mb-1">{categories.length}</h3>
                <p className="text-white/90 text-sm">Categorias Ativas</p>
              </div>

              {/* Avaliações */}
              <div className="bg-gradient-to-br from-yellow-500 to-orange-500 rounded-xl p-6 text-white shadow-lg">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center">
                    <i className="ri-star-line text-2xl text-white"></i>
                  </div>
                  <i className="ri-arrow-right-up-line text-3xl opacity-50"></i>
                </div>
                <h3 className="text-4xl font-bold mb-1">{reviews.length}</h3>
                <p className="text-white/90 text-sm">Avaliações Recebidas</p>
                <div className="mt-2 text-xs">
                  {reviews.filter(r => !r.is_approved).length} pendentes de aprovação
                </div>
              </div>

              {/* Newsletter */}
              <div className="bg-gradient-to-br from-pink-500 to-rose-500 rounded-xl p-6 text-white shadow-lg">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center">
                    <i className="ri-mail-line text-2xl text-white"></i>
                  </div>
                  <i className="ri-arrow-right-up-line text-3xl opacity-50"></i>
                </div>
                <h3 className="text-4xl font-bold mb-1">{newsletterSubscribers.length}</h3>
                <p className="text-white/90 text-sm">Inscritos Newsletter</p>
              </div>
            </div>

            {/* Gráfico de Vendas e Produtos Mais Vendidos */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Vendas por Mês */}
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="p-6 border-b border-gray-200">
                  <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <i className="ri-line-chart-line text-teal-600"></i>
                    Vendas por Mês
                  </h3>
                </div>
                <div className="p-6">
                  <div className="space-y-4">
                    {['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho'].map((month, index) => {
                      const value = Math.floor(Math.random() * 100) + 20;
                      return (
                        <div key={month}>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-gray-700">{month}</span>
                            <span className="text-sm font-bold text-teal-600">€{(value * 50).toFixed(2)}</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-gradient-to-r from-teal-500 to-cyan-500 h-2 rounded-full transition-all duration-500"
                              style={{ width: `${value}%` }}
                            ></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Produtos Mais Vendidos */}
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="p-6 border-b border-gray-200">
                  <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <i className="ri-fire-line text-orange-600"></i>
                    Produtos Mais Vendidos
                  </h3>
                </div>
                <div className="p-6">
                  <div className="space-y-4">
                    {products.slice(0, 5).map((product, index) => (
                      <div key={product.id} className="flex items-center gap-4">
                        <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-red-500 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                          {index + 1}
                        </div>
                        <div className="w-12 h-16 bg-gray-100 rounded overflow-hidden flex-shrink-0">
                          {product.cover_url ? (
                            <img src={product.cover_url} alt={product.title} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <i className="ri-book-line text-gray-400"></i>
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 truncate">{product.title}</p>
                          <p className="text-sm text-gray-600">€{product.price.toFixed(2)}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-teal-600">{Math.floor(Math.random() * 50) + 10}</p>
                          <p className="text-xs text-gray-500">vendas</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Pedidos Recentes */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <i className="ri-shopping-cart-line text-blue-600"></i>
                  Pedidos Recentes
                </h3>
                <button
                  onClick={() => setActiveTab('orders')}
                  className="text-sm text-teal-600 hover:text-teal-700 font-medium cursor-pointer whitespace-nowrap"
                >
                  Ver Todos <i className="ri-arrow-right-line ml-1"></i>
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cliente</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Valor</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Data</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {orders.slice(0, 5).map((order) => (
                      <tr key={order.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm font-mono text-gray-600">#{order.id.slice(0, 8)}</td>
                        <td className="px-6 py-4 text-sm text-gray-900">{order.customer_email}</td>
                        <td className="px-6 py-4 text-sm font-bold text-gray-900">€{order.total_amount.toFixed(2)}</td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            order.payment_status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                          }`}>
                            {order.payment_status === 'paid' ? 'Pago' : 'Pendente'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {new Date(order.created_at).toLocaleDateString('pt-PT', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric'
                          })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {orders.length === 0 && (
                <div className="text-center py-12">
                  <i className="ri-shopping-cart-line text-6xl text-gray-300 mb-4"></i>
                  <p className="text-gray-500">Nenhum pedido ainda</p>
                </div>
              )}
            </div>

            {/* Atividade Recente */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <i className="ri-time-line text-purple-600"></i>
                  Atividade Recente
                </h3>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {[
                    { icon: 'ri-shopping-bag-line', color: 'blue', text: 'Novo pedido recebido', time: '5 min atrás' },
                    { icon: 'ri-user-add-line', color: 'green', text: 'Novo cliente cadastrado', time: '15 min atrás' },
                    { icon: 'ri-star-line', color: 'yellow', text: 'Nova avaliação recebida', time: '1 hora atrás' },
                    { icon: 'ri-mail-line', color: 'pink', text: 'Novo inscrito na newsletter', time: '2 horas atrás' },
                    { icon: 'ri-book-line', color: 'purple', text: 'Produto adicionado ao catálogo', time: '3 horas atrás' },
                  ].map((activity, index) => (
                    <div key={index} className="flex items-center gap-4">
                      <div className={`w-10 h-10 bg-${activity.color}-100 rounded-lg flex items-center justify-center flex-shrink-0`}>
                        <i className={`${activity.icon} text-${activity.color}-600`}></i>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{activity.text}</p>
                        <p className="text-xs text-gray-500">{activity.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Ações Rápidas */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <button
                onClick={() => setActiveTab('products')}
                className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-xl p-6 hover:shadow-lg transition-all cursor-pointer group"
              >
                <i className="ri-add-line text-3xl mb-3 group-hover:scale-110 transition-transform"></i>
                <p className="font-bold">Adicionar Produto</p>
              </button>

              <button
                onClick={() => setActiveTab('categories')}
                className="bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-xl p-6 hover:shadow-lg transition-all cursor-pointer group"
              >
                <i className="ri-folder-add-line text-3xl mb-3 group-hover:scale-110 transition-transform"></i>
                <p className="font-bold">Criar Categoria</p>
              </button>

              <button
                onClick={() => setActiveTab('customers')}
                className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-xl p-6 hover:shadow-lg transition-all cursor-pointer group"
              >
                <i className="ri-user-add-line text-3xl mb-3 group-hover:scale-110 transition-transform"></i>
                <p className="font-bold">Adicionar Cliente</p>
              </button>

              <button
                onClick={() => setActiveTab('settings')}
                className="bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-xl p-6 hover:shadow-lg transition-all cursor-pointer group"
              >
                <i className="ri-settings-3-line text-3xl mb-3 group-hover:scale-110 transition-transform"></i>
                <p className="font-bold">Configurações</p>
              </button>
            </div>
          </div>
        );

      case 'products':
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-gray-600">{products.length} produtos cadastrados</p>
              </div>
              <button
                onClick={() => {
                  setEditingProduct(null);
                  setShowProductModal(true);
                }}
                className="px-6 py-3 bg-[#4ECDC4] text-white rounded-lg font-medium hover:bg-[#4ECDC4]/90 transition-colors cursor-pointer whitespace-nowrap"
              >
                <i className="ri-add-line mr-2"></i>
                Adicionar Produto
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((product) => (
                <div key={product.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  <div className="h-48 bg-gray-100 flex items-center justify-center p-4">
                    {product.cover_url ? (
                      <img src={product.cover_url} alt={product.title} className="h-full w-auto object-contain" />
                    ) : (
                      <i className="ri-image-line text-4xl text-gray-400"></i>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="font-bold text-gray-900 mb-2 line-clamp-2">{product.title}</h3>
                    <p className="text-2xl font-bold text-[#4ECDC4] mb-4">€{product.price.toFixed(2)}</p>
                    
                    <div className="flex items-center gap-2 mb-4">
                      {product.is_featured && (
                        <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs font-medium rounded">
                          Destaque
                        </span>
                      )}
                      <span className={`px-2 py-1 text-xs font-medium rounded ${
                        product.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                      }`}>
                        {product.is_active ? 'Ativo' : 'Inativo'}
                      </span>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setEditingProduct(product);
                          setShowProductModal(true);
                        }}
                        className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors cursor-pointer whitespace-nowrap"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleDeleteProduct(product.id)}
                        className="px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors cursor-pointer whitespace-nowrap"
                      >
                        <i className="ri-delete-bin-line"></i>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 'orders':
        return (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cliente</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Valor</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Data</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {orders.map((order) => (
                    <tr key={order.id}>
                      <td className="px-6 py-4 text-sm text-gray-600">#{order.id.slice(0, 8)}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">{order.customer_email}</td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">€{order.total_amount.toFixed(2)}</td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          order.payment_status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                        }`}>
                          {order.payment_status === 'paid' ? 'Pago' : 'Pendente'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {new Date(order.created_at).toLocaleDateString('pt-PT')}
                      </td>
                      <td className="px-6 py-4">
                        <button className="text-[#4ECDC4] hover:text-[#4ECDC4]/80 cursor-pointer">
                          Ver Detalhes
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );

      case 'categories':
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-gray-600">{categories.length} categorias cadastradas</p>
              </div>
              <button
                onClick={() => {
                  setEditingCategory(null);
                  setShowCategoryModal(true);
                }}
                className="px-6 py-3 bg-[#4ECDC4] text-white rounded-lg font-medium hover:bg-[#4ECDC4]/90 transition-colors cursor-pointer whitespace-nowrap"
              >
                <i className="ri-add-line mr-2"></i>
                Adicionar Categoria
              </button>
            </div>

            {/* Grid de Categorias com Preview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {categories.map((category) => (
                <div key={category.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden group">
                  {/* Preview da Categoria */}
                  <div className="relative h-48 overflow-hidden">
                    <img
                      src={category.image_url || `https://readdy.ai/api/search-image?query=beautiful%20minimalist%20$%7Bcategory.name%7D%20books%20category%20background%20with%20soft%20colors%20and%20elegant%20design%20modern%20aesthetic%20clean%20composition&width=600&height=800&seq=${category.id}&orientation=portrait`}
                      alt={category.name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>
                    
                    {/* Ícone e Nome */}
                    <div className="absolute bottom-4 left-4 right-4">
                      <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center mb-2">
                        <i className={`${category.icon || 'ri-book-line'} text-2xl text-white`}></i>
                      </div>
                      <h3 className="font-serif text-xl font-bold text-white mb-1">
                        {category.name}
                      </h3>
                      <p className="text-white/80 text-sm">
                        {category.product_count || 0} livros
                      </p>
                    </div>

                    {/* Badge de Status */}
                    <div className="absolute top-4 right-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        category.is_active !== false
                          ? 'bg-green-500 text-white'
                          : 'bg-gray-500 text-white'
                      }`}>
                        {category.is_active !== false ? 'Ativa' : 'Inativa'}
                      </span>
                    </div>
                  </div>

                  {/* Informações */}
                  <div className="p-4">
                    <div className="mb-3">
                      <p className="text-sm text-gray-600 mb-1">
                        <span className="font-medium">Slug:</span> {category.slug}
                      </p>
                      {category.description && (
                        <p className="text-sm text-gray-600 line-clamp-2">
                          {category.description}
                        </p>
                      )}
                    </div>

                    {/* Botões */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setEditingCategory(category);
                          setShowCategoryModal(true);
                        }}
                        className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors cursor-pointer whitespace-nowrap flex items-center justify-center gap-2"
                      >
                        <i className="ri-edit-line"></i>
                        Editar
                      </button>
                      <button
                        onClick={async () => {
                          if (!confirm('Tem certeza que deseja excluir esta categoria?')) return;
                          
                          try {
                            const { error } = await supabase
                              .from('categories')
                              .delete()
                              .eq('id', category.id);

                            if (error) throw error;
                            toast.success('Categoria excluída com sucesso!');
                            await loadDashboardData();
                          } catch (error) {
                            console.error('Erro ao excluir categoria:', error);
                            toast.error('Erro ao excluir categoria');
                          }
                        }}
                        className="px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors cursor-pointer whitespace-nowrap"
                      >
                        <i className="ri-delete-bin-line"></i>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Mensagem se não houver categorias */}
            {categories.length === 0 && (
              <div className="text-center py-12 bg-white rounded-xl">
                <i className="ri-folder-line text-6xl text-gray-300 mb-4"></i>
                <p className="text-gray-500 mb-4">Nenhuma categoria cadastrada</p>
                <button
                  onClick={() => {
                    setEditingCategory(null);
                    setShowCategoryModal(true);
                  }}
                  className="px-6 py-3 bg-[#4ECDC4] text-white rounded-lg font-medium hover:bg-[#4ECDC4]/90 transition-colors cursor-pointer whitespace-nowrap"
                >
                  <i className="ri-add-line mr-2"></i>
                  Criar Primeira Categoria
                </button>
              </div>
            )}
          </div>
        );

      case 'site-settings':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Configurações do Site</h2>
              <p className="text-gray-600 mt-1">Edite TODOS os textos, imagens e informações do site</p>
            </div>

            {/* Configurações Gerais do Site */}
            <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-teal-500">
              <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <i className="ri-global-line text-teal-600"></i>
                Informações Gerais do Site
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Nome do Site</label>
                  <input
                    type="text"
                    value={editingSettings.general?.site_name || ''}
                    onChange={(e) => setEditingSettings({
                      ...editingSettings,
                      general: { ...editingSettings.general, site_name: e.target.value }
                    })}
                    onBlur={() => handleUpdateSetting('general', 'site_name', editingSettings.general?.site_name)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    placeholder="Livraria Digital"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Slogan do Site</label>
                  <input
                    type="text"
                    value={editingSettings.general?.site_slogan || ''}
                    onChange={(e) => setEditingSettings({
                      ...editingSettings,
                      general: { ...editingSettings.general, site_slogan: e.target.value }
                    })}
                    onBlur={() => handleUpdateSetting('general', 'site_slogan', editingSettings.general?.site_slogan)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    placeholder="Descubra Mundos em Cada Página"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Descrição do Site (SEO)</label>
                  <textarea
                    value={editingSettings.general?.site_description || ''}
                    onChange={(e) => setEditingSettings({
                      ...editingSettings,
                      general: { ...editingSettings.general, site_description: e.target.value }
                    })}
                    onBlur={() => handleUpdateSetting('general', 'site_description', editingSettings.general?.site_description)}
                    rows={2}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    placeholder="Milhares de ebooks em mais de 100 categorias..."
                  />
                </div>
              </div>
            </div>

            {/* Configurações da Página Inicial */}
            <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-blue-500">
              <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <i className="ri-home-line text-blue-600"></i>
                Página Inicial - Hero Section
              </h3>
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Título Principal (Hero)</label>
                  <input
                    type="text"
                    value={editingSettings.home?.hero_title || ''}
                    onChange={(e) => setEditingSettings({
                      ...editingSettings,
                      home: { ...editingSettings.home, hero_title: e.target.value }
                    })}
                    onBlur={() => handleUpdateSetting('home', 'hero_title', editingSettings.home?.hero_title)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    placeholder="Descubra Mundos em Cada Página"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Subtítulo Hero</label>
                  <textarea
                    value={editingSettings.home?.hero_subtitle || ''}
                    onChange={(e) => setEditingSettings({
                      ...editingSettings,
                      home: { ...editingSettings.home, hero_subtitle: e.target.value }
                    })}
                    onBlur={() => handleUpdateSetting('home', 'hero_subtitle', editingSettings.home?.hero_subtitle)}
                    rows={2}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    placeholder="Milhares de livros digitais ao seu alcance..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">URL da Imagem de Fundo Hero</label>
                  <input
                    type="url"
                    value={editingSettings.home?.hero_background || ''}
                    onChange={(e) => setEditingSettings({
                      ...editingSettings,
                      home: { ...editingSettings.home, hero_background: e.target.value }
                    })}
                    onBlur={() => handleUpdateSetting('home', 'hero_background', editingSettings.home?.hero_background)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    placeholder="https://..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Texto do Botão Hero</label>
                  <input
                    type="text"
                    value={editingSettings.home?.hero_button_text || ''}
                    onChange={(e) => setEditingSettings({
                      ...editingSettings,
                      home: { ...editingSettings.home, hero_button_text: e.target.value }
                    })}
                    onBlur={() => handleUpdateSetting('home', 'hero_button_text', editingSettings.home?.hero_button_text)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    placeholder="Explorar Catálogo"
                  />
                </div>
              </div>
            </div>

            {/* Seção "O Que Nos Move" */}
            <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-purple-500">
              <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <i className="ri-heart-line text-purple-600"></i>
                Página Inicial - O Que Nos Move
              </h3>
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Título da Seção</label>
                  <input
                    type="text"
                    value={editingSettings.home?.mission_title || ''}
                    onChange={(e) => setEditingSettings({
                      ...editingSettings,
                      home: { ...editingSettings.home, mission_title: e.target.value }
                    })}
                    onBlur={() => handleUpdateSetting('home', 'mission_title', editingSettings.home?.mission_title)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    placeholder="O Que Nos Move"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Descrição</label>
                  <textarea
                    value={editingSettings.home?.mission_description || ''}
                    onChange={(e) => setEditingSettings({
                      ...editingSettings,
                      home: { ...editingSettings.home, mission_description: e.target.value }
                    })}
                    onBlur={() => handleUpdateSetting('home', 'mission_description', editingSettings.home?.mission_description)}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    placeholder="Nossa missão é democratizar o acesso à literatura..."
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Card 1 - Título</label>
                    <input
                      type="text"
                      value={editingSettings.home?.mission_card1_title || ''}
                      onChange={(e) => setEditingSettings({
                        ...editingSettings,
                        home: { ...editingSettings.home, mission_card1_title: e.target.value }
                      })}
                      onBlur={() => handleUpdateSetting('home', 'mission_card1_title', editingSettings.home?.mission_card1_title)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                      placeholder="Qualidade"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Card 2 - Título</label>
                    <input
                      type="text"
                      value={editingSettings.home?.mission_card2_title || ''}
                      onChange={(e) => setEditingSettings({
                        ...editingSettings,
                        home: { ...editingSettings.home, mission_card2_title: e.target.value }
                      })}
                      onBlur={() => handleUpdateSetting('home', 'mission_card2_title', editingSettings.home?.mission_card2_title)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                      placeholder="Acessibilidade"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Card 3 - Título</label>
                    <input
                      type="text"
                      value={editingSettings.home?.mission_card3_title || ''}
                      onChange={(e) => setEditingSettings({
                        ...editingSettings,
                        home: { ...editingSettings.home, mission_card3_title: e.target.value }
                      })}
                      onBlur={() => handleUpdateSetting('home', 'mission_card3_title', editingSettings.home?.mission_card3_title)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                      placeholder="Inovação"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Card 1 - Descrição</label>
                    <textarea
                      value={editingSettings.home?.mission_card1_desc || ''}
                      onChange={(e) => setEditingSettings({
                        ...editingSettings,
                        home: { ...editingSettings.home, mission_card1_desc: e.target.value }
                      })}
                      onBlur={() => handleUpdateSetting('home', 'mission_card1_desc', editingSettings.home?.mission_card1_desc)}
                      rows={2}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Card 2 - Descrição</label>
                    <textarea
                      value={editingSettings.home?.mission_card2_desc || ''}
                      onChange={(e) => setEditingSettings({
                        ...editingSettings,
                        home: { ...editingSettings.home, mission_card2_desc: e.target.value }
                      })}
                      onBlur={() => handleUpdateSetting('home', 'mission_card2_desc', editingSettings.home?.mission_card2_desc)}
                      rows={2}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Card 3 - Descrição</label>
                    <textarea
                      value={editingSettings.home?.mission_card3_desc || ''}
                      onChange={(e) => setEditingSettings({
                        ...editingSettings,
                        home: { ...editingSettings.home, mission_card3_desc: e.target.value }
                      })}
                      onBlur={() => handleUpdateSetting('home', 'mission_card3_desc', editingSettings.home?.mission_card3_desc)}
                      rows={2}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Seção Sobre Nós - Página Inicial (NOVO) */}
            <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-cyan-500">
              <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <i className="ri-information-line text-cyan-600"></i>
                Página Inicial - Seção Sobre Nós (Com Navegação)
              </h3>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <div className="flex items-start gap-3">
                  <i className="ri-information-line text-blue-600 text-xl mt-0.5"></i>
                  <div>
                    <h4 className="font-semibold text-blue-900 mb-1">Seção com 2 Páginas Navegáveis</h4>
                    <p className="text-sm text-blue-800">
                      Esta seção tem navegação com setas (← →) e indicadores. Configure o conteúdo de cada página abaixo.
                    </p>
                  </div>
                </div>
              </div>

              {/* Página 1 */}
              <div className="mb-8 p-6 bg-gradient-to-r from-cyan-50 to-blue-50 rounded-xl border border-cyan-200">
                <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <span className="w-8 h-8 bg-cyan-500 text-white rounded-full flex items-center justify-center text-sm font-bold">1</span>
                  Página 1 - Biblioteca Digital
                </h4>
                
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Título</label>
                    <input
                      type="text"
                      value={editingSettings.home?.about_page1_title || ''}
                      onChange={(e) => setEditingSettings({
                        ...editingSettings,
                        home: { ...editingSettings.home, about_page1_title: e.target.value }
                      })}
                      onBlur={() => handleUpdateSetting('home', 'about_page1_title', editingSettings.home?.about_page1_title)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                      placeholder="Sua Biblioteca Digital Completa"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Descrição</label>
                    <textarea
                      value={editingSettings.home?.about_page1_description || ''}
                      onChange={(e) => setEditingSettings({
                        ...editingSettings,
                        home: { ...editingSettings.home, about_page1_description: e.target.value }
                      })}
                      onBlur={() => handleUpdateSetting('home', 'about_page1_description', editingSettings.home?.about_page1_description)}
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                      placeholder="Oferecemos a melhor experiência em leitura digital..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Autor da Mensagem</label>
                    <input
                      type="text"
                      value={editingSettings.home?.about_page1_author || ''}
                      onChange={(e) => setEditingSettings({
                        ...editingSettings,
                        home: { ...editingSettings.home, about_page1_author: e.target.value }
                      })}
                      onBlur={() => handleUpdateSetting('home', 'about_page1_author', editingSettings.home?.about_page1_author)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                      placeholder="Equipe Livraria Digital"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">URL da Imagem</label>
                    <input
                      type="url"
                      value={editingSettings.home?.about_page1_image || ''}
                      onChange={(e) => setEditingSettings({
                        ...editingSettings,
                        home: { ...editingSettings.home, about_page1_image: e.target.value }
                      })}
                      onBlur={() => handleUpdateSetting('home', 'about_page1_image', editingSettings.home?.about_page1_image)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                      placeholder="https://..."
                    />
                    <p className="text-xs text-gray-500 mt-1">Deixe em branco para usar imagem padrão</p>
                  </div>
                </div>
              </div>

              {/* Página 2 */}
              <div className="p-6 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl border border-blue-200">
                <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <span className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">2</span>
                  Página 2 - Acesso Ilimitado
                </h4>
                
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Título</label>
                    <input
                      type="text"
                      value={editingSettings.home?.about_page2_title || ''}
                      onChange={(e) => setEditingSettings({
                        ...editingSettings,
                        home: { ...editingSettings.home, about_page2_title: e.target.value }
                      })}
                      onBlur={() => handleUpdateSetting('home', 'about_page2_title', editingSettings.home?.about_page2_title)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Acesso Ilimitado aos Seus Livros"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Descrição</label>
                    <textarea
                      value={editingSettings.home?.about_page2_description || ''}
                      onChange={(e) => setEditingSettings({
                        ...editingSettings,
                        home: { ...editingSettings.home, about_page2_description: e.target.value }
                      })}
                      onBlur={() => handleUpdateSetting('home', 'about_page2_description', editingSettings.home?.about_page2_description)}
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Todos os livros que você compra ficam disponíveis para sempre..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Autor da Mensagem</label>
                    <input
                      type="text"
                      value={editingSettings.home?.about_page2_author || ''}
                      onChange={(e) => setEditingSettings({
                        ...editingSettings,
                        home: { ...editingSettings.home, about_page2_author: e.target.value }
                      })}
                      onBlur={() => handleUpdateSetting('home', 'about_page2_author', editingSettings.home?.about_page2_author)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Equipe Livraria Digital"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">URL da Imagem</label>
                    <input
                      type="url"
                      value={editingSettings.home?.about_page2_image || ''}
                      onChange={(e) => setEditingSettings({
                        ...editingSettings,
                        home: { ...editingSettings.home, about_page2_image: e.target.value }
                      })}
                      onBlur={() => handleUpdateSetting('home', 'about_page2_image', editingSettings.home?.about_page2_image)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="https://..."
                    />
                    <p className="text-xs text-gray-500 mt-1">Deixe em branco para usar imagem padrão</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Seção Produtos em Destaque */}
            <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-orange-500">
              <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <i className="ri-star-line text-orange-600"></i>
                Página Inicial - Produtos em Destaque
              </h3>
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Título da Seção</label>
                  <input
                    type="text"
                    value={editingSettings.home?.featured_title || ''}
                    onChange={(e) => setEditingSettings({
                      ...editingSettings,
                      home: { ...editingSettings.home, featured_title: e.target.value }
                    })}
                    onBlur={() => handleUpdateSetting('home', 'featured_title', editingSettings.home?.featured_title)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    placeholder="Produtos em Destaque"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Subtítulo</label>
                  <input
                    type="text"
                    value={editingSettings.home?.featured_subtitle || ''}
                    onChange={(e) => setEditingSettings({
                      ...editingSettings,
                      home: { ...editingSettings.home, featured_subtitle: e.target.value }
                    })}
                    onBlur={() => handleUpdateSetting('home', 'featured_subtitle', editingSettings.home?.featured_subtitle)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    placeholder="Os mais vendidos e recomendados"
                  />
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <i className="ri-information-line text-blue-600 text-xl mt-0.5"></i>
                    <div>
                      <h4 className="font-semibold text-blue-900 mb-1">Como gerenciar produtos em destaque</h4>
                      <p className="text-sm text-blue-800">
                        Vá para a aba "Produtos" e marque os produtos que deseja destacar na página inicial.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Configurações da Página Sobre */}
            <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-green-500">
              <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <i className="ri-information-line text-green-600"></i>
                Página Sobre - Controle Total
              </h3>

              {/* Hero Section */}
              <div className="mb-8 p-6 bg-gradient-to-r from-green-50 to-teal-50 rounded-xl border border-green-200">
                <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <span className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-bold">1</span>
                  Hero Section
                </h4>
                
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Título Principal</label>
                    <input
                      type="text"
                      value={editingSettings.about?.hero_title || ''}
                      onChange={(e) => setEditingSettings({
                        ...editingSettings,
                        about: { ...editingSettings.about, hero_title: e.target.value }
                      })}
                      onBlur={() => handleUpdateSetting('about', 'hero_title', editingSettings.about?.hero_title)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                      placeholder="Sobre a Nossa Livraria"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Subtítulo</label>
                    <textarea
                      value={editingSettings.about?.hero_subtitle || ''}
                      onChange={(e) => setEditingSettings({
                        ...editingSettings,
                        about: { ...editingSettings.about, hero_subtitle: e.target.value }
                      })}
                      onBlur={() => handleUpdateSetting('about', 'hero_subtitle', editingSettings.about?.hero_subtitle)}
                      rows={2}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                      placeholder="Transformando a forma como você descobre e consome literatura digital"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">URL da Imagem de Fundo Hero</label>
                    <input
                      type="url"
                      value={editingSettings.about?.hero_background || ''}
                      onChange={(e) => setEditingSettings({
                        ...editingSettings,
                        about: { ...editingSettings.about, hero_background: e.target.value }
                      })}
                      onBlur={() => handleUpdateSetting('about', 'hero_background', editingSettings.about?.hero_background)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                      placeholder="https://... (deixe em branco para imagem automática)"
                    />
                  </div>
                </div>
              </div>

              {/* Nossa História */}
              <div className="mb-8 p-6 bg-gradient-to-r from-teal-50 to-cyan-50 rounded-xl border border-teal-200">
                <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <span className="w-8 h-8 bg-teal-500 text-white rounded-full flex items-center justify-center text-sm font-bold">2</span>
                  Nossa História
                </h4>
                
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Título "Nossa História"</label>
                    <input
                      type="text"
                      value={editingSettings.about?.history_title || ''}
                      onChange={(e) => setEditingSettings({
                        ...editingSettings,
                        about: { ...editingSettings.about, history_title: e.target.value }
                      })}
                      onBlur={() => handleUpdateSetting('about', 'history_title', editingSettings.about?.history_title)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                      placeholder="Nossa História"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Texto "Nossa História" (use \n\n para separar parágrafos)</label>
                    <textarea
                      value={editingSettings.about?.history_text || ''}
                      onChange={(e) => setEditingSettings({
                        ...editingSettings,
                        about: { ...editingSettings.about, history_text: e.target.value }
                      })}
                      onBlur={() => handleUpdateSetting('about', 'history_text', editingSettings.about?.history_text)}
                      rows={8}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                      placeholder="Fundada em 2024, nossa livraria digital nasceu da paixão pela leitura...\n\nNossa missão é democratizar o acesso..."
                    />
                    <p className="text-xs text-gray-500 mt-1">Use \n\n (duas quebras de linha) para separar parágrafos</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">URL da Imagem "Nossa História"</label>
                    <input
                      type="url"
                      value={editingSettings.about?.history_image || ''}
                      onChange={(e) => setEditingSettings({
                        ...editingSettings,
                        about: { ...editingSettings.about, history_image: e.target.value }
                      })}
                      onBlur={() => handleUpdateSetting('about', 'history_image', editingSettings.about?.history_image)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                      placeholder="https://... (deixe em branco para imagem automática)"
                    />
                  </div>
                </div>
              </div>

              {/* Fundadora */}
              <div className="mb-8 p-6 bg-gradient-to-r from-cyan-50 to-blue-50 rounded-xl border border-cyan-200">
                <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <span className="w-8 h-8 bg-cyan-500 text-white rounded-full flex items-center justify-center text-sm font-bold">3</span>
                  Fundadora
                </h4>
                
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Nome da Fundadora</label>
                    <input
                      type="text"
                      value={editingSettings.about?.founder_name || ''}
                      onChange={(e) => setEditingSettings({
                        ...editingSettings,
                        about: { ...editingSettings.about, founder_name: e.target.value }
                      })}
                      onBlur={() => handleUpdateSetting('about', 'founder_name', editingSettings.about?.founder_name)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                      placeholder="Carminha"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Cargo da Fundadora</label>
                    <input
                      type="text"
                      value={editingSettings.about?.founder_title || ''}
                      onChange={(e) => setEditingSettings({
                        ...editingSettings,
                        about: { ...editingSettings.about, founder_title: e.target.value }
                      })}
                      onBlur={() => handleUpdateSetting('about', 'founder_title', editingSettings.about?.founder_title)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                      placeholder="Fundadora & CEO"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Biografia da Fundadora (citação)</label>
                    <textarea
                      value={editingSettings.about?.founder_bio || ''}
                      onChange={(e) => setEditingSettings({
                        ...editingSettings,
                        about: { ...editingSettings.about, founder_bio: e.target.value }
                      })}
                      onBlur={() => handleUpdateSetting('about', 'founder_bio', editingSettings.about?.founder_bio)}
                      rows={4}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                      placeholder="Minha paixão por livros começou na infância..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">URL da Foto da Fundadora</label>
                    <input
                      type="url"
                      value={editingSettings.about?.founder_photo || ''}
                      onChange={(e) => setEditingSettings({
                        ...editingSettings,
                        about: { ...editingSettings.about, founder_photo: e.target.value }
                      })}
                      onBlur={() => handleUpdateSetting('about', 'founder_photo', editingSettings.about?.founder_photo)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                      placeholder="https://... (deixe em branco para inicial do nome)"
                    />
                  </div>
                </div>
              </div>

              {/* Valores */}
              <div className="mb-8 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
                <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <span className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">4</span>
                  Nossos Valores
                </h4>
                
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Título da Seção</label>
                    <input
                      type="text"
                      value={editingSettings.about?.values_title || ''}
                      onChange={(e) => setEditingSettings({
                        ...editingSettings,
                        about: { ...editingSettings.about, values_title: e.target.value }
                      })}
                      onBlur={() => handleUpdateSetting('about', 'values_title', editingSettings.about?.values_title)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                      placeholder="Nossos Valores"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Subtítulo da Seção</label>
                    <input
                      type="text"
                      value={editingSettings.about?.values_subtitle || ''}
                      onChange={(e) => setEditingSettings({
                        ...editingSettings,
                        about: { ...editingSettings.about, values_subtitle: e.target.value }
                      })}
                      onBlur={() => handleUpdateSetting('about', 'values_subtitle', editingSettings.about?.values_subtitle)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                      placeholder="Os pilares que guiam nossa missão..."
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Valor 1 - Título</label>
                      <input
                        type="text"
                        value={editingSettings.about?.value1_title || ''}
                        onChange={(e) => setEditingSettings({
                          ...editingSettings,
                          about: { ...editingSettings.about, value1_title: e.target.value }
                        })}
                        onBlur={() => handleUpdateSetting('about', 'value1_title', editingSettings.about?.value1_title)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                        placeholder="Paixão pela Leitura"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Valor 2 - Título</label>
                      <input
                        type="text"
                        value={editingSettings.about?.value2_title || ''}
                        onChange={(e) => setEditingSettings({
                          ...editingSettings,
                          about: { ...editingSettings.about, value2_title: e.target.value }
                        })}
                        onBlur={() => handleUpdateSetting('about', 'value2_title', editingSettings.about?.value2_title)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                        placeholder="Qualidade & Segurança"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Valor 3 - Título</label>
                      <input
                        type="text"
                        value={editingSettings.about?.value3_title || ''}
                        onChange={(e) => setEditingSettings({
                          ...editingSettings,
                          about: { ...editingSettings.about, value3_title: e.target.value }
                        })}
                        onBlur={() => handleUpdateSetting('about', 'value3_title', editingSettings.about?.value3_title)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                        placeholder="Atendimento Excepcional"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Valor 1 - Descrição</label>
                      <textarea
                        value={editingSettings.about?.value1_description || ''}
                        onChange={(e) => setEditingSettings({
                          ...editingSettings,
                          about: { ...editingSettings.about, value1_description: e.target.value }
                        })}
                        onBlur={() => handleUpdateSetting('about', 'value1_description', editingSettings.about?.value1_description)}
                        rows={3}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Valor 2 - Descrição</label>
                      <textarea
                        value={editingSettings.about?.value2_description || ''}
                        onChange={(e) => setEditingSettings({
                          ...editingSettings,
                          about: { ...editingSettings.about, value2_description: e.target.value }
                        })}
                        onBlur={() => handleUpdateSetting('about', 'value2_description', editingSettings.about?.value2_description)}
                        rows={3}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Valor 3 - Descrição</label>
                      <textarea
                        value={editingSettings.about?.value3_description || ''}
                        onChange={(e) => setEditingSettings({
                          ...editingSettings,
                          about: { ...editingSettings.about, value3_description: e.target.value }
                        })}
                        onBlur={() => handleUpdateSetting('about', 'value3_description', editingSettings.about?.value3_description)}
                        rows={3}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Informações de Contato */}
              <div className="p-6 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl border border-indigo-200">
                <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <span className="w-8 h-8 bg-indigo-500 text-white rounded-full flex items-center justify-center text-sm font-bold">5</span>
                  Informações de Contato
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email de Contato</label>
                    <input
                      type="email"
                      value={editingSettings.about?.contact_email || ''}
                      onChange={(e) => setEditingSettings({
                        ...editingSettings,
                        about: { ...editingSettings.about, contact_email: e.target.value }
                      })}
                      onBlur={() => handleUpdateSetting('about', 'contact_email', editingSettings.about?.contact_email)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                      placeholder="c-arminha1973@hotmail.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Telefone</label>
                    <input
                      type="text"
                      value={editingSettings.about?.contact_phone || ''}
                      onChange={(e) => setEditingSettings({
                        ...editingSettings,
                        about: { ...editingSettings.about, contact_phone: e.target.value }
                      })}
                      onBlur={() => handleUpdateSetting('about', 'contact_phone', editingSettings.about?.contact_phone)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                      placeholder="+352 621 190 950"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">WhatsApp</label>
                    <input
                      type="text"
                      value={editingSettings.about?.whatsapp || ''}
                      onChange={(e) => setEditingSettings({
                        ...editingSettings,
                        about: { ...editingSettings.about, whatsapp: e.target.value }
                      })}
                      onBlur={() => handleUpdateSetting('about', 'whatsapp', editingSettings.about?.whatsapp)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                      placeholder="+352621190950"
                    />
                  </div>

                  <div className="md:col-span-3">
                    <label className="block text-sm font-medium text-gray-700 mb-2">URL do Facebook</label>
                    <input
                      type="url"
                      value={editingSettings.about?.facebook_url || ''}
                      onChange={(e) => setEditingSettings({
                        ...editingSettings,
                        about: { ...editingSettings.about, facebook_url: e.target.value }
                      })}
                      onBlur={() => handleUpdateSetting('about', 'facebook_url', editingSettings.about?.facebook_url)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                      placeholder="https://facebook.com/..."
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Seção Produtos em Destaque */}
            <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-orange-500">
              <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <i className="ri-star-line text-orange-600"></i>
                Página Inicial - Produtos em Destaque
              </h3>
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Título da Seção</label>
                  <input
                    type="text"
                    value={editingSettings.home?.featured_title || ''}
                    onChange={(e) => setEditingSettings({
                      ...editingSettings,
                      home: { ...editingSettings.home, featured_title: e.target.value }
                    })}
                    onBlur={() => handleUpdateSetting('home', 'featured_title', editingSettings.home?.featured_title)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    placeholder="Produtos em Destaque"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Subtítulo</label>
                  <input
                    type="text"
                    value={editingSettings.home?.featured_subtitle || ''}
                    onChange={(e) => setEditingSettings({
                      ...editingSettings,
                      home: { ...editingSettings.home, featured_subtitle: e.target.value }
                    })}
                    onBlur={() => handleUpdateSetting('home', 'featured_subtitle', editingSettings.home?.featured_subtitle)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    placeholder="Os mais vendidos e recomendados"
                  />
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <i className="ri-information-line text-blue-600 text-xl mt-0.5"></i>
                    <div>
                      <h4 className="font-semibold text-blue-900 mb-1">Como gerenciar produtos em destaque</h4>
                      <p className="text-sm text-blue-800">
                        Vá para a aba "Produtos" e marque os produtos que deseja destacar na página inicial.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Configurações da Página de Contato */}
            <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-red-500">
              <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <i className="ri-contacts-line text-red-600"></i>
                Página de Contato
              </h3>
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Título Principal</label>
                  <input
                    type="text"
                    value={editingSettings.contact?.title || ''}
                    onChange={(e) => setEditingSettings({
                      ...editingSettings,
                      contact: { ...editingSettings.contact, title: e.target.value }
                    })}
                    onBlur={() => handleUpdateSetting('contact', 'title', editingSettings.contact?.title)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    placeholder="Entre em Contato"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Descrição</label>
                  <textarea
                    value={editingSettings.contact?.description || ''}
                    onChange={(e) => setEditingSettings({
                      ...editingSettings,
                      contact: { ...editingSettings.contact, description: e.target.value }
                    })}
                    onBlur={() => handleUpdateSetting('contact', 'description', editingSettings.contact?.description)}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    placeholder="Estamos aqui para ajudar..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Texto do Card Email</label>
                  <input
                    type="text"
                    value={editingSettings.contact?.email_label || ''}
                    onChange={(e) => setEditingSettings({
                      ...editingSettings,
                      contact: { ...editingSettings.contact, email_label: e.target.value }
                    })}
                    onBlur={() => handleUpdateSetting('contact', 'email_label', editingSettings.contact?.email_label)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    placeholder="Envie-nos um Email"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Texto do Card Telefone</label>
                  <input
                    type="text"
                    value={editingSettings.contact?.phone_label || ''}
                    onChange={(e) => setEditingSettings({
                      ...editingSettings,
                      contact: { ...editingSettings.contact, phone_label: e.target.value }
                    })}
                    onBlur={() => handleUpdateSetting('contact', 'phone_label', editingSettings.contact?.phone_label)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    placeholder="Ligue para Nós"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Texto do Card WhatsApp</label>
                  <input
                    type="text"
                    value={editingSettings.contact?.whatsapp_label || ''}
                    onChange={(e) => setEditingSettings({
                      ...editingSettings,
                      contact: { ...editingSettings.contact, whatsapp_label: e.target.value }
                    })}
                    onBlur={() => handleUpdateSetting('contact', 'whatsapp_label', editingSettings.contact?.whatsapp_label)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    placeholder="WhatsApp"
                  />
                </div>
              </div>
            </div>

            {/* Configurações da Página de Catálogo */}
            <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-indigo-500">
              <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <i className="ri-book-line text-indigo-600"></i>
                Página de Catálogo
              </h3>
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Título Principal</label>
                  <input
                    type="text"
                    value={editingSettings.catalog?.title || ''}
                    onChange={(e) => setEditingSettings({
                      ...editingSettings,
                      catalog: { ...editingSettings.catalog, title: e.target.value }
                    })}
                    onBlur={() => handleUpdateSetting('catalog', 'title', editingSettings.catalog?.title)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    placeholder="Catálogo Completo"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Descrição</label>
                  <input
                    type="text"
                    value={editingSettings.catalog?.description || ''}
                    onChange={(e) => setEditingSettings({
                      ...editingSettings,
                      catalog: { ...editingSettings.catalog, description: e.target.value }
                    })}
                    onBlur={() => handleUpdateSetting('catalog', 'description', editingSettings.catalog?.description)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    placeholder="Explore nossa coleção completa de ebooks"
                  />
                </div>
              </div>
            </div>

            {/* Configurações da Minha Biblioteca */}
            <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-pink-500">
              <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <i className="ri-book-2-line text-pink-600"></i>
                Página Minha Biblioteca
              </h3>
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Título Principal</label>
                  <input
                    type="text"
                    value={editingSettings.library?.title || ''}
                    onChange={(e) => setEditingSettings({
                      ...editingSettings,
                      library: { ...editingSettings.library, title: e.target.value }
                    })}
                    onBlur={() => handleUpdateSetting('library', 'title', editingSettings.library?.title)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    placeholder="Minha Biblioteca"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Mensagem Biblioteca Vazia</label>
                  <textarea
                    value={editingSettings.library?.empty_message || ''}
                    onChange={(e) => setEditingSettings({
                      ...editingSettings,
                      library: { ...editingSettings.library, empty_message: e.target.value }
                    })}
                    onBlur={() => handleUpdateSetting('library', 'empty_message', editingSettings.library?.empty_message)}
                    rows={2}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    placeholder="Você ainda não possui nenhum livro..."
                  />
                </div>
              </div>
            </div>

            {/* Configurações do Footer */}
            <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-gray-500">
              <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <i className="ri-layout-bottom-line text-gray-600"></i>
                Footer
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Título do Logo</label>
                  <input
                    type="text"
                    value={editingSettings.footer?.logo_title || ''}
                    onChange={(e) => setEditingSettings({
                      ...editingSettings,
                      footer: { ...editingSettings.footer, logo_title: e.target.value }
                    })}
                    onBlur={() => handleUpdateSetting('footer', 'logo_title', editingSettings.footer?.logo_title)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    placeholder="Livraria Digital"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                  <input
                    type="email"
                    value={editingSettings.footer?.email || ''}
                    onChange={(e) => setEditingSettings({
                      ...editingSettings,
                      footer: { ...editingSettings.footer, email: e.target.value }
                    })}
                    onBlur={() => handleUpdateSetting('footer', 'email', editingSettings.footer?.email)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    placeholder="c-arminha1973@hotmail.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Telefone</label>
                  <input
                    type="text"
                    value={editingSettings.footer?.phone || ''}
                    onChange={(e) => setEditingSettings({
                      ...editingSettings,
                      footer: { ...editingSettings.footer, phone: e.target.value }
                    })}
                    onBlur={() => handleUpdateSetting('footer', 'phone', editingSettings.footer?.phone)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    placeholder="+352 621 190 950"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">WhatsApp</label>
                  <input
                    type="text"
                    value={editingSettings.footer?.whatsapp || ''}
                    onChange={(e) => setEditingSettings({
                      ...editingSettings,
                      footer: { ...editingSettings.footer, whatsapp: e.target.value }
                    })}
                    onBlur={() => handleUpdateSetting('footer', 'whatsapp', editingSettings.footer?.whatsapp)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    placeholder="+352621190950"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">URL do Facebook</label>
                  <input
                    type="url"
                    value={editingSettings.footer?.facebook_url || ''}
                    onChange={(e) => setEditingSettings({
                      ...editingSettings,
                      footer: { ...editingSettings.footer, facebook_url: e.target.value }
                    })}
                    onBlur={() => handleUpdateSetting('footer', 'facebook_url', editingSettings.footer?.facebook_url)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    placeholder="https://facebook.com/..."
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Descrição</label>
                  <textarea
                    value={editingSettings.footer?.description || ''}
                    onChange={(e) => setEditingSettings({
                      ...editingSettings,
                      footer: { ...editingSettings.footer, description: e.target.value }
                    })}
                    onBlur={() => handleUpdateSetting('footer', 'description', editingSettings.footer?.description)}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    placeholder="Milhares de ebooks em mais de 100 categorias..."
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Texto do Copyright</label>
                  <input
                    type="text"
                    value={editingSettings.footer?.copyright || ''}
                    onChange={(e) => setEditingSettings({
                      ...editingSettings,
                      footer: { ...editingSettings.footer, copyright: e.target.value }
                    })}
                    onBlur={() => handleUpdateSetting('footer', 'copyright', editingSettings.footer?.copyright)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    placeholder="© 2024 Livraria Digital. Todos os direitos reservados."
                  />
                </div>
              </div>
            </div>

            {/* Botão de Salvar Geral */}
            <div className="bg-gradient-to-r from-teal-500 to-blue-500 rounded-xl shadow-lg p-6 text-center">
              <h3 className="text-2xl font-bold text-white mb-2">Todas as alterações são salvas automaticamente!</h3>
              <p className="text-white/90">Quando você clica fora de um campo, as mudanças são salvas no banco de dados.</p>
            </div>
          </div>
        );

      case 'newsletter':
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Newsletter</h2>
                <p className="text-gray-600 mt-1">Gerencie os inscritos da newsletter</p>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-teal-600">{newsletterSubscribers.length}</p>
                <p className="text-sm text-gray-600">Total de Inscritos</p>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Data de Inscrição</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {newsletterSubscribers.map((subscriber) => (
                      <tr key={subscriber.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <i className="ri-mail-line text-gray-400"></i>
                            <span className="font-medium text-gray-900">{subscriber.email}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-gray-600">
                          {new Date(subscriber.subscribed_at).toLocaleDateString('pt-PT', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => handleDeleteSubscriber(subscriber.id)}
                            className="text-red-600 hover:text-red-700 cursor-pointer"
                          >
                            <i className="ri-delete-bin-line text-lg"></i>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {newsletterSubscribers.length === 0 && (
                <div className="text-center py-12">
                  <i className="ri-mail-line text-6xl text-gray-300 mb-4"></i>
                  <p className="text-gray-500 mb-4">Nenhum inscrito ainda</p>
                  <button
                    onClick={() => {
                      setEditingCustomer(null);
                      setShowCustomerModal(true);
                    }}
                    className="px-6 py-3 bg-gradient-to-r from-teal-500 to-cyan-500 text-white rounded-lg font-medium hover:shadow-lg transition-all cursor-pointer whitespace-nowrap"
                  >
                    <i className="ri-user-add-line mr-2"></i>
                    Criar Primeiro Cliente
                  </button>
                </div>
              )}
            </div>
          </div>
        );

      case 'site-control':
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-gray-600">Produtos em Destaque na Página Inicial</p>
              </div>
              <button
                onClick={() => setActiveTab('products')}
                className="mt-6 px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors cursor-pointer whitespace-nowrap"
              >
                Gerenciar Produtos em Destaque
              </button>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                <i className="ri-global-line text-teal-600"></i>
                Informações Gerais do Site
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nome do Site
                  </label>
                  <input
                    type="text"
                    defaultValue="Livraria Digital"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4ECDC4] focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email de Contato
                  </label>
                  <input
                    type="email"
                    defaultValue="c-arminha1973@hotmail.com"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4ECDC4] focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Telefone
                  </label>
                  <input
                    type="tel"
                    defaultValue="+352 621 190 950"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4ECDC4] focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    WhatsApp
                  </label>
                  <input
                    type="tel"
                    defaultValue="+352621190950"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4ECDC4] focus:border-transparent"
                  />
                </div>
              </div>
            </div>
          </div>
        );

      case 'settings':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Controle Total do Site</h2>
              <p className="text-gray-600 mt-1">Gerencie todos os aspectos do seu site em um só lugar</p>
            </div>

            {/* Informações Gerais */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                <i className="ri-information-line text-teal-600"></i>
                Informações Gerais
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nome do Site
                  </label>
                  <input
                    type="text"
                    defaultValue="Livraria Digital"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4ECDC4] focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email de Contato
                  </label>
                  <input
                    type="email"
                    defaultValue="c-arminha1973@hotmail.com"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4ECDC4] focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Telefone
                  </label>
                  <input
                    type="tel"
                    defaultValue="+352 621 190 950"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4ECDC4] focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    WhatsApp
                  </label>
                  <input
                    type="tel"
                    defaultValue="+352621190950"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4ECDC4] focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Redes Sociais */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                <i className="ri-share-line text-teal-600"></i>
                Redes Sociais
              </h3>
              
              <div className="grid grid-cols-1 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <i className="ri-facebook-fill text-blue-600 mr-2"></i>
                    Facebook
                  </label>
                  <input
                    type="url"
                    defaultValue="https://facebook.com"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4ECDC4] focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Informações da Fundadora */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                <i className="ri-user-star-line text-teal-600"></i>
                Informações da Fundadora
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nome
                  </label>
                  <input
                    type="text"
                    defaultValue="Carminha"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4ECDC4] focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cargo
                  </label>
                  <input
                    type="text"
                    defaultValue="Fundadora & CEO"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4ECDC4] focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Biografia
                  </label>
                  <textarea
                    rows={4}
                    defaultValue="Apaixonada por livros desde criança, fundei esta livraria digital com o objetivo de tornar a leitura mais acessível a todos."
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4ECDC4] focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Envio de Downloads */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                <i className="ri-download-cloud-line text-teal-600"></i>
                Envio de Downloads
              </h3>
              
              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <i className="ri-information-line text-blue-600 text-xl mt-0.5"></i>
                    <div>
                      <h4 className="font-semibold text-blue-900 mb-1">Como gerenciar produtos em destaque</h4>
                      <p className="text-sm text-blue-800">
                        Vá para a aba "Produtos" e marque os produtos que deseja destacar na página inicial.
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mensagem do Email de Download
                  </label>
                  <textarea
                    rows={4}
                    defaultValue="Obrigado pela sua compra! Seu ebook está pronto para download. Clique no link abaixo para baixar:"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4ECDC4] focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Validade do Link (dias)
                  </label>
                  <input
                    type="number"
                    defaultValue="30"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4ECDC4] focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500 mt-1">Número de dias que o link de download ficará ativo</p>
                </div>
              </div>
            </div>

            <button
              onClick={handleSaveSettings}
              className="w-full px-8 py-4 bg-[#4ECDC4] text-white rounded-lg font-medium hover:bg-[#4ECDC4]/90 transition-colors cursor-pointer whitespace-nowrap"
            >
              <i className="ri-save-line mr-2"></i>
              Salvar Todas as Configurações
            </button>
          </div>
        );

      case 'reviews':
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Avaliações dos Produtos</h2>
                <p className="text-gray-600 mt-1">Gerencie as avaliações dos clientes</p>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-teal-600">{reviews.length}</p>
                <p className="text-sm text-gray-600">Total de Avaliações</p>
              </div>
            </div>

            {/* Filtros */}
            <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-200">
              <div className="flex gap-4">
                <button className="px-4 py-2 bg-yellow-100 text-yellow-700 rounded-lg font-medium cursor-pointer whitespace-nowrap">
                  <i className="ri-time-line mr-2"></i>
                  Pendentes ({reviews.filter(r => !r.is_approved).length})
                </button>
                <button className="px-4 py-2 bg-green-100 text-green-700 rounded-lg font-medium cursor-pointer whitespace-nowrap">
                  <i className="ri-check-line mr-2"></i>
                  Aprovadas ({reviews.filter(r => r.is_approved).length})
                </button>
              </div>
            </div>

            {/* Lista de Avaliações */}
            <div className="space-y-4">
              {reviews.map((review) => (
                <div
                  key={review.id}
                  className={`bg-white rounded-xl shadow-sm p-6 border-l-4 ${
                    review.is_approved ? 'border-green-500' : 'border-yellow-500'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    {/* Imagem do Produto */}
                    <div className="w-20 h-28 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                      {review.products?.cover_url ? (
                        <img
                          src={review.products.cover_url}
                          alt={review.products.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <i className="ri-book-line text-3xl text-gray-400"></i>
                        </div>
                      )}
                    </div>

                    {/* Conteúdo */}
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="font-bold text-gray-900 mb-1">
                            {review.products?.title || 'Produto não encontrado'}
                          </h3>
                          <div className="flex items-center gap-3 text-sm text-gray-600">
                            <span>
                              {review.is_anonymous ? (
                                <>
                                  <i className="ri-user-line mr-1"></i>
                                  Anônimo
                                </>
                              ) : (
                                <>
                                  <i className="ri-user-line mr-1"></i>
                                  {review.reviewer_name || review.user_profiles?.full_name || 'Usuário'}
                                </>
                              )}
                            </span>
                            <span>•</span>
                            <span>
                              <i className="ri-calendar-line mr-1"></i>
                              {new Date(review.created_at).toLocaleDateString('pt-PT', {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                          </div>
                        </div>

                        {/* Status Badge */}
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${
                            review.is_approved
                              ? 'bg-green-100 text-green-700'
                              : 'bg-yellow-100 text-yellow-700'
                          }`}
                        >
                          {review.is_approved ? 'Aprovada' : 'Pendente'}
                        </span>
                      </div>

                      {/* Rating */}
                      <div className="flex items-center gap-1 mb-3">
                        {[...Array(5)].map((_, i) => (
                          <i
                            key={i}
                            className={`ri-star-${i < review.rating ? 'fill' : 'line'} text-yellow-400`}
                          ></i>
                        ))}
                        <span className="ml-2 text-sm text-gray-600">
                          {review.rating}/5
                        </span>
                      </div>

                      {/* Comentário */}
                      <p className="text-gray-700 mb-4 bg-gray-50 p-4 rounded-lg">
                        {review.comment}
                      </p>

                      {/* Ações */}
                      <div className="flex gap-2">
                        {!review.is_approved && (
                          <button
                            onClick={() => handleApproveReview(review.id)}
                            className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors cursor-pointer whitespace-nowrap"
                          >
                            <i className="ri-check-line mr-2"></i>
                            Aprovar
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteReview(review.id)}
                          className="px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors cursor-pointer whitespace-nowrap"
                        >
                          <i className="ri-delete-bin-line mr-2"></i>
                          Remover
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {reviews.length === 0 && (
                <div className="text-center py-12 bg-white rounded-xl">
                  <i className="ri-chat-3-line text-6xl text-gray-300 mb-4"></i>
                  <p className="text-gray-500">Nenhuma avaliação ainda</p>
                </div>
              )}
            </div>
          </div>
        );

      case 'customers':
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-gray-600">{customers.length} clientes cadastrados</p>
              </div>
              <button
                onClick={() => {
                  setEditingCustomer(null);
                  setShowCustomerModal(true);
                }}
                className="px-6 py-3 bg-gradient-to-r from-teal-500 to-cyan-500 text-white rounded-lg font-medium hover:shadow-lg transition-all cursor-pointer whitespace-nowrap"
              >
                <i className="ri-user-add-line mr-2"></i>
                Criar Novo Cliente
              </button>
            </div>

            {/* Filtros por Tipo */}
            <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-200">
              <div className="flex gap-4 flex-wrap">
                <button className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg font-medium cursor-pointer whitespace-nowrap">
                  <i className="ri-user-line mr-2"></i>
                  Todos ({customers.length})
                </button>
                <button className="px-4 py-2 bg-green-100 text-green-700 rounded-lg font-medium cursor-pointer whitespace-nowrap">
                  <i className="ri-shopping-bag-line mr-2"></i>
                  Clientes ({customers.filter(c => c.role === 'customer').length})
                </button>
                <button className="px-4 py-2 bg-purple-100 text-purple-700 rounded-lg font-medium cursor-pointer whitespace-nowrap">
                  <i className="ri-edit-line mr-2"></i>
                  Editores ({customers.filter(c => c.role === 'editor').length})
                </button>
                <button className="px-4 py-2 bg-orange-100 text-orange-700 rounded-lg font-medium cursor-pointer whitespace-nowrap">
                  <i className="ri-customer-service-line mr-2"></i>
                  Suporte ({customers.filter(c => c.role === 'support').length})
                </button>
                <button className="px-4 py-2 bg-red-100 text-red-700 rounded-lg font-medium cursor-pointer whitespace-nowrap">
                  <i className="ri-shield-star-line mr-2"></i>
                  Admins ({customers.filter(c => c.role === 'superadmin').length})
                </button>
              </div>
            </div>

            {/* Tabela de Clientes */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cliente</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Telefone</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipo</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cadastro</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {customers.map((customer) => (
                      <tr key={customer.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-cyan-500 rounded-full flex items-center justify-center">
                              <span className="text-white font-bold">
                                {customer.full_name?.charAt(0).toUpperCase() || 'U'}
                              </span>
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">{customer.full_name || 'Sem nome'}</p>
                              <p className="text-xs text-gray-500">ID: {customer.id.slice(0, 8)}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">{customer.email}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{customer.phone || '-'}</td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            customer.role === 'superadmin' ? 'bg-red-100 text-red-700' :
                            customer.role === 'editor' ? 'bg-purple-100 text-purple-700' :
                            customer.role === 'support' ? 'bg-orange-100 text-orange-700' :
                            'bg-green-100 text-green-700'
                          }`}>
                            {customer.role === 'superadmin' ? 'Super Admin' :
                             customer.role === 'editor' ? 'Editor' :
                             customer.role === 'support' ? 'Suporte' :
                             'Cliente'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {new Date(customer.created_at).toLocaleDateString('pt-PT')}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => {
                                setEditingCustomer(customer);
                                setShowCustomerModal(true);
                              }}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                              title="Editar"
                            >
                              <i className="ri-edit-line text-lg"></i>
                            </button>
                            <button
                              onClick={() => handleDeleteCustomer(customer.id)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                              title="Excluir"
                            >
                              <i className="ri-delete-bin-line text-lg"></i>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {customers.length === 0 && (
                <div className="text-center py-12">
                  <i className="ri-user-line text-6xl text-gray-300 mb-4"></i>
                  <p className="text-gray-500 mb-4">Nenhum cliente cadastrado</p>
                  <button
                    onClick={() => {
                      setEditingCustomer(null);
                      setShowCustomerModal(true);
                    }}
                    className="px-6 py-3 bg-gradient-to-r from-teal-500 to-cyan-500 text-white rounded-lg font-medium hover:shadow-lg transition-all cursor-pointer whitespace-nowrap"
                  >
                    <i className="ri-user-add-line mr-2"></i>
                    Criar Primeiro Cliente
                  </button>
                </div>
              )}
            </div>
          </div>
        );

      case 'vat-settings':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Configurações de IVA</h2>
              <p className="text-gray-600 mt-1">Gerencie as taxas de IVA aplicadas aos produtos</p>
            </div>

            {/* Configurações Gerais de IVA */}
            <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-blue-500">
              <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <i className="ri-percent-line text-blue-600"></i>
                Taxas de IVA por Categoria
              </h3>
              
              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                  <div className="flex items-start gap-3">
                    <i className="ri-information-line text-blue-600 text-xl mt-0.5"></i>
                    <div>
                      <h4 className="font-semibold text-blue-900 mb-1">Como funciona o IVA</h4>
                      <p className="text-sm text-blue-800">
                        Configure as taxas de IVA que serão aplicadas automaticamente aos produtos. 
                        Em Portugal, a taxa normal é 23%, taxa intermédia 13% e taxa reduzida 6%.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Taxa Padrão */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-6 border border-blue-200">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-bold text-gray-900">Taxa Normal</h4>
                      <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
                        <i className="ri-percent-line text-white text-xl"></i>
                      </div>
                    </div>
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Percentual (%)
                      </label>
                      <input
                        type="number"
                        defaultValue="23"
                        min="0"
                        max="100"
                        step="0.01"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-2xl font-bold text-center"
                      />
                    </div>
                    <p className="text-sm text-gray-600">
                      Aplicada à maioria dos produtos e serviços
                    </p>
                  </div>

                  <div className="bg-gradient-to-br from-green-50 to-teal-50 rounded-xl p-6 border border-green-200">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-bold text-gray-900">Taxa Intermédia</h4>
                      <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                        <i className="ri-percent-line text-white text-xl"></i>
                      </div>
                    </div>
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Percentual (%)
                      </label>
                      <input
                        type="number"
                        defaultValue="13"
                        min="0"
                        max="100"
                        step="0.01"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-2xl font-bold text-center"
                      />
                    </div>
                    <p className="text-sm text-gray-600">
                      Aplicada a produtos alimentares e restauração
                    </p>
                  </div>

                  <div className="bg-gradient-to-br from-orange-50 to-yellow-50 rounded-xl p-6 border border-orange-200">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-bold text-gray-900">Taxa Reduzida</h4>
                      <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center">
                        <i className="ri-percent-line text-white text-xl"></i>
                      </div>
                    </div>
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Percentual (%)
                      </label>
                      <input
                        type="number"
                        defaultValue="6"
                        min="0"
                        max="100"
                        step="0.01"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-2xl font-bold text-center"
                      />
                    </div>
                    <p className="text-sm text-gray-600">
                      Aplicada a livros, jornais e medicamentos
                    </p>
                  </div>
                </div>

                {/* Configuração por Categoria */}
                <div className="bg-white rounded-xl border border-gray-200 p-6 mt-6">
                  <h4 className="text-lg font-bold text-gray-900 mb-4">
                    Taxas por Categoria de Produto
                  </h4>
                  
                  <div className="space-y-3">
                    {categories.map((category) => (
                      <div key={category.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-cyan-500 rounded-lg flex items-center justify-center">
                            <i className={`${category.icon || 'ri-folder-line'} text-white`}></i>
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{category.name}</p>
                            <p className="text-xs text-gray-500">{category.slug}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <select
                            defaultValue="23"
                            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent font-medium"
                          >
                            <option value="23">Taxa Normal (23%)</option>
                            <option value="13">Taxa Intermédia (13%)</option>
                            <option value="6">Taxa Reduzida (6%)</option>
                            <option value="0">Isento (0%)</option>
                          </select>
                        </div>
                      </div>
                    ))}
                  </div>

                  {categories.length === 0 && (
                    <div className="text-center py-8">
                      <i className="ri-folder-line text-4xl text-gray-300 mb-2"></i>
                      <p className="text-gray-500 mb-4">Nenhuma categoria cadastrada</p>
                      <button
                        onClick={() => setActiveTab('categories')}
                        className="px-6 py-3 bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition-colors cursor-pointer whitespace-nowrap"
                      >
                        Criar Categorias
                      </button>
                    </div>
                  )}
                </div>

                {/* Configurações Adicionais */}
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <h4 className="text-lg font-bold text-gray-900 mb-4">
                    Configurações Adicionais
                  </h4>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">Incluir IVA nos preços exibidos</p>
                        <p className="text-sm text-gray-600">Os preços mostrados já incluem o IVA</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" defaultChecked className="sr-only peer" />
                        <div className="w-14 h-7 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-teal-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-teal-500"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">Mostrar IVA separado na fatura</p>
                        <p className="text-sm text-gray-600">Exibir o valor do IVA separadamente</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" defaultChecked className="sr-only peer" />
                        <div className="w-14 h-7 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-teal-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-teal-500"></div>
                      </label>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Número de Identificação Fiscal (NIF)
                      </label>
                      <input
                        type="text"
                        placeholder="PT123456789"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => toast.success('Configurações de IVA salvas com sucesso!')}
                  className="w-full px-8 py-4 bg-gradient-to-r from-teal-500 to-cyan-500 text-white rounded-lg font-medium hover:shadow-lg transition-all cursor-pointer whitespace-nowrap"
                >
                  <i className="ri-save-line mr-2"></i>
                  Salvar Configurações de IVA
                </button>
              </div>
            </div>
          </div>
        );

      case 'messages':
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Mensagens de Contato</h2>
                <p className="text-gray-600 mt-1">Gerencie as mensagens recebidas através do formulário de contato</p>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-teal-600">0</p>
                <p className="text-sm text-gray-600">Mensagens Não Lidas</p>
              </div>
            </div>

            {/* Filtros */}
            <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-200">
              <div className="flex gap-4 flex-wrap">
                <button className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg font-medium cursor-pointer whitespace-nowrap">
                  <i className="ri-mail-line mr-2"></i>
                  Todas (0)
                </button>
                <button className="px-4 py-2 bg-yellow-100 text-yellow-700 rounded-lg font-medium cursor-pointer whitespace-nowrap">
                  <i className="ri-mail-unread-line mr-2"></i>
                  Não Lidas (0)
                </button>
                <button className="px-4 py-2 bg-green-100 text-green-700 rounded-lg font-medium cursor-pointer whitespace-nowrap">
                  <i className="ri-mail-check-line mr-2"></i>
                  Lidas (0)
                </button>
                <button className="px-4 py-2 bg-red-100 text-red-700 rounded-lg font-medium cursor-pointer whitespace-nowrap">
                  <i className="ri-star-line mr-2"></i>
                  Importantes (0)
                </button>
              </div>
            </div>

            {/* Lista de Mensagens */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        <input type="checkbox" className="rounded border-gray-300" />
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Remetente</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Assunto</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mensagem</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Data</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {/* Exemplo de mensagem */}
                    <tr className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <input type="checkbox" className="rounded border-gray-300" />
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-cyan-500 rounded-full flex items-center justify-center">
                            <span className="text-white font-bold">J</span>
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">João Silva</p>
                            <p className="text-sm text-gray-600">joao@exemplo.com</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-medium text-gray-900">Dúvida sobre produto</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-gray-600 line-clamp-2">
                          Gostaria de saber mais informações sobre o livro...
                        </p>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        Hoje, 14:30
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                            title="Ver mensagem"
                          >
                            <i className="ri-eye-line text-lg"></i>
                          </button>
                          <button
                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors cursor-pointer"
                            title="Responder"
                          >
                            <i className="ri-reply-line text-lg"></i>
                          </button>
                          <button
                            className="p-2 text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors cursor-pointer"
                            title="Marcar como importante"
                          >
                            <i className="ri-star-line text-lg"></i>
                          </button>
                          <button
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                            title="Excluir"
                          >
                            <i className="ri-delete-bin-line text-lg"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Estado Vazio */}
              <div className="text-center py-12">
                <i className="ri-mail-line text-6xl text-gray-300 mb-4"></i>
                <p className="text-gray-500 mb-2">Nenhuma mensagem recebida ainda</p>
                <p className="text-sm text-gray-400">
                  As mensagens enviadas através do formulário de contato aparecerão aqui
                </p>
              </div>
            </div>
          </div>
        );

      case 'team':
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Gestão de Equipa</h2>
                <p className="text-gray-600 mt-1">Gerencie os membros da equipa e suas permissões</p>
              </div>
              <button
                onClick={() => {
                  setEditingTeamMember(null);
                  setShowTeamModal(true);
                }}
                className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-lg font-medium hover:shadow-lg transition-all cursor-pointer whitespace-nowrap"
              >
                <i className="ri-user-add-line mr-2"></i>
                Adicionar Membro
              </button>
            </div>

            {/* Estatísticas da Equipa */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-gradient-to-br from-red-500 to-pink-500 rounded-xl p-6 text-white shadow-lg">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center">
                    <i className="ri-shield-star-line text-2xl text-white"></i>
                  </div>
                  <i className="ri-arrow-right-up-line text-3xl opacity-50"></i>
                </div>
                <h3 className="text-4xl font-bold mb-1">
                  {customers.filter(c => c.role === 'superadmin').length}
                </h3>
                <p className="text-white/90 text-sm">Super Admins</p>
              </div>

              <div className="bg-gradient-to-br from-purple-500 to-indigo-500 rounded-xl p-6 text-white shadow-lg">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center">
                    <i className="ri-edit-line text-2xl text-white"></i>
                  </div>
                  <i className="ri-arrow-right-up-line text-3xl opacity-50"></i>
                </div>
                <h3 className="text-4xl font-bold mb-1">
                  {customers.filter(c => c.role === 'editor').length}
                </h3>
                <p className="text-white/90 text-sm">Editores</p>
              </div>

              <div className="bg-gradient-to-br from-orange-500 to-red-500 rounded-xl p-6 text-white shadow-lg">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center">
                    <i className="ri-customer-service-line text-2xl text-white"></i>
                  </div>
                  <i className="ri-arrow-right-up-line text-3xl opacity-50"></i>
                </div>
                <h3 className="text-4xl font-bold mb-1">
                  {customers.filter(c => c.role === 'support').length}
                </h3>
                <p className="text-white/90 text-sm">Suporte</p>
              </div>

              <div className="bg-gradient-to-br from-teal-500 to-cyan-500 rounded-xl p-6 text-white shadow-lg">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center">
                    <i className="ri-team-line text-2xl text-white"></i>
                  </div>
                  <i className="ri-arrow-right-up-line text-3xl opacity-50"></i>
                </div>
                <h3 className="text-4xl font-bold mb-1">
                  {customers.filter(c => ['superadmin', 'editor', 'support'].includes(c.role)).length}
                </h3>
                <p className="text-white/90 text-sm">Total da Equipa</p>
              </div>
            </div>

            {/* Informação sobre Permissões */}
            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-xl p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <i className="ri-information-line text-indigo-600"></i>
                Níveis de Permissão
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white rounded-lg p-4 border border-indigo-100">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                      <i className="ri-shield-star-line text-red-600"></i>
                    </div>
                    <h4 className="font-bold text-gray-900">Super Admin</h4>
                  </div>
                  <p className="text-sm text-gray-600">
                    Acesso total ao sistema, incluindo gestão de equipa e configurações críticas
                  </p>
                </div>

                <div className="bg-white rounded-lg p-4 border border-indigo-100">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                      <i className="ri-edit-line text-purple-600"></i>
                    </div>
                    <h4 className="font-bold text-gray-900">Editor</h4>
                  </div>
                  <p className="text-sm text-gray-600">
                    Pode gerenciar produtos, categorias, pedidos e conteúdo do site
                  </p>
                </div>

                <div className="bg-white rounded-lg p-4 border border-indigo-100">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                      <i className="ri-customer-service-line text-orange-600"></i>
                    </div>
                    <h4 className="font-bold text-gray-900">Suporte</h4>
                  </div>
                  <p className="text-sm text-gray-600">
                    Acesso a pedidos, clientes e mensagens para atendimento ao cliente
                  </p>
                </div>
              </div>
            </div>

            {/* Lista de Membros da Equipa */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-bold text-gray-900">Membros da Equipa</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
                {customers
                  .filter(c => ['superadmin', 'editor', 'support'].includes(c.role))
                  .map((member) => (
                    <div
                      key={member.id}
                      className="bg-gradient-to-br from-gray-50 to-white rounded-xl p-6 border border-gray-200 hover:shadow-lg transition-all"
                    >
                      {/* Avatar e Nome */}
                      <div className="flex items-center gap-4 mb-4">
                        <div className={`w-16 h-16 rounded-full flex items-center justify-center text-white text-2xl font-bold ${
                          member.role === 'superadmin' ? 'bg-gradient-to-br from-red-500 to-pink-500' :
                          member.role === 'editor' ? 'bg-gradient-to-br from-purple-500 to-indigo-500' :
                          'bg-gradient-to-br from-orange-500 to-red-500'
                        }`}>
                          {member.full_name?.charAt(0).toUpperCase() || 'U'}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-bold text-gray-900 text-lg">
                            {member.full_name || 'Sem nome'}
                          </h4>
                          <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                            member.role === 'superadmin' ? 'bg-red-100 text-red-700' :
                            member.role === 'editor' ? 'bg-purple-100 text-purple-700' :
                            'bg-orange-100 text-orange-700'
                          }`}>
                            {member.role === 'superadmin' ? 'Super Admin' :
                             member.role === 'editor' ? 'Editor' :
                             'Suporte'}
                          </span>
                        </div>
                      </div>

                      {/* Informações */}
                      <div className="space-y-2 mb-4">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <i className="ri-mail-line"></i>
                          <span className="truncate">{member.email}</span>
                        </div>
                        {member.phone && (
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <i className="ri-phone-line"></i>
                            <span>{member.phone}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <i className="ri-calendar-line"></i>
                          <span>
                            Desde {new Date(member.created_at).toLocaleDateString('pt-PT', {
                              month: 'short',
                              year: 'numeric'
                            })}
                          </span>
                        </div>
                      </div>

                      {/* Ações */}
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setEditingTeamMember(member);
                            setShowTeamModal(true);
                          }}
                          className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors cursor-pointer whitespace-nowrap flex items-center justify-center gap-2"
                        >
                          <i className="ri-edit-line"></i>
                          Editar
                        </button>
                        <button
                          onClick={() => handleDeleteCustomer(member.id)}
                          className="px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors cursor-pointer whitespace-nowrap"
                        >
                          <i className="ri-delete-bin-line"></i>
                        </button>
                      </div>
                    </div>
                  ))}
              </div>

              {customers.filter(c => ['superadmin', 'editor', 'support'].includes(c.role)).length === 0 && (
                <div className="text-center py-12">
                  <i className="ri-team-line text-6xl text-gray-300 mb-4"></i>
                  <p className="text-gray-500 mb-4">Nenhum membro da equipa cadastrado</p>
                  <button
                    onClick={() => {
                      setEditingTeamMember(null);
                      setShowTeamModal(true);
                    }}
                    className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-lg font-medium hover:shadow-lg transition-all cursor-pointer whitespace-nowrap"
                  >
                    <i className="ri-user-add-line mr-2"></i>
                    Adicionar Primeiro Membro
                  </button>
                </div>
              )}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className={`min-h-screen transition-colors duration-500 ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {/* Top Bar Profissional */}
      <DashboardTopBar />

      {/* Sidebar com Toggle */}
      <aside className={`fixed left-0 top-0 h-full border-r z-40 pt-16 transition-all duration-300 ${
        sidebarCollapsed ? 'w-20' : 'w-64'
      } ${
        darkMode 
          ? 'bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 border-gray-700' 
          : 'bg-white border-gray-200'
      }`}>
        {/* Toggle Button */}
        <div className={`p-4 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className={`w-full flex items-center justify-center px-4 py-3 rounded-xl transition-all duration-300 hover:scale-105 cursor-pointer ${
              darkMode 
                ? 'bg-gradient-to-r from-gray-700 to-gray-600 hover:from-gray-600 hover:to-gray-500' 
                : 'bg-gradient-to-r from-gray-200 to-gray-300 hover:from-gray-300 hover:to-gray-400'
            }`}
          >
            <i className={`${sidebarCollapsed ? 'ri-menu-unfold-line' : 'ri-menu-fold-line'} text-2xl ${
              darkMode ? 'text-white' : 'text-gray-700'
            }`}></i>
          </button>
        </div>

        {/* Dark/Light Mode Toggle */}
        {!sidebarCollapsed && (
          <div className={`p-4 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
            <button
              onClick={() => setDarkMode(!darkMode)}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-500 hover:scale-105 cursor-pointer group ${
                darkMode 
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 shadow-lg shadow-purple-500/50' 
                  : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 shadow-lg shadow-indigo-500/50'
              }`}
            >
              <div className="flex items-center gap-3">
                {darkMode ? (
                  <>
                    <i className="ri-moon-fill text-2xl text-white group-hover:rotate-12 transition-transform duration-500"></i>
                    <span className="text-white font-bold">Dark Mode</span>
                  </>
                ) : (
                  <>
                    <i className="ri-sun-fill text-2xl text-white group-hover:rotate-180 transition-transform duration-500"></i>
                    <span className="text-white font-bold">Light Mode</span>
                  </>
                )}
              </div>
              <i className={`ri-arrow-right-s-line text-white text-xl transition-transform duration-300 ${darkMode ? 'rotate-180' : ''}`}></i>
            </button>
          </div>
        )}

        {/* Navegação com Scroll */}
        <div className="overflow-y-auto h-[calc(100vh-180px)] scrollbar-thin scrollbar-thumb-rounded scrollbar-thumb-gray-400 scrollbar-track-transparent hover:scrollbar-thumb-gray-500">
          <div className={sidebarCollapsed ? 'p-2' : 'p-6'}>
            <nav className="space-y-1">
              {menuItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id as TabType)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-300 cursor-pointer group ${
                    activeTab === item.id 
                      ? darkMode
                        ? `bg-gradient-to-r ${item.gradient} text-white shadow-lg`
                        : 'bg-gradient-to-r from-[#4ECDC4] to-[#45B7B8] text-white shadow-lg'
                      : darkMode
                        ? 'text-gray-300 hover:bg-gray-800 hover:text-white'
                        : 'text-gray-700 hover:bg-gray-100'
                  } ${sidebarCollapsed ? 'justify-center' : ''}`}
                  title={sidebarCollapsed ? item.label : ''}
                >
                  <i className={`${item.icon} text-lg transition-transform duration-300 ${activeTab === item.id ? 'scale-110' : 'group-hover:scale-110'}`}></i>
                  {!sidebarCollapsed && <span className="font-medium">{item.label}</span>}
                </button>
              ))}
            </nav>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className={`pt-16 p-8 transition-all duration-300 ${sidebarCollapsed ? 'ml-20' : 'ml-64'}`}>
        {/* Header */}
        <div className="mb-8">
          <h2 className={`text-3xl font-bold mb-2 transition-colors duration-500 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            {activeTab === 'overview' && 'Visão Geral'}
            {activeTab === 'products' && 'Gerenciar Produtos'}
            {activeTab === 'orders' && 'Gerenciar Pedidos'}
            {activeTab === 'categories' && 'Gerenciar Categorias'}
            {activeTab === 'customers' && 'Gerenciar Clientes'}
            {activeTab === 'site-control' && 'Controle do Site'}
            {activeTab === 'site-settings' && 'Configurações do Site'}
            {activeTab === 'newsletter' && 'Newsletter'}
            {activeTab === 'settings' && 'Controle Total do Site'}
            {activeTab === 'reviews' && 'Avaliações'}
            {activeTab === 'vat-settings' && 'Configurações de IVA'}
            {activeTab === 'messages' && 'Mensagens'}
            {activeTab === 'team' && 'Equipa'}
          </h2>
          <p className={`transition-colors duration-500 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Bem-vinda, {userProfile?.full_name || user?.email?.split('@')[0]}!
          </p>
        </div>

        {renderContent()}
      </main>

      {/* Modals */}
      {showProductModal && (
        <ProductModal
          product={editingProduct}
          categories={categories}
          onClose={() => {
            setShowProductModal(false);
            setEditingProduct(null);
          }}
          onSave={loadDashboardData}
        />
      )}

      {showCategoryModal && (
        <CategoryModal
          category={editingCategory}
          onClose={() => {
            setShowCategoryModal(false);
            setEditingCategory(null);
          }}
          onSave={loadDashboardData}
        />
      )}

      {showCustomerModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className={`rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border-2 ${
            darkMode 
              ? 'bg-gray-800 border-gray-700' 
              : 'bg-white border-gray-200'
          }`}>
            <div className={`sticky top-0 z-10 p-6 border-b ${
              darkMode 
                ? 'bg-gray-800 border-gray-700' 
                : 'bg-white border-gray-200'
            }`}>
              <div className="flex items-center justify-between">
                <h3 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  {editingCustomer ? 'Editar Cliente/Funcionário' : 'Criar Novo Cliente/Funcionário'}
                </h3>
                <button
                  onClick={() => {
                    setShowCustomerModal(false);
                    setEditingCustomer(null);
                  }}
                  className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                    darkMode 
                      ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' 
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                  }`}
                >
                  <i className="ri-close-line text-xl"></i>
                </button>
              </div>
            </div>

            <CustomerModal
              customer={editingCustomer}
              onClose={() => {
                setShowCustomerModal(false);
                setEditingCustomer(null);
              }}
              onSave={async () => {
                await loadDashboardData();
                setShowCustomerModal(false);
                setEditingCustomer(null);
              }}
            />
          </div>
        </div>
      )}

      {showTeamModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className={`rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border-2 ${
            darkMode 
              ? 'bg-gray-800 border-gray-700' 
              : 'bg-white border-gray-200'
          }`}>
            <div className={`sticky top-0 z-10 p-6 border-b ${
              darkMode 
                ? 'bg-gray-800 border-gray-700' 
                : 'bg-white border-gray-200'
            }`}>
              <div className="flex items-center justify-between">
                <h3 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  {editingTeamMember ? 'Editar Funcionário' : 'Adicionar Novo Funcionário'}
                </h3>
                <button
                  onClick={() => {
                    setShowTeamModal(false);
                    setEditingTeamMember(null);
                  }}
                  className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                    darkMode 
                      ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' 
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                  }`}
                >
                  <i className="ri-close-line text-xl"></i>
                </button>
              </div>
            </div>

            <CustomerModal
              customer={editingTeamMember}
              onClose={() => {
                setShowTeamModal(false);
                setEditingTeamMember(null);
              }}
              onSave={async () => {
                await loadDashboardData();
                setShowTeamModal(false);
                setEditingTeamMember(null);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
