import { useState, useEffect, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '../../lib/supabase';
import { useProducts } from '../../hooks/useProducts';
import { useCategories } from '../../hooks/useCategories';
import { useSiteSettings } from '../../hooks/useSiteSettings';
import { useCartStore } from '../../store/cartStore';
import toast from 'react-hot-toast';
import { books } from '../../mocks/books';

export default function HomePage() {
  const { addItem } = useCartStore();
  const { products, loading: productsLoading } = useProducts();
  const { categories, loading: categoriesLoading } = useCategories();
  const { settings, loading: settingsLoading } = useSiteSettings();
  const [email, setEmail] = useState('');
  const [subscribing, setSubscribing] = useState(false);
  const [currentAboutPage, setCurrentAboutPage] = useState(0);

  // OTIMIZAÇÃO: Memoização de produtos filtrados
  const featuredProducts = useMemo(() => 
    products.filter(p => p.is_featured && p.is_active),
    [products]
  );
  
  const activeProducts = useMemo(() => 
    products.filter(p => p.is_active),
    [products]
  );
  
  const displayProducts = useMemo(() => {
    if (featuredProducts.length > 0) return featuredProducts.slice(0, 8);
    if (activeProducts.length > 0) return activeProducts.slice(0, 8);
    return books.slice(0, 8);
  }, [featuredProducts, activeProducts]);

  // OTIMIZAÇÃO: Lazy loading de imagens
  useEffect(() => {
    const images = document.querySelectorAll('img[loading="lazy"]');
    const imageObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target as HTMLImageElement;
          img.classList.add('loaded');
          imageObserver.unobserve(img);
        }
      });
    });

    images.forEach(img => imageObserver.observe(img));

    return () => imageObserver.disconnect();
  }, [displayProducts]);

  const handleAddToCart = useCallback((product: any) => {
    addItem({
      id: product.id,
      title: product.title,
      author: product.author,
      price: product.price,
      cover: product.cover || product.cover_url || product.cover_image_url,
    });
    toast.success('Livro adicionado ao carrinho!');
  }, [addItem]);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error('Por favor, insira seu email');
      return;
    }

    setSubscribing(true);
    try {
      const { error } = await supabase
        .from('newsletter_subscribers')
        .insert([{ email }]);

      if (error) throw error;

      toast.success('Inscrição realizada com sucesso!');
      setEmail('');
    } catch (error: any) {
      if (error.code === '23505') {
        toast.error('Este email já está inscrito!');
      } else {
        toast.error('Erro ao inscrever. Tente novamente.');
      }
    } finally {
      setSubscribing(false);
    }
  };

  // Páginas da seção Sobre
  const aboutPages = [
    {
      title: settings?.home?.about_page1_title || 'Sua Biblioteca Digital Completa',
      description: settings?.home?.about_page1_description || 'Oferecemos a melhor experiência em leitura digital com milhares de títulos em português e inglês. Compre uma vez, leia para sempre em qualquer dispositivo.',
      author: settings?.home?.about_page1_author || 'Equipe Livraria Digital',
      image: settings?.home?.about_page1_image || 'https://readdy.ai/api/search-image?query=person%20reading%20ebook%20on%20tablet%20in%20cozy%20modern%20library%20setting%20with%20warm%20natural%20lighting%2C%20soft%20pastel%20colors%2C%20peaceful%20atmosphere%2C%20professional%20lifestyle%20photography%20with%20simple%20clean%20background&width=600&height=800&seq=about1&orientation=portrait'
    },
    {
      title: settings?.home?.about_page2_title || 'Acesso Ilimitado aos Seus Livros',
      description: settings?.home?.about_page2_description || 'Todos os livros que você compra ficam disponíveis para sempre na sua biblioteca pessoal. Baixe quantas vezes quiser, em qualquer dispositivo.',
      author: settings?.home?.about_page2_author || 'Equipe Livraria Digital',
      image: settings?.home?.about_page2_image || 'https://readdy.ai/api/search-image?query=multiple%20devices%20showing%20ebooks%20tablet%20phone%20laptop%20synchronized%20reading%20modern%20minimalist%20setup%20with%20soft%20lighting%20clean%20background%20professional%20product%20photography&width=600&height=800&seq=about2&orientation=portrait'
    }
  ];

  const nextAboutPage = () => {
    setCurrentAboutPage((prev) => (prev + 1) % aboutPages.length);
  };

  const prevAboutPage = () => {
    setCurrentAboutPage((prev) => (prev - 1 + aboutPages.length) % aboutPages.length);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section com Imagem de Fundo VIBRANTE E ANIMADA */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url('https://readdy.ai/api/search-image?query=vibrant%20colorful%20open%20book%20pages%20floating%20in%20bright%20dreamy%20sky%20with%20vivid%20turquoise%20coral%20pink%20and%20golden%20tones%2C%20magical%20literary%20aesthetic%2C%20dynamic%20composition%20with%20light%20rays%20and%20sparkles%2C%20joyful%20reading%20atmosphere%2C%20professional%20photography%20with%20rich%20saturated%20colors&width=1920&height=1080&seq=hero-vibrant-new&orientation=landscape')`,
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/20 to-black/30"></div>

        <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <span className="inline-block px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full text-white text-sm mb-6">
              Mais de 100 categorias disponíveis
            </span>
            <h1 className="font-serif text-7xl font-light text-white mb-6 leading-tight">
              Descubra Mundos em{' '}
              <span className="bg-gradient-to-r from-[#FF6B6B] to-[#4ECDC4] bg-clip-text text-transparent font-semibold">
                Cada Página
              </span>
            </h1>
            <p className="text-xl text-white/90 mb-10 max-w-2xl mx-auto leading-relaxed">
              Milhares de livros digitais ao seu alcance. Compre, baixe e comece a ler instantaneamente.
            </p>
            <div className="flex items-center justify-center gap-4">
              <Link
                to="/catalog"
                className="px-8 py-4 bg-[#FF6B6B] text-white rounded-full font-medium hover:bg-[#FF6B6B]/90 transition-all cursor-pointer whitespace-nowrap"
              >
                Explorar Catálogo
              </Link>
              <a
                href="#categories"
                className="px-8 py-4 bg-white/20 backdrop-blur-sm text-white rounded-full font-medium hover:bg-white/30 transition-all cursor-pointer whitespace-nowrap"
              >
                Ver Categorias
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Categories Section */}
      <section id="categories" className="max-w-7xl mx-auto px-6 py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="font-serif text-5xl font-bold text-gray-900 mb-4">
            Categorias em <span className="text-[#4ECDC4]">Destaque</span>
          </h2>
          <p className="text-gray-600 text-lg">Explore nossa seleção curada de gêneros literários</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {categories.slice(0, 6).map((category, index) => (
            <motion.div
              key={category.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
            >
              <a
                href={`/catalog?category=${category.slug}`}
                className="group block relative overflow-hidden rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 cursor-pointer h-80"
              >
                {/* Imagem de Fundo */}
                <div className="absolute inset-0">
                  <img
                    src={category.image_url || `https://readdy.ai/api/search-image?query=beautiful%20minimalist%20$%7Bcategory.name%7D%20books%20category%20background%20with%20soft%20colors%20and%20elegant%20design%20modern%20aesthetic%20clean%20composition&width=600&height=800&seq=${category.id}&orientation=portrait`}
                    alt={category.name}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  {/* Overlay Gradiente */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>
                </div>

                {/* Conteúdo */}
                <div className="relative h-full flex flex-col justify-end p-8">
                  {/* Ícone */}
                  <div className="mb-4 w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center group-hover:bg-[#4ECDC4]/90 transition-all duration-300">
                    <i className={`${category.icon || 'ri-book-line'} text-3xl text-white`}></i>
                  </div>

                  {/* Título */}
                  <h3 className="font-serif text-3xl font-bold text-white mb-2 group-hover:text-[#4ECDC4] transition-colors">
                    {category.name}
                  </h3>

                  {/* Descrição */}
                  {category.description && (
                    <p className="text-white/90 text-sm mb-3 line-clamp-2">
                      {category.description}
                    </p>
                  )}

                  {/* Contador de Livros */}
                  <div className="flex items-center gap-2 text-white/80 text-sm">
                    <i className="ri-book-2-line"></i>
                    <span>{category.product_count || 0} livros disponíveis</span>
                  </div>

                  {/* Seta */}
                  <div className="absolute top-6 right-6 w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-2 group-hover:translate-x-0">
                    <i className="ri-arrow-right-line text-white text-xl"></i>
                  </div>
                </div>
              </a>
            </motion.div>
          ))}
        </div>

        {/* Botão Ver Todas */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mt-12"
        >
          <a
            href="/catalog"
            className="inline-flex items-center gap-2 px-8 py-4 bg-[#4ECDC4] text-white rounded-full font-medium hover:bg-[#4ECDC4]/90 hover:shadow-lg transition-all cursor-pointer whitespace-nowrap"
          >
            Ver Todas as Categorias
            <i className="ri-arrow-right-line"></i>
          </a>
        </motion.div>
      </section>

      {/* Livros Mais Vendidos */}
      <section id="bestsellers" className="max-w-7xl mx-auto px-6 py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="font-serif text-5xl font-bold text-gray-900 mb-4">
            Livros Mais <span className="text-[#FF6B6B]">Vendidos</span>
          </h2>
          <p className="text-gray-600 text-lg">Descubra os favoritos dos nossos leitores</p>
          
          {/* NOVO: Indicador de produtos em destaque */}
          {featuredProducts.length > 0 && (
            <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-yellow-100 border border-yellow-300 rounded-full">
              <i className="ri-star-fill text-yellow-600"></i>
              <span className="text-sm font-medium text-yellow-800">
                {featuredProducts.length} {featuredProducts.length === 1 ? 'produto em destaque' : 'produtos em destaque'}
              </span>
            </div>
          )}
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-7">
          {displayProducts.map((book, index) => (
            <motion.div
              key={book.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.05 }}
              whileHover={{ y: -8 }}
              className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-xl transition-all group relative"
            >
              {/* BADGES: Bestseller, Novo, Em Destaque */}
              <div className="absolute top-3 right-3 z-10 flex flex-col gap-2">
                {book.is_featured && (
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-yellow-400 to-orange-500 text-white shadow-lg">
                    ⭐ Destaque
                  </span>
                )}
                {book.bestseller && (
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-[#FF6B6B] text-white shadow-lg">
                    Bestseller
                  </span>
                )}
                {book.new && (
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-[#4ECDC4] text-white shadow-lg">
                    Novo
                  </span>
                )}
              </div>
              
              {/* IMAGEM DO PRODUTO - CORRIGIDA */}
              <div className="relative h-72 bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-6">
                <img
                  src={book.cover_url || book.cover || book.cover_image_url || `https://readdy.ai/api/search-image?query=professional%20book%20cover%20design%20for%20$%7Bbook.title%7D%20elegant%20modern%20minimalist%20style%20with%20simple%20clean%20background&width=400&height=600&seq=${book.id}&orientation=portrait`}
                  alt={book.title}
                  className="h-full w-auto object-contain drop-shadow-2xl transition-transform duration-300 group-hover:scale-105"
                  onError={(e) => {
                    // Fallback se a imagem falhar
                    e.currentTarget.src = `https://readdy.ai/api/search-image?query=elegant%20book%20cover%20design%20modern%20minimalist%20style%20simple%20background%20professional&width=400&height=600&seq=fallback-${book.id}&orientation=portrait`;
                  }}
                />
              </div>

              <div className="p-5">
                <Link to={`/product/${book.id}`} className="cursor-pointer">
                  <h3 className="font-serif text-lg font-medium text-gray-900 mb-1 line-clamp-2 group-hover:text-[#FF6B6B] transition-colors">
                    {book.title}
                  </h3>
                </Link>
                <p className="text-sm text-gray-600 mb-3">{book.author || 'Autor Desconhecido'}</p>
                
                <div className="flex items-center gap-2 mb-4">
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <i
                        key={i}
                        className={`ri-star-${i < Math.floor(book.rating || book.rating_avg || 4.5) ? 'fill' : 'line'} text-yellow-400 text-sm`}
                      ></i>
                    ))}
                  </div>
                  <span className="text-xs text-gray-500">({book.reviews || book.reviews_count || 0})</span>
                </div>

                <div className="flex items-center justify-between mb-4">
                  <div>
                    <span className="text-2xl font-bold text-[#FF6B6B]">€{book.price}</span>
                    {book.originalPrice && (
                      <span className="text-sm text-gray-400 line-through ml-2">
                        €{book.originalPrice}
                      </span>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => handleAddToCart(book)}
                  className="w-full py-3 border-2 border-gray-900 text-gray-900 rounded-xl font-medium hover:bg-gray-900 hover:text-white transition-all cursor-pointer whitespace-nowrap"
                >
                  Adicionar ao Carrinho
                </button>
              </div>
            </motion.div>
          ))}
        </div>

        {/* NOVO: Mensagem se não houver produtos */}
        {displayProducts.length === 0 && (
          <div className="text-center py-12 bg-white rounded-2xl border border-gray-200">
            <i className="ri-book-line text-6xl text-gray-300 mb-4"></i>
            <p className="text-gray-500 mb-4">Nenhum produto disponível no momento</p>
            <p className="text-sm text-gray-400">Adicione produtos no dashboard para exibi-los aqui</p>
          </div>
        )}

        <div className="text-center mt-12">
          <Link
            to="/catalog"
            className="inline-block px-8 py-4 bg-gray-900 text-white rounded-full font-medium hover:bg-gray-800 transition-all cursor-pointer whitespace-nowrap"
          >
            Ver Todos os Livros
          </Link>
        </div>
      </section>

      {/* Seção Sobre - Biblioteca Digital */}
      <section id="about" className="bg-gradient-to-b from-white to-[#E8F5F3] py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
            <motion.div
              key={currentAboutPage}
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 30 }}
              transition={{ duration: 0.5 }}
              className="relative"
            >
              <div className="rounded-3xl overflow-hidden shadow-2xl">
                <img
                  src={aboutPages[currentAboutPage].image}
                  alt={aboutPages[currentAboutPage].title}
                  className="w-full h-[500px] object-cover"
                />
              </div>

              {/* Navegação de Páginas */}
              <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex items-center gap-4 bg-white/90 backdrop-blur-sm px-6 py-3 rounded-full shadow-lg">
                <button
                  onClick={prevAboutPage}
                  className="w-10 h-10 flex items-center justify-center rounded-full bg-[#4ECDC4] text-white hover:bg-[#4ECDC4]/90 transition-all cursor-pointer"
                  aria-label="Página anterior"
                >
                  <i className="ri-arrow-left-s-line text-xl"></i>
                </button>

                <div className="flex gap-2">
                  {aboutPages.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentAboutPage(index)}
                      className={`w-2 h-2 rounded-full transition-all cursor-pointer ${
                        index === currentAboutPage
                          ? 'bg-[#4ECDC4] w-8'
                          : 'bg-gray-300 hover:bg-gray-400'
                      }`}
                      aria-label={`Ir para página ${index + 1}`}
                    />
                  ))}
                </div>

                <button
                  onClick={nextAboutPage}
                  className="w-10 h-10 flex items-center justify-center rounded-full bg-[#4ECDC4] text-white hover:bg-[#4ECDC4]/90 transition-all cursor-pointer"
                  aria-label="Próxima página"
                >
                  <i className="ri-arrow-right-s-line text-xl"></i>
                </button>
              </div>
            </motion.div>

            <motion.div
              key={`content-${currentAboutPage}`}
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.5 }}
            >
              <div className="inline-block px-4 py-2 bg-[#4ECDC4]/10 text-[#4ECDC4] rounded-full text-sm font-medium mb-6">
                Sobre Nós
              </div>

              <h2 className="font-serif text-4xl md:text-5xl font-bold text-gray-900 mb-6 leading-tight">
                {aboutPages[currentAboutPage].title}
              </h2>

              <p className="text-lg text-gray-600 mb-8 leading-relaxed">
                {aboutPages[currentAboutPage].description}
              </p>

              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 bg-gradient-to-br from-[#FF6B6B] to-[#4ECDC4] rounded-full flex items-center justify-center">
                  <i className="ri-double-quotes-l text-white text-xl"></i>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Mensagem de</p>
                  <p className="font-semibold text-gray-900">{aboutPages[currentAboutPage].author}</p>
                </div>
              </div>

              <Link
                to="/about"
                className="inline-flex items-center gap-2 px-8 py-4 bg-[#4ECDC4] text-white rounded-full font-medium hover:bg-[#4ECDC4]/90 transition-all cursor-pointer whitespace-nowrap group"
              >
                Saiba Mais Sobre Nós
                <i className="ri-arrow-right-line group-hover:translate-x-1 transition-transform"></i>
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Por Que Escolher Nossa Plataforma */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="font-sans text-5xl font-extrabold text-gray-900 mb-4">
            Por Que Escolher <span className="text-[#4ECDC4]">Nossa Plataforma</span>
          </h2>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            Segurança, rapidez e suporte completo para sua melhor experiência
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Download Instantâneo */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all group border border-gray-100"
          >
            <div className="w-16 h-16 bg-gradient-to-br from-[#4ECDC4] to-[#4ECDC4]/80 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <i className="ri-download-cloud-line text-3xl text-white"></i>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">Download Instantâneo</h3>
            <p className="text-gray-600 leading-relaxed">
              Acesso imediato aos seus ebooks após a confirmação do pagamento. Baixe quantas vezes quiser.
            </p>
          </motion.div>

          {/* Pagamento Seguro */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all group border border-gray-100"
          >
            <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <i className="ri-shield-check-line text-3xl text-white"></i>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">Pagamento 100% Seguro</h3>
            <p className="text-gray-600 leading-relaxed mb-4">
              Seus dados protegidos com criptografia de ponta. Aceitamos:
            </p>
            <div className="flex flex-wrap gap-2 items-center">
              <div className="bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-200 flex items-center gap-1.5">
                <i className="ri-bank-card-line text-blue-600"></i>
                <span className="text-xs font-medium text-gray-700">Visa</span>
              </div>
              <div className="bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-200 flex items-center gap-1.5">
                <i className="ri-bank-card-line text-orange-600"></i>
                <span className="text-xs font-medium text-gray-700">Mastercard</span>
              </div>
              <div className="bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-200 flex items-center gap-1.5">
                <i className="ri-paypal-line text-blue-700"></i>
                <span className="text-xs font-medium text-gray-700">PayPal</span>
              </div>
              <div className="bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-200 flex items-center gap-1.5">
                <i className="ri-google-line text-red-600"></i>
                <span className="text-xs font-medium text-gray-700">Google Pay</span>
              </div>
              <div className="bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-200 flex items-center gap-1.5">
                <i className="ri-apple-line text-gray-800"></i>
                <span className="text-xs font-medium text-gray-700">Apple Pay</span>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-100">
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <i className="ri-lock-line text-green-600"></i>
                <span>Processado por Stripe</span>
              </div>
            </div>
          </motion.div>

          {/* Multi-Dispositivo */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all group border border-gray-100"
          >
            <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <i className="ri-devices-line text-3xl text-white"></i>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">Multi-Dispositivo</h3>
            <p className="text-gray-600 leading-relaxed mb-4">
              Leia em qualquer lugar: computador, tablet, smartphone ou e-reader.
            </p>
            <div className="flex gap-3 text-gray-400">
              <i className="ri-computer-line text-2xl hover:text-purple-500 transition-colors cursor-pointer"></i>
              <i className="ri-tablet-line text-2xl hover:text-purple-500 transition-colors cursor-pointer"></i>
              <i className="ri-smartphone-line text-2xl hover:text-purple-500 transition-colors cursor-pointer"></i>
              <i className="ri-book-open-line text-2xl hover:text-purple-500 transition-colors cursor-pointer"></i>
            </div>
          </motion.div>

          {/* Suporte Dedicado */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4 }}
            className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all group border border-gray-100"
          >
            <div className="w-16 h-16 bg-gradient-to-br from-[#FF6B6B] to-[#FF6B6B]/80 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <i className="ri-customer-service-2-line text-3xl text-white"></i>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">Suporte Dedicado</h3>
            <p className="text-gray-600 leading-relaxed mb-4">
              Estamos aqui para ajudar você sempre que precisar.
            </p>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-[#4ECDC4]/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <i className="ri-robot-line text-[#4ECDC4]"></i>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">IA 24/7</p>
                  <p className="text-xs text-gray-500">Assistente virtual sempre disponível</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-[#FF6B6B]/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <i className="ri-user-smile-line text-[#FF6B6B]"></i>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Humano</p>
                  <p className="text-xs text-gray-500">Seg-Sex: 8h às 16h</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-green-500/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <i className="ri-whatsapp-line text-green-600"></i>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">WhatsApp</p>
                  <p className="text-xs text-gray-500">+352 621 190 950</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Badges de Confiança */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-16 bg-gradient-to-r from-gray-50 to-gray-100 rounded-2xl p-8 border border-gray-200"
        >
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-green-500 rounded-full flex items-center justify-center">
                <i className="ri-shield-check-fill text-2xl text-white"></i>
              </div>
              <div>
                <h4 className="font-bold text-gray-900 text-lg">Compra 100% Segura</h4>
                <p className="text-sm text-gray-600">Garantia de satisfação ou seu dinheiro de volta</p>
              </div>
            </div>
            <div className="flex items-center gap-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-[#4ECDC4]">10.000+</p>
                <p className="text-xs text-gray-600">Clientes Satisfeitos</p>
              </div>
              <div className="w-px h-12 bg-gray-300"></div>
              <div className="text-center">
                <p className="text-3xl font-bold text-[#FF6B6B]">50.000+</p>
                <p className="text-xs text-gray-600">Ebooks Vendidos</p>
              </div>
              <div className="w-px h-12 bg-gray-300"></div>
              <div className="text-center">
                <p className="text-3xl font-bold text-purple-600">4.9/5</p>
                <p className="text-xs text-gray-600">Avaliação Média</p>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Newsletter */}
      <section className="bg-gradient-to-br from-[#FF6B6B]/10 to-[#4ECDC4]/10 py-20">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className="mb-6">
              <div className="w-20 h-20 bg-gradient-to-br from-[#FF6B6B] to-[#4ECDC4] rounded-full flex items-center justify-center mx-auto mb-6">
                <i className="ri-mail-line text-4xl text-white"></i>
              </div>
              <h2 className="font-serif text-5xl font-bold text-gray-900 mb-4">
                Receba Novidades e Ofertas
              </h2>
              <p className="text-lg text-gray-600 mb-10 max-w-2xl mx-auto">
                Inscreva-se na nossa newsletter e seja o primeiro a saber sobre lançamentos, promoções exclusivas e recomendações personalizadas
              </p>
            </div>
            
            <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-4 max-w-xl mx-auto">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Seu melhor email"
                className="flex-1 px-6 py-4 rounded-full border-2 border-gray-200 focus:border-[#4ECDC4] focus:outline-none text-gray-900"
                required
              />
              <button
                type="submit"
                disabled={subscribing}
                className="px-8 py-4 bg-[#4ECDC4] text-white rounded-full font-medium hover:bg-[#4ECDC4]/90 transition-all cursor-pointer whitespace-nowrap disabled:opacity-50"
              >
                {subscribing ? 'Inscrevendo...' : 'Inscrever-se'}
              </button>
            </form>
            
            <p className="text-sm text-gray-500 mt-4">
              🔒 Seus dados estão seguros. Não compartilhamos com terceiros.
            </p>
          </motion.div>
        </div>
      </section>

      {/* CTA Final */}
      <section id="contact" className="bg-gradient-to-br from-[#FF6B6B]/10 to-[#4ECDC4]/10 py-20">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="font-serif text-5xl font-bold text-gray-900 mb-6">
              Pronto Para Começar?
            </h2>
            <p className="text-lg text-gray-600 mb-10 max-w-2xl mx-auto">
              Junte-se a milhares de leitores que já descobriram a conveniência da leitura digital
            </p>
            <Link
              to="/catalog"
              className="inline-block px-10 py-5 bg-[#FF6B6B] text-white rounded-full font-medium text-lg hover:bg-[#FF6B6B]/90 transition-all cursor-pointer whitespace-nowrap shadow-lg hover:shadow-xl"
            >
              Explorar Catálogo Completo
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
