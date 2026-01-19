import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import toast from 'react-hot-toast';

interface CustomerModalProps {
  customer?: any;
  onClose: () => void;
  onSave: () => void;
}

export default function CustomerModal({ customer, onClose, onSave }: CustomerModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    full_name: '',
    phone: '',
    role: 'customer'
  });

  useEffect(() => {
    if (customer) {
      setFormData({
        email: customer.email || '',
        password: '',
        full_name: customer.full_name || '',
        phone: customer.phone || '',
        role: customer.role || 'customer'
      });
    }
  }, [customer]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (customer) {
        // Atualizar cliente existente
        const { error: profileError } = await supabase
          .from('user_profiles')
          .update({
            full_name: formData.full_name,
            phone: formData.phone,
            role: formData.role,
            updated_at: new Date().toISOString()
          })
          .eq('id', customer.id);

        if (profileError) throw profileError;

        // Se tiver senha nova, atualizar
        if (formData.password) {
          const { error: authError } = await supabase.auth.admin.updateUserById(
            customer.id,
            { password: formData.password }
          );
          if (authError) throw authError;
        }

        toast.success('Cliente atualizado com sucesso!');
      } else {
        // Criar novo cliente
        if (!formData.email || !formData.password) {
          toast.error('Email e senha são obrigatórios!');
          return;
        }

        if (formData.password.length < 6) {
          toast.error('A senha deve ter no mínimo 6 caracteres!');
          return;
        }

        // Criar usuário no Auth
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            data: {
              full_name: formData.full_name
            }
          }
        });

        if (authError) throw authError;

        if (!authData.user) {
          throw new Error('Erro ao criar usuário');
        }

        // Criar perfil
        const { error: profileError } = await supabase
          .from('user_profiles')
          .insert([{
            id: authData.user.id,
            email: formData.email,
            full_name: formData.full_name,
            phone: formData.phone,
            role: formData.role
          }]);

        if (profileError) throw profileError;

        toast.success('Cliente criado com sucesso!');
      }

      onSave();
      onClose();
    } catch (error: any) {
      console.error('Erro ao salvar cliente:', error);
      toast.error(error.message || 'Erro ao salvar cliente');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">
            {customer ? 'Editar Cliente' : 'Criar Novo Cliente'}
          </h2>
          <button
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors cursor-pointer"
          >
            <i className="ri-close-line text-2xl text-gray-600"></i>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Informações Básicas */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <i className="ri-user-line text-teal-600"></i>
              Informações Básicas
            </h3>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nome Completo *
              </label>
              <input
                type="text"
                required
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                placeholder="João Silva"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email *
              </label>
              <input
                type="email"
                required
                disabled={!!customer}
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                placeholder="joao@exemplo.com"
              />
              {customer && (
                <p className="text-xs text-gray-500 mt-1">
                  O email não pode ser alterado após a criação
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Senha {customer ? '(deixe em branco para não alterar)' : '*'}
              </label>
              <input
                type="password"
                required={!customer}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                placeholder="Mínimo 6 caracteres"
                minLength={6}
              />
              <p className="text-xs text-gray-500 mt-1">
                {customer ? 'Deixe em branco para manter a senha atual' : 'Mínimo 6 caracteres'}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Telefone
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                placeholder="+351 912 345 678"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipo de Conta *
              </label>
              <select
                required
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent cursor-pointer"
              >
                <option value="customer">Cliente</option>
                <option value="editor">Editor</option>
                <option value="support">Suporte</option>
                <option value="superadmin">Super Admin</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">
                Clientes: acesso normal ao site | Editores/Suporte/Admin: acesso ao dashboard
              </p>
            </div>
          </div>

          {/* Informações Adicionais */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <i className="ri-information-line text-blue-600 text-xl mt-0.5"></i>
              <div>
                <h4 className="font-semibold text-blue-900 mb-1">Sobre as Permissões</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• <strong>Cliente:</strong> Pode comprar e baixar ebooks</li>
                  <li>• <strong>Editor:</strong> Pode gerenciar produtos e categorias</li>
                  <li>• <strong>Suporte:</strong> Pode ver pedidos e ajudar clientes</li>
                  <li>• <strong>Super Admin:</strong> Acesso total ao sistema</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Botões */}
          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium cursor-pointer whitespace-nowrap"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-teal-500 to-cyan-500 text-white rounded-lg hover:shadow-lg transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer whitespace-nowrap"
            >
              {loading ? (
                <>
                  <i className="ri-loader-4-line animate-spin mr-2"></i>
                  Salvando...
                </>
              ) : (
                <>
                  <i className="ri-save-line mr-2"></i>
                  {customer ? 'Atualizar Cliente' : 'Criar Cliente'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
