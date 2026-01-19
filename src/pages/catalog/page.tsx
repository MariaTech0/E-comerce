import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useProducts } from '../../hooks/useProducts';
import { useCategories } from '../../hooks/useCategories';
import { useCartStore } from '../../store/cartStore';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';

export default function CatalogPage() {
  const { products, loading } = useProducts();
  const { categories } = useCategories();
  const addToCart = useCartStore((state) => state.addItem);

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 100]);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [user, setUser] = useState<any>(null);
  const [showSearchSuggestions, setShowSearchSuggestions] = useState(false);

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    setUser(currentUser);
    if (currentUser) {
      loadFavorites(currentUser.id);
    }
  };

  const loadFavorites = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_favorites')
        .select('product_id')
        .eq('user_id', userId);

      if (error) throw error;
      setFavorites(new Set(data?.map(f => f.product_id) || []));
    } catch (error) {
      console.error('Erro ao carregar favoritos:', error);
    }
  };

  const toggleFavorite = async (productId: string) => {
    if (!user) {
      toast.error('Faça login para adicionar favoritos!');
      return;
    }

    try {
      if (favorites.has(productId)) {
        // Remover favorito
        const { error } = await supabase
          .from('user_favorites')
          .delete()
          .eq('user_id', user.id)
          .eq('product_id', productId);

        if (error) throw error;
        
        setFavorites(prev => {
          const newSet = new Set(prev);
          newSet.delete(productId);
          return newSet;
        });
        toast.success('Removido dos favoritos!');
      } else {
        // Adicionar favorito
        const { error } = await supabase
          .from('user_favorites')
          .insert([{ user_id: user.id, product_id: productId }]);

        if (error) throw error;
        
        setFavorites(prev => new Set(prev).add(productId));
        toast.success('Adicionado aos favoritos!');
      }
    } catch (error) {
      console.error('Erro ao atualizar favorito:', error);
      toast.error('Erro ao atualizar favorito');
    }
  };

  const filteredProducts = products
    .filter((product) => {
      if (selectedCategory !== 'all' && product.category_id !== selectedCategory) return false;
      if (product.price < priceRange[0] || product.price > priceRange[1]) return false;
      if (searchQuery && !product.title.toLowerCase().includes(searchQuery.toLowerCase()) && 
          !product.author.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'price-asc': return a.price - b.price;
        case 'price-desc': return b.price - a.price;
        case 'popular': return b.downloads_count - a.downloads_count;
        case 'rating': return b.rating_avg - a.rating_avg;
        default: return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });

  const handleAddToCart = (product: any) => {
    addToCart({
      id: product.id,
      title: product.title,
      author: product.author,
      price: product.price,
      cover: product.cover_url,
    });
    toast.success('Produto adicionado ao carrinho!');
  };

  // Sugestões de categorias para busca
  const searchSuggestions = categories.slice(0, 5);

  return (
    <div className="min-h-screen bg-cream">
      {/* Hero Section com Imagem de Fundo VIBRANTE */}
      <section className="relative py-20 overflow-hidden">
        {/* Imagem de Fundo VIBRANTE E ANIMADA */}
        <div 
          className="absolute inset-0 bg-cover bg-center animate-ken-burns"
          style={{
            backgroundImage: `url('https://readdy.ai/api/search-image?query=vibrant%20colorful%20library%20shelves%20filled%20with%20bright%20multicolored%20books%2C%20warm%20natural%20sunlight%20streaming%20through%20windows%2C%20cheerful%20inviting%20atmosphere%20with%20plants%20and%20cozy%20reading%20spaces%2C%20modern%20minimalist%20design%20with%20pops%20of%20vivid%20colors%2C%20professional%20photography%20high%20quality&width=1920&height=600&seq=catalog-hero-vibrant&orientation=landscape')`,
          }}
        />
        
        {/* Overlay Escuro LEVE apenas para contraste do texto */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/20 to-black/30"></div>
        
        {/* Padrão Decorativo Animado */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 right-10 w-96 h-96 bg-white rounded-full blur-3xl animate-pulse-slow"></div>
          <div className="absolute bottom-10 left-10 w-72 h-72 bg-white rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '1s' }}></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-6 text-center pt-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="font-serif text-6xl font-bold text-white mb-6">
              Explore Nosso Catálogo
            </h1>
            <p className="text-xl text-white/95 max-w-2xl mx-auto mb-8">
              Milhares de títulos esperando por você
            </p>
          </motion.div>
        </div>
      </section>

      <div className="pt-24 pb-16">
        <div className="max-w-7xl mx-auto px-4">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-5xl font-bold text-gray-900 mb-4" style={{ fontFamily: 'Playfair Display, serif' }}>
              Catálogo Completo
            </h1>
            <p className="text-xl text-gray-600">
              Explore nossa coleção com mais de {products.length} ebooks em {categories.length} categorias
            </p>
          </div>

          {/* Search & Sort Bar */}
          <div className="bg-white rounded-xl shadow-lg p-4 mb-8 border border-pink-100">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <i className="ri-search-line absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-xl"></i>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setShowSearchSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowSearchSuggestions(false), 200)}
                  placeholder="Buscar por título ou autor..."
                  className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent text-sm"
                />
                
                {/* Sugestões de Busca */}
                {showSearchSuggestions && searchQuery === '' && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-xl border border-gray-200 z-50 overflow-hidden">
                    <div className="p-3 bg-gray-50 border-b border-gray-200">
                      <p className="text-xs font-semibold text-gray-600 uppercase">Categorias Populares</p>
                    </div>
                    {searchSuggestions.map((category) => (
                      <button
                        key={category.id}
                        onClick={() => {
                          setSelectedCategory(category.id);
                          setShowSearchSuggestions(false);
                        }}
                        className="w-full text-left px-4 py-3 hover:bg-pink-50 transition-colors cursor-pointer flex items-center gap-3"
                      >
                        <i className="ri-book-line text-pink-500"></i>
                        <span className="text-gray-700">{category.name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent text-sm cursor-pointer"
              >
                <option value="newest">Mais Recentes</option>
                <option value="popular">Mais Populares</option>
                <option value="rating">Melhor Avaliados</option>
                <option value="price-asc">Menor Preço</option>
                <option value="price-desc">Maior Preço</option>
              </select>
              <button
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="md:hidden px-4 py-3 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-lg font-semibold whitespace-nowrap cursor-pointer"
              >
                <i className={`ri-${isSidebarOpen ? 'close' : 'filter-3'}-line mr-2`}></i>
                {isSidebarOpen ? 'Fechar' : 'Filtros'}
              </button>
            </div>
          </div>

          <div className="flex gap-8">
            {/* Sidebar */}
            <aside className={`${isSidebarOpen ? 'block' : 'hidden'} md:block w-full md:w-80 flex-shrink-0`}>
              <div className="bg-white rounded-xl shadow-lg border border-pink-100 sticky top-24">
                {/* Categories */}
                <div className="p-6 border-b border-gray-200">
                  <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <i className="ri-folder-line text-pink-500"></i>
                    Categorias
                  </h3>
                  <div className="max-h-96 overflow-y-auto pr-2 space-y-2 scrollbar-thin scrollbar-thumb-pink-300 scrollbar-track-gray-100">
                    <button
                      onClick={() => setSelectedCategory('all')}
                      className={`w-full text-left px-4 py-3 rounded-lg transition-all whitespace-nowrap cursor-pointer ${
                        selectedCategory === 'all'
                          ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white font-semibold'
                          : 'hover:bg-pink-50 text-gray-700'
                      }`}
                    >
                      <i className="ri-apps-line mr-2"></i>
                      Todas as Categorias
                      <span className="float-right bg-white/20 px-2 py-1 rounded text-xs">
                        {products.length}
                      </span>
                    </button>
                    {categories.map((category) => {
                      const count = products.filter(p => p.category_id === category.id).length;
                      return (
                        <button
                          key={category.id}
                          onClick={() => setSelectedCategory(category.id)}
                          className={`w-full text-left px-4 py-3 rounded-lg transition-all whitespace-nowrap cursor-pointer ${
                            selectedCategory === category.id
                              ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white font-semibold'
                              : 'hover:bg-pink-50 text-gray-700'
                          }`}
                        >
                          <i className="ri-book-line mr-2"></i>
                          {category.name}
                          <span className={`float-right px-2 py-1 rounded text-xs ${
                            selectedCategory === category.id ? 'bg-white/20' : 'bg-gray-100'
                          }`}>
                            {count}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Price Range */}
                <div className="p-6 border-b border-gray-200">
                  <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <i className="ri-price-tag-3-line text-pink-500"></i>
                    Faixa de Preço
                  </h3>
                  <div className="space-y-4">
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={priceRange[1]}
                      onChange={(e) => setPriceRange([0, parseInt(e.target.value)])}
                      className="w-full accent-pink-500 cursor-pointer"
                    />
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>€0</span>
                      <span className="font-semibold text-pink-500">€{priceRange[1]}</span>
                    </div>
                  </div>
                </div>

                {/* Format Filter */}
                <div className="p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <i className="ri-file-text-line text-pink-500"></i>
                    Formato
                  </h3>
                  <div className="space-y-2">
                    {['PDF', 'EPUB', 'MOBI'].map((format) => (
                      <label key={format} className="flex items-center gap-3 cursor-pointer hover:bg-pink-50 p-2 rounded-lg transition-colors">
                        <input type="checkbox" className="w-4 h-4 text-pink-500 border-gray-300 rounded focus:ring-pink-500 cursor-pointer" />
                        <span className="text-gray-700">{format}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </aside>

            {/* Products Grid */}
            <div className="flex-1">
              {loading ? (
                <div className="text-center py-20">
                  <i className="ri-loader-4-line text-5xl text-pink-500 animate-spin"></i>
                  <p className="text-gray-600 mt-4">Carregando produtos...</p>
                </div>
              ) : filteredProducts.length === 0 ? (
                <div className="text-center py-20">
                  <i className="ri-inbox-line text-6xl text-gray-400 mb-4"></i>
                  <p className="text-xl text-gray-600">Nenhum produto encontrado</p>
                </div>
              ) : (
                <>
                  <div className="mb-6 flex items-center justify-between">
                    <p className="text-gray-600">
                      Mostrando <strong>{filteredProducts.length}</strong> produtos
                    </p>
                  </div>
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6" data-product-shop>
                    {filteredProducts.map((product) => (
                      <div
                        key={product.id}
                        className="bg-white rounded-xl shadow-lg overflow-hidden border border-pink-100 hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 group"
                      >
                        <Link to={`/product/${product.slug}`} className="block cursor-pointer">
                          <div className="relative w-full h-64">
                            <img
                              src={product.cover_url || 'https://via.placeholder.com/300x400?text=No+Cover'}
                              alt={product.title}
                              className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-300"
                            />
                            {product.is_featured && (
                              <div className="absolute top-3 left-3 bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg">
                                ⭐ Destaque
                              </div>
                            )}
                            
                            {/* Overlay escuro no hover */}
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all duration-300"></div>
                          </div>
                        </Link>
                        
                        <div className="p-5">
                          <Link to={`/product/${product.slug}`} className="cursor-pointer">
                            <h3 className="font-bold text-gray-900 mb-2 line-clamp-2 hover:text-pink-500 transition-colors text-lg">
                              {product.title}
                            </h3>
                          </Link>
                          <p className="text-sm text-gray-600 mb-3 flex items-center gap-1">
                            <i className="ri-quill-pen-line text-pink-400"></i>
                            {product.author}
                          </p>
                          
                          {/* Avaliações */}
                          <div className="flex items-center gap-2 mb-4">
                            <div className="flex items-center gap-1">
                              {[...Array(5)].map((_, i) => (
                                <i
                                  key={i}
                                  className={`ri-star-${i < Math.floor(product.rating_avg) ? 'fill' : 'line'} text-yellow-400 text-sm`}
                                ></i>
                              ))}
                            </div>
                            <span className="text-xs text-gray-500">({product.rating_count})</span>
                          </div>

                          {/* Preço DESTAQUE */}
                          <div className="mb-4 bg-gradient-to-r from-pink-50 to-rose-50 rounded-lg p-3 border-2 border-pink-200">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-xs text-gray-500 mb-1">Preço</p>
                                <p className="text-3xl font-bold text-pink-600">€{product.price.toFixed(2)}</p>
                              </div>
                              <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-rose-500 rounded-full flex items-center justify-center">
                                <i className="ri-price-tag-3-fill text-white text-xl"></i>
                              </div>
                            </div>
                          </div>
                          
                          {/* Botões de Ação - 3 BOTÕES */}
                          <div className="space-y-2">
                            {/* Comprar Agora - DESTAQUE */}
                            <button
                              onClick={() => {
                                handleAddToCart(product);
                                setTimeout(() => {
                                  window.REACT_APP_NAVIGATE('/checkout');
                                }, 500);
                              }}
                              className="w-full py-3 bg-gradient-to-r from-turquoise to-turquoise/90 text-white font-bold rounded-lg hover:shadow-xl hover:scale-[1.02] transition-all whitespace-nowrap cursor-pointer flex items-center justify-center gap-2"
                            >
                              <i className="ri-flashlight-fill text-lg"></i>
                              Comprar Agora
                            </button>

                            {/* Adicionar ao Carrinho + Favorito */}
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleAddToCart(product)}
                                className="flex-1 py-3 bg-gradient-to-r from-pink-500 to-rose-500 text-white font-semibold rounded-lg hover:from-pink-600 hover:to-rose-600 transition-all whitespace-nowrap cursor-pointer flex items-center justify-center gap-2"
                              >
                                <i className="ri-shopping-cart-line text-lg"></i>
                                Carrinho
                              </button>
                              
                              {/* Botão de Favorito */}
                              <button
                                onClick={(e) => {
                                  e.preventDefault();
                                  toggleFavorite(product.id);
                                }}
                                className={`px-4 py-3 rounded-lg font-semibold transition-all cursor-pointer whitespace-nowrap flex items-center justify-center shadow-md ${
                                  favorites.has(product.id)
                                    ? 'bg-red-500 text-white hover:bg-red-600'
                                    : 'bg-white text-gray-700 border-2 border-gray-300 hover:border-red-500 hover:text-red-500'
                                }`}
                              >
                                <i className={`${favorites.has(product.id) ? 'ri-heart-fill' : 'ri-heart-line'} text-xl`}></i>
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
