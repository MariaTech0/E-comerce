import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import toast from 'react-hot-toast';

interface Product {
  id: string;
  title: string;
  slug: string;
  description: string;
  price: number;
  cover_url: string;
  file_url: string;
  category_id: string;
  is_featured: boolean;
  is_active: boolean;
}

interface Category {
  id: string;
  name: string;
}

interface ProductModalProps {
  product: Product | null;
  categories: Category[];
  onClose: () => void;
  onSave: () => void;
}

export default function ProductModal({ product, categories, onClose, onSave }: ProductModalProps) {
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    description: '',
    price: '',
    cover_url: '',
    file_url: '',
    category_id: '',
    is_featured: false,
    is_active: true,
  });
  const [loading, setLoading] = useState(false);
  const [featuredCount, setFeaturedCount] = useState(0);

  useEffect(() => {
    if (product) {
      setFormData({
        title: product.title,
        slug: product.slug,
        description: product.description,
        price: product.price.toString(),
        cover_url: product.cover_url,
        file_url: product.file_url || '',
        category_id: product.category_id,
        is_featured: product.is_featured,
        is_active: product.is_active,
      });
    }
    
    // Carregar contagem de produtos em destaque
    loadFeaturedCount();
  }, [product]);

  const loadFeaturedCount = async () => {
    try {
      const { count, error } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .eq('is_featured', true)
        .eq('is_active', true);

      if (error) throw error;
      setFeaturedCount(count || 0);
    } catch (error) {
      console.error('Erro ao carregar contagem:', error);
    }
  };

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

  const handleTitleChange = (title: string) => {
    setFormData({
      ...formData,
      title,
      slug: generateSlug(title),
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const productData = {
        title: formData.title,
        slug: formData.slug,
        description: formData.description,
        price: parseFloat(formData.price),
        cover_url: formData.cover_url,
        file_url: formData.file_url,
        category_id: formData.category_id,
        is_featured: formData.is_featured,
        is_active: formData.is_active,
      };

      if (product) {
        // Atualizar
        const { error } = await supabase
          .from('products')
          .update(productData)
          .eq('id', product.id);

        if (error) throw error;
        toast.success('✅ Produto atualizado com sucesso!');
      } else {
        // Criar
        const { error } = await supabase
          .from('products')
          .insert([productData]);

        if (error) throw error;
        toast.success('✅ Produto criado com sucesso!');
      }

      onSave();
      onClose();
    } catch (error: any) {
      console.error('Erro ao salvar produto:', error);
      toast.error(error.message || 'Erro ao salvar produto');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">
            {product ? 'Editar Produto' : 'Novo Produto'}
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
          >
            <i className="ri-close-line text-xl text-gray-600"></i>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Título do Produto *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => handleTitleChange(e.target.value)}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4ECDC4] focus:border-transparent"
              placeholder="Ex: O Amor em Tempos Modernos"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Slug (URL amigável)
            </label>
            <input
              type="text"
              value={formData.slug}
              onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4ECDC4] focus:border-transparent bg-gray-50"
              placeholder="o-amor-em-tempos-modernos"
            />
            <p className="text-xs text-gray-500 mt-1">Gerado automaticamente a partir do título</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Descrição *
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              required
              rows={4}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4ECDC4] focus:border-transparent"
              placeholder="Descreva o produto..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Preço (€) *
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4ECDC4] focus:border-transparent"
                placeholder="19.99"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Categoria *
              </label>
              <select
                value={formData.category_id}
                onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4ECDC4] focus:border-transparent cursor-pointer"
              >
                <option value="">Selecione...</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              URL da Capa *
            </label>
            <input
              type="url"
              value={formData.cover_url}
              onChange={(e) => setFormData({ ...formData, cover_url: e.target.value })}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4ECDC4] focus:border-transparent"
              placeholder="https://exemplo.com/capa.jpg"
            />
            {formData.cover_url && (
              <div className="mt-3 p-4 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-600 mb-2">Pré-visualização:</p>
                <img
                  src={formData.cover_url}
                  alt="Preview"
                  className="h-40 w-auto object-contain mx-auto"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Link do Arquivo (PDF/EPUB)
            </label>
            <input
              type="url"
              value={formData.file_url}
              onChange={(e) => setFormData({ ...formData, file_url: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4ECDC4] focus:border-transparent"
              placeholder="https://exemplo.com/livro.pdf"
            />
            <p className="text-xs text-gray-500 mt-1">
              Link direto para o arquivo que será enviado ao cliente por email
            </p>
          </div>

          {/* CAIXA DE DESTAQUE COM CONTADOR */}
          <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-300 rounded-xl p-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-xl flex items-center justify-center flex-shrink-0">
                <i className="ri-star-fill text-2xl text-white"></i>
              </div>
              
              <div className="flex-1">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-lg font-bold text-gray-900">Produto em Destaque</h4>
                  <div className="bg-white px-4 py-2 rounded-full border-2 border-yellow-400 shadow-sm">
                    <span className="text-sm font-bold text-gray-700">
                      {featuredCount} {featuredCount === 1 ? 'produto' : 'produtos'} em destaque
                    </span>
                  </div>
                </div>
                
                <p className="text-sm text-gray-700 mb-4">
                  Produtos em destaque aparecem na seção "Livros Mais Vendidos" da página inicial. 
                  Marque esta opção para destacar este produto.
                </p>

                <label className="flex items-center gap-3 cursor-pointer group">
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={formData.is_featured}
                      onChange={(e) => setFormData({ ...formData, is_featured: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-14 h-8 bg-gray-300 rounded-full peer-checked:bg-gradient-to-r peer-checked:from-yellow-400 peer-checked:to-orange-500 transition-all duration-300"></div>
                    <div className="absolute left-1 top-1 w-6 h-6 bg-white rounded-full transition-all duration-300 peer-checked:translate-x-6 shadow-md"></div>
                  </div>
                  <span className="text-base font-semibold text-gray-900 group-hover:text-orange-600 transition-colors">
                    {formData.is_featured ? '⭐ Produto em Destaque' : 'Marcar como Destaque'}
                  </span>
                </label>

                {formData.is_featured && (
                  <div className="mt-4 p-3 bg-green-100 border border-green-300 rounded-lg flex items-center gap-2">
                    <i className="ri-checkbox-circle-fill text-green-600 text-xl"></i>
                    <span className="text-sm font-medium text-green-800">
                      Este produto aparecerá na página inicial!
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* PRODUTO ATIVO */}
          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                className="w-4 h-4 text-[#4ECDC4] border-gray-300 rounded focus:ring-[#4ECDC4] cursor-pointer"
              />
              <span className="text-sm text-gray-700">Produto Ativo (visível no site)</span>
            </label>
          </div>

          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer whitespace-nowrap"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-6 py-3 bg-[#4ECDC4] text-white rounded-lg hover:bg-[#4ECDC4]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer whitespace-nowrap"
            >
              {loading ? 'Salvando...' : 'Salvar Produto'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
