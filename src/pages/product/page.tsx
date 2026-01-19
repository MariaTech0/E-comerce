import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { books } from '../../mocks/books';
import { useCartStore } from '../../store/cartStore';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';

export default function ProductPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('description');
  const { addItem } = useCartStore();
  const [user, setUser] = useState<any>(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [reviews, setReviews] = useState<any[]>([]);
  const [reviewForm, setReviewForm] = useState({
    rating: 5,
    comment: '',
    isAnonymous: false,
    reviewerName: ''
  });
  const [relatedProducts, setRelatedProducts] = useState<any[]>([]);

  useEffect(() => {
    checkUser();
    loadProduct();
  }, [slug]);

  const checkUser = async () => {
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    setUser(currentUser);
  };

  const loadProduct = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('slug', slug)
        .single();

      if (error) throw error;
      setProduct(data);
      
      if (data) {
        loadReviews(data.id);
        loadRelatedProducts(data.category_id, data.id);
        if (user) {
          checkFavorite(data.id);
        }
      }
    } catch (error) {
      console.error('Erro ao carregar produto:', error);
    }
  };

  const loadReviews = async (productId: string) => {
    try {
      const { data, error } = await supabase
        .from('reviews')
        .select('*')
        .eq('product_id', productId)
        .eq('is_approved', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setReviews(data || []);
    } catch (error) {
      console.error('Erro ao carregar avaliações:', error);
    }
  };

  const loadRelatedProducts = async (categoryId: string, currentProductId: string) => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('category_id', categoryId)
        .eq('is_active', true)
        .neq('id', currentProductId)
        .limit(4);

      if (error) throw error;
      setRelatedProducts(data || []);
    } catch (error) {
      console.error('Erro ao carregar produtos relacionados:', error);
    }
  };

  const checkFavorite = async (productId: string) => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('user_favorites')
        .select('id')
        .eq('user_id', user.id)
        .eq('product_id', productId)
        .single();

      setIsFavorite(!!data);
    } catch (error) {
      // Não é favorito
    }
  };

  const toggleFavorite = async () => {
    if (!user) {
      toast.error('Faça login para adicionar favoritos!');
      return;
    }

    if (!product) return;

    try {
      if (isFavorite) {
        const { error } = await supabase
          .from('user_favorites')
          .delete()
          .eq('user_id', user.id)
          .eq('product_id', product.id);

        if (error) throw error;
        setIsFavorite(false);
        toast.success('Removido dos favoritos!');
      } else {
        const { error } = await supabase
          .from('user_favorites')
          .insert([{ user_id: user.id, product_id: product.id }]);

        if (error) throw error;
        setIsFavorite(true);
        toast.success('Adicionado aos favoritos!');
      }
    } catch (error) {
      console.error('Erro ao atualizar favorito:', error);
      toast.error('Erro ao atualizar favorito');
    }
  };

  const handleAddToCart = () => {
    if (!product) return;
    
    addItem({
      id: product.id,
      title: product.title,
      author: product.author,
      price: product.price,
      cover: product.cover_url,
      quantity: 1,
    });
    toast.success('Livro adicionado ao carrinho!');
  };

  const handleBuyNow = () => {
    if (!product) return;
    
    // Adiciona ao carrinho
    addItem({
      id: product.id,
      title: product.title,
      author: product.author,
      price: product.price,
      cover: product.cover_url,
      quantity: 1,
    });
    
    // Redireciona para checkout
    toast.success('Redirecionando para pagamento...');
    setTimeout(() => {
      navigate('/checkout');
    }, 500);
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!reviewForm.comment.trim()) {
      toast.error('Por favor, escreva um comentário!');
      return;
    }

    if (!reviewForm.isAnonymous && !reviewForm.reviewerName.trim()) {
      toast.error('Por favor, informe seu nome ou marque como anônimo!');
      return;
    }

    try {
      const reviewData: any = {
        product_id: product.id,
        rating: reviewForm.rating,
        comment: reviewForm.comment,
        is_anonymous: reviewForm.isAnonymous,
        is_approved: false
      };

      if (user) {
        reviewData.user_id = user.id;
      }

      if (!reviewForm.isAnonymous && reviewForm.reviewerName) {
        reviewData.reviewer_name = reviewForm.reviewerName;
      }

      const { error } = await supabase
        .from('reviews')
        .insert([reviewData]);

      if (error) throw error;

      toast.success('Avaliação enviada! Será publicada após aprovação.');
      setReviewForm({
        rating: 5,
        comment: '',
        isAnonymous: false,
        reviewerName: ''
      });
    } catch (error) {
      console.error('Erro ao enviar avaliação:', error);
      toast.error('Erro ao enviar avaliação');
    }
  };

  if (!product) {
    return (
      <div className="min-h-screen bg-cream pt-24 flex items-center justify-center">
        <div className="text-center">
          <i className="ri-book-line text-6xl text-gray-300 mb-4"></i>
          <p className="text-gray-500 text-lg">Livro não encontrado</p>
          <Link to="/catalog" className="text-coral hover:underline mt-4 inline-block cursor-pointer">
            Voltar ao catálogo
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream pt-24 pb-20">
      <div className="max-w-7xl mx-auto px-6">
        {/* Breadcrumb */}
        <div className="mb-6">
          <nav className="flex items-center gap-2 text-sm text-gray-500">
            <Link to="/" className="hover:text-coral cursor-pointer transition-colors">
              <i className="ri-home-4-line mr-1"></i>
              Início
            </Link>
            <i className="ri-arrow-right-s-line text-xs"></i>
            <Link to="/catalog" className="hover:text-coral cursor-pointer transition-colors">
              Catálogo
            </Link>
            <i className="ri-arrow-right-s-line text-xs"></i>
            <span className="text-dark font-medium">{product.title}</span>
          </nav>
        </div>

        {/* Produto */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 mb-20">
          {/* Imagem */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <div className="bg-white rounded-3xl p-12 flex items-center justify-center relative shadow-lg" data-product-shop>
              <img
                src={product.cover_url}
                alt={product.title}
                className="max-h-[500px] w-auto object-contain drop-shadow-2xl"
              />
              <button className="absolute top-6 right-6 px-4 py-2 bg-white/90 backdrop-blur-sm rounded-full text-sm font-medium text-dark hover:bg-white transition-all cursor-pointer whitespace-nowrap shadow-md">
                <i className="ri-eye-line mr-2"></i>
                Preview Gratuito
              </button>
            </div>

            {/* Garantias */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-white rounded-xl p-4 text-center shadow-sm">
                <i className="ri-shield-check-line text-3xl text-turquoise mb-2"></i>
                <p className="text-xs font-medium text-gray-700">Pagamento Seguro</p>
              </div>
              <div className="bg-white rounded-xl p-4 text-center shadow-sm">
                <i className="ri-download-cloud-line text-3xl text-coral mb-2"></i>
                <p className="text-xs font-medium text-gray-700">Download Imediato</p>
              </div>
              <div className="bg-white rounded-xl p-4 text-center shadow-sm">
                <i className="ri-mail-line text-3xl text-purple mb-2"></i>
                <p className="text-xs font-medium text-gray-700">Enviado por Email</p>
              </div>
            </div>
          </motion.div>

          {/* Detalhes */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <div>
              <h1 className="font-serif text-5xl font-bold text-dark mb-3 leading-tight">{product.title}</h1>
              <p className="text-xl text-gray-600 mb-6">
                <i className="ri-quill-pen-line mr-2"></i>
                por <span className="font-medium text-dark">{product.author}</span>
              </p>

              {/* Avaliações */}
              <div className="flex items-center gap-3 mb-8">
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <i
                      key={i}
                      className={`ri-star-${i < Math.floor(product.rating_avg || 0) ? 'fill' : 'line'} text-yellow-400 text-xl`}
                    ></i>
                  ))}
                </div>
                <span className="text-gray-600 font-medium">
                  {(product.rating_avg || 0).toFixed(1)}
                </span>
                <span className="text-gray-400">•</span>
                <span className="text-gray-600">
                  {product.rating_count || 0} {product.rating_count === 1 ? 'avaliação' : 'avaliações'}
                </span>
              </div>

              {/* Preço */}
              <div className="mb-8 bg-gradient-to-r from-coral/10 to-turquoise/10 rounded-2xl p-6">
                <div className="flex items-baseline gap-3">
                  <span className="text-5xl font-bold text-coral">€{product.price.toFixed(2)}</span>
                  <span className="text-gray-500 text-sm">IVA incluído</span>
                </div>
              </div>

              {/* Descrição */}
              <p className="text-gray-700 leading-relaxed mb-8 text-lg">
                {product.description}
              </p>

              {/* Botões de Ação */}
              <div className="space-y-3 mb-8">
                {/* Comprar Agora - DESTAQUE */}
                <button
                  onClick={handleBuyNow}
                  className="w-full py-5 bg-gradient-to-r from-turquoise to-turquoise/90 text-white rounded-full font-bold text-lg hover:shadow-2xl hover:scale-[1.02] transition-all cursor-pointer whitespace-nowrap flex items-center justify-center gap-2"
                >
                  <i className="ri-flashlight-fill text-xl"></i>
                  Comprar Agora
                </button>

                {/* Adicionar ao Carrinho */}
                <button
                  onClick={handleAddToCart}
                  className="w-full py-5 bg-gradient-to-r from-coral to-coral/90 text-white rounded-full font-semibold text-lg hover:shadow-lg hover:scale-[1.01] transition-all cursor-pointer whitespace-nowrap flex items-center justify-center gap-2"
                >
                  <i className="ri-shopping-cart-line text-xl"></i>
                  Adicionar ao Carrinho
                </button>

                {/* Favoritos */}
                <button
                  onClick={toggleFavorite}
                  className={`w-full py-5 border-2 rounded-full font-semibold text-lg transition-all cursor-pointer whitespace-nowrap flex items-center justify-center gap-2 ${
                    isFavorite
                      ? 'border-red-500 text-red-500 bg-red-50 hover:bg-red-100'
                      : 'border-dark text-dark hover:bg-dark hover:text-white'
                  }`}
                >
                  <i className={`${isFavorite ? 'ri-heart-fill' : 'ri-heart-line'} text-xl`}></i>
                  {isFavorite ? 'Remover dos Favoritos' : 'Adicionar aos Favoritos'}
                </button>
              </div>

              {/* Informações Técnicas */}
              <div className="grid grid-cols-2 gap-4 p-6 bg-gradient-to-br from-gray-50 to-white rounded-2xl border border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-turquoise/10 rounded-lg flex items-center justify-center">
                    <i className="ri-file-text-line text-turquoise text-xl"></i>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Páginas</p>
                    <p className="font-semibold text-dark">{product.pages || product.page_count || 'N/A'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-coral/10 rounded-lg flex items-center justify-center">
                    <i className="ri-file-pdf-line text-coral text-xl"></i>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Formato</p>
                    <p className="font-semibold text-dark">{product.format || 'PDF'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple/10 rounded-lg flex items-center justify-center">
                    <i className="ri-global-line text-purple text-xl"></i>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Idioma</p>
                    <p className="font-semibold text-dark">{product.language || 'Português'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-yellow-500/10 rounded-lg flex items-center justify-center">
                    <i className="ri-barcode-line text-yellow-600 text-xl"></i>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">ISBN</p>
                    <p className="font-semibold text-dark text-sm">{product.isbn || 'N/A'}</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Tabs */}
        <div className="mb-20">
          <div className="flex gap-4 mb-8 border-b border-gray-200">
            {['description', 'reviews'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-3 font-medium transition-all cursor-pointer whitespace-nowrap relative ${
                  activeTab === tab
                    ? 'text-coral'
                    : 'text-gray-600 hover:text-coral'
                }`}
              >
                {tab === 'description' && (
                  <>
                    <i className="ri-file-text-line mr-2"></i>
                    Descrição Completa
                  </>
                )}
                {tab === 'reviews' && (
                  <>
                    <i className="ri-star-line mr-2"></i>
                    Avaliações ({reviews.length})
                  </>
                )}
                {activeTab === tab && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-coral"></div>
                )}
              </button>
            ))}
          </div>

          <div className="bg-white rounded-2xl p-10 shadow-sm">
            {activeTab === 'description' && (
              <div className="prose max-w-none">
                <h2 className="text-2xl font-bold text-dark mb-4">Sobre este Ebook</h2>
                <p className="text-gray-700 leading-relaxed text-lg mb-6">
                  {product.description}
                </p>
                <div className="bg-gradient-to-r from-turquoise/10 to-coral/10 rounded-xl p-6 mt-6">
                  <h3 className="text-xl font-bold text-dark mb-3 flex items-center gap-2">
                    <i className="ri-information-line text-turquoise"></i>
                    Como Funciona
                  </h3>
                  <ul className="space-y-2 text-gray-700">
                    <li className="flex items-start gap-2">
                      <i className="ri-check-line text-turquoise mt-1"></i>
                      <span>Após a compra, você receberá um email com o link de download</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <i className="ri-check-line text-turquoise mt-1"></i>
                      <span>O ebook estará disponível nos formatos {product.format || 'PDF, EPUB, MOBI'}</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <i className="ri-check-line text-turquoise mt-1"></i>
                      <span>Leia em qualquer dispositivo: computador, tablet ou smartphone</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <i className="ri-check-line text-turquoise mt-1"></i>
                      <span>Acesso ilimitado - baixe quantas vezes quiser</span>
                    </li>
                  </ul>
                </div>
              </div>
            )}

            {activeTab === 'reviews' && (
              <div className="space-y-8">
                {/* Estatísticas de Avaliações */}
                <div className="flex items-center gap-8 mb-8 pb-8 border-b border-gray-200">
                  <div className="text-center">
                    <div className="text-6xl font-bold text-dark mb-2">{(product.rating_avg || 0).toFixed(1)}</div>
                    <div className="flex items-center gap-1 mb-2 justify-center">
                      {[...Array(5)].map((_, i) => (
                        <i
                          key={i}
                          className={`ri-star-${i < Math.floor(product.rating_avg || 0) ? 'fill' : 'line'} text-yellow-400 text-xl`}
                        ></i>
                      ))}
                    </div>
                    <p className="text-sm text-gray-600">{product.rating_count || 0} avaliações</p>
                  </div>
                </div>

                {/* Formulário de Nova Avaliação */}
                <div className="bg-gradient-to-br from-pink-50 to-rose-50 p-6 rounded-xl border-2 border-pink-200">
                  <h3 className="text-xl font-bold text-dark mb-4 flex items-center gap-2">
                    <i className="ri-chat-new-line text-pink-500"></i>
                    Deixe sua Avaliação
                  </h3>
                  <form onSubmit={handleSubmitReview} className="space-y-4">
                    {/* Rating */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Sua Nota
                      </label>
                      <div className="flex gap-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setReviewForm({ ...reviewForm, rating: star })}
                            className="cursor-pointer"
                          >
                            <i
                              className={`ri-star-${star <= reviewForm.rating ? 'fill' : 'line'} text-3xl text-yellow-400 hover:scale-110 transition-transform`}
                            ></i>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Nome (opcional se anônimo) */}
                    {!reviewForm.isAnonymous && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Seu Nome
                        </label>
                        <input
                          type="text"
                          value={reviewForm.reviewerName}
                          onChange={(e) => setReviewForm({ ...reviewForm, reviewerName: e.target.value })}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                          placeholder="Digite seu nome"
                        />
                      </div>
                    )}

                    {/* Checkbox Anônimo */}
                    <div>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={reviewForm.isAnonymous}
                          onChange={(e) => setReviewForm({ ...reviewForm, isAnonymous: e.target.checked })}
                          className="w-4 h-4 text-pink-500 border-gray-300 rounded focus:ring-pink-500 cursor-pointer"
                        />
                        <span className="text-sm text-gray-700">Avaliar anonimamente</span>
                      </label>
                    </div>

                    {/* Comentário */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Seu Comentário
                      </label>
                      <textarea
                        value={reviewForm.comment}
                        onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
                        rows={4}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                        placeholder="Compartilhe sua experiência com este livro..."
                        required
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full py-3 bg-gradient-to-r from-pink-500 to-rose-500 text-white font-semibold rounded-lg hover:from-pink-600 hover:to-rose-600 transition-all cursor-pointer whitespace-nowrap"
                    >
                      <i className="ri-send-plane-fill mr-2"></i>
                      Enviar Avaliação
                    </button>
                    <p className="text-xs text-gray-500 text-center">
                      Sua avaliação será publicada após aprovação
                    </p>
                  </form>
                </div>

                {/* Lista de Avaliações */}
                <div className="space-y-4">
                  <h3 className="text-xl font-bold text-dark mb-4 flex items-center gap-2">
                    <i className="ri-chat-3-line text-coral"></i>
                    Avaliações dos Clientes
                  </h3>
                  {reviews.length === 0 ? (
                    <div className="text-center py-12 bg-gray-50 rounded-xl">
                      <i className="ri-chat-3-line text-6xl text-gray-300 mb-3"></i>
                      <p className="text-gray-500 text-lg">Seja o primeiro a avaliar este livro!</p>
                    </div>
                  ) : (
                    reviews.map((review) => (
                      <div key={review.id} className="bg-gray-50 p-6 rounded-xl border border-gray-200 hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-12 h-12 bg-gradient-to-br from-coral to-turquoise rounded-full flex items-center justify-center text-white font-bold text-lg">
                            {review.is_anonymous ? '?' : (review.reviewer_name?.[0]?.toUpperCase() || 'U')}
                          </div>
                          <div className="flex-1">
                            <p className="font-semibold text-dark">
                              {review.is_anonymous ? 'Anônimo' : review.reviewer_name || 'Usuário'}
                            </p>
                            <div className="flex items-center gap-2">
                              <div className="flex items-center gap-1">
                                {[...Array(5)].map((_, j) => (
                                  <i key={j} className={`ri-star-${j < review.rating ? 'fill' : 'line'} text-yellow-400 text-sm`}></i>
                                ))}
                              </div>
                              <span className="text-xs text-gray-500">
                                {new Date(review.created_at).toLocaleDateString('pt-PT', { 
                                  day: '2-digit', 
                                  month: 'long', 
                                  year: 'numeric' 
                                })}
                              </span>
                            </div>
                          </div>
                        </div>
                        <p className="text-gray-700 leading-relaxed">{review.comment}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Produtos Relacionados */}
        {relatedProducts.length > 0 && (
          <div>
            <h2 className="font-serif text-4xl font-bold text-dark mb-8">
              Livros <span className="text-turquoise">Relacionados</span>
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-7">
              {relatedProducts.map((relatedProduct) => (
                <Link
                  key={relatedProduct.id}
                  to={`/product/${relatedProduct.slug}`}
                  className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-xl transition-all group cursor-pointer"
                  data-product-shop
                >
                  <div className="relative h-72 bg-white flex items-center justify-center p-6">
                    <img
                      src={relatedProduct.cover_url}
                      alt={relatedProduct.title}
                      className="h-full w-auto object-contain drop-shadow-lg group-hover:scale-105 transition-transform"
                    />
                  </div>
                  <div className="p-5">
                    <h3 className="font-serif text-lg font-medium text-dark mb-1 line-clamp-2 group-hover:text-coral transition-colors">
                      {relatedProduct.title}
                    </h3>
                    <p className="text-sm text-gray-600 mb-3">{relatedProduct.author}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-bold text-coral">€{relatedProduct.price.toFixed(2)}</span>
                      <div className="flex items-center gap-1">
                        <i className="ri-star-fill text-yellow-400 text-sm"></i>
                        <span className="text-sm text-gray-600">{(relatedProduct.rating_avg || 0).toFixed(1)}</span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
