import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import toast from 'react-hot-toast';

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  image_url?: string;
  icon?: string;
  is_active?: boolean;
}

interface CategoryModalProps {
  category: Category | null;
  onClose: () => void;
  onSave: () => void;
}

const iconOptions = [
  { value: 'ri-book-line', label: 'Livro' },
  { value: 'ri-book-2-line', label: 'Livro 2' },
  { value: 'ri-book-3-line', label: 'Livro 3' },
  { value: 'ri-book-open-line', label: 'Livro Aberto' },
  { value: 'ri-quill-pen-line', label: 'Pena' },
  { value: 'ri-heart-line', label: 'Coração' },
  { value: 'ri-magic-line', label: 'Mágico' },
  { value: 'ri-rocket-line', label: 'Foguete' },
  { value: 'ri-ghost-line', label: 'Fantasma' },
  { value: 'ri-sword-line', label: 'Espada' },
  { value: 'ri-star-line', label: 'Estrela' },
  { value: 'ri-fire-line', label: 'Fogo' },
  { value: 'ri-leaf-line', label: 'Folha' },
  { value: 'ri-moon-line', label: 'Lua' },
  { value: 'ri-sun-line', label: 'Sol' },
];

export default function CategoryModal({ category, onClose, onSave }: CategoryModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    image_url: '',
    icon: 'ri-book-line',
    is_active: true,
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (category) {
      setFormData({
        name: category.name,
        slug: category.slug,
        description: category.description || '',
        image_url: category.image_url || '',
        icon: category.icon || 'ri-book-line',
        is_active: category.is_active !== false,
      });
    }
  }, [category]);

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

  const handleNameChange = (name: string) => {
    setFormData({
      ...formData,
      name,
      slug: generateSlug(name),
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (category) {
        // Atualizar
        const { error } = await supabase
          .from('categories')
          .update(formData)
          .eq('id', category.id);

        if (error) throw error;
        toast.success('Categoria atualizada com sucesso!');
      } else {
        // Criar
        const { error } = await supabase
          .from('categories')
          .insert([formData]);

        if (error) throw error;
        toast.success('Categoria criada com sucesso!');
      }

      onSave();
      onClose();
    } catch (error: any) {
      console.error('Erro ao salvar categoria:', error);
      toast.error(error.message || 'Erro ao salvar categoria');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between sticky top-0 bg-white z-10">
          <h2 className="text-2xl font-bold text-gray-900">
            {category ? 'Editar Categoria' : 'Nova Categoria'}
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
          >
            <i className="ri-close-line text-xl text-gray-600"></i>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Nome */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nome da Categoria *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleNameChange(e.target.value)}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4ECDC4] focus:border-transparent"
              placeholder="Ex: Romance"
            />
          </div>

          {/* Slug */}
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
              placeholder="romance"
            />
            <p className="text-xs text-gray-500 mt-1">Gerado automaticamente a partir do nome</p>
          </div>

          {/* Descrição */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Descrição
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4ECDC4] focus:border-transparent"
              placeholder="Descreva a categoria..."
            />
          </div>

          {/* Ícone */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Ícone
            </label>
            <div className="grid grid-cols-5 gap-3">
              {iconOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setFormData({ ...formData, icon: option.value })}
                  className={`p-4 border-2 rounded-lg transition-all cursor-pointer ${
                    formData.icon === option.value
                      ? 'border-turquoise bg-turquoise/10'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  title={option.label}
                >
                  <i className={`${option.value} text-2xl ${
                    formData.icon === option.value ? 'text-turquoise' : 'text-gray-600'
                  }`}></i>
                </button>
              ))}
            </div>
          </div>

          {/* URL da Imagem */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              URL da Imagem de Fundo
            </label>
            <input
              type="url"
              value={formData.image_url}
              onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4ECDC4] focus:border-transparent"
              placeholder="https://exemplo.com/imagem.jpg"
            />
            <p className="text-xs text-gray-500 mt-1">
              Deixe em branco para usar imagem automática baseada no nome da categoria
            </p>
            
            {/* Preview da Imagem */}
            {(formData.image_url || formData.name) && (
              <div className="mt-3">
                <p className="text-xs font-medium text-gray-700 mb-2">Preview:</p>
                <div className="relative h-48 rounded-lg overflow-hidden">
                  <img
                    src={formData.image_url || `https://readdy.ai/api/search-image?query=beautiful%20minimalist%20$%7BformData.name%7D%20books%20category%20background%20with%20soft%20colors%20and%20elegant%20design%20modern%20aesthetic%20clean%20composition&width=600&height=800&seq=preview&orientation=portrait`}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>
                  <div className="absolute bottom-4 left-4">
                    <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center mb-2">
                      <i className={`${formData.icon} text-2xl text-white`}></i>
                    </div>
                    <h3 className="font-serif text-xl font-bold text-white">
                      {formData.name || 'Nome da Categoria'}
                    </h3>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Status */}
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="is_active"
              checked={formData.is_active}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              className="w-5 h-5 text-turquoise border-gray-300 rounded focus:ring-turquoise cursor-pointer"
            />
            <label htmlFor="is_active" className="text-sm font-medium text-gray-700 cursor-pointer">
              Categoria ativa (visível no site)
            </label>
          </div>

          {/* Botões */}
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
              {loading ? 'Salvando...' : 'Salvar Categoria'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
