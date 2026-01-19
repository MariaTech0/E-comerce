
import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../../../lib/supabase';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [showResendEmail, setShowResendEmail] = useState(false);

  useEffect(() => {
    // Verificar se já está logado
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // Verificar se é admin
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('role')
          .eq('id', user.id)
          .single();

        if (profile && ['superadmin', 'editor', 'support'].includes(profile.role)) {
          navigate('/dashboard');
        } else {
          navigate('/');
        }
      }
    };

    checkUser();
  }, [navigate]);

  const handleResendConfirmation = async () => {
    if (!email) {
      toast.error('Digite seu email primeiro');
      return;
    }

    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
      });

      if (error) throw error;

      toast.success('Email de confirmação reenviado! Verifique sua caixa de entrada.');
      setShowResendEmail(false);
    } catch (error: any) {
      console.error('Erro ao reenviar email:', error);
      toast.error('Erro ao reenviar email de confirmação');
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setShowResendEmail(false);

    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        // Verificar se é erro de email não confirmado
        if (authError.message.includes('Email not confirmed') || authError.message.includes('not confirmed')) {
          setShowResendEmail(true);
          toast.error('Email não confirmado. Verifique sua caixa de entrada.');
          setLoading(false);
          return;
        }
        
        // Outros erros de autenticação
        if (authError.message.includes('Invalid login credentials')) {
          toast.error('Email ou senha incorretos');
        } else {
          toast.error(authError.message || 'Erro ao fazer login');
        }
        setLoading(false);
        return;
      }

      if (!authData.user) {
        toast.error('Erro ao fazer login');
        setLoading(false);
        return;
      }

      // Verificar se o perfil existe
      const { data: existingProfile } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', authData.user.id)
        .single();

      // Se não existir, criar perfil
      if (!existingProfile) {
        const { error: profileError } = await supabase
          .from('user_profiles')
          .insert([
            {
              id: authData.user.id,
              full_name: email.split('@')[0],
              role: 'customer',
              force_password_change: false,
            },
          ]);

        if (profileError) {
          console.error('Erro ao criar perfil:', profileError);
        }
      }

      // Buscar perfil atualizado
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('role')
        .eq('id', authData.user.id)
        .single();

      toast.success('Login realizado com sucesso!');

      // Redirecionar baseado no role
      setTimeout(() => {
        if (profile && ['superadmin', 'editor', 'support'].includes(profile.role)) {
          navigate('/dashboard');
        } else {
          navigate('/');
        }
      }, 500);
    } catch (error: any) {
      console.error('Erro ao fazer login:', error);
      toast.error('Erro ao fazer login. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#4ECDC4]/10 to-[#FF6B6B]/10 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8">
          <div className="text-center mb-6 sm:mb-8">
            <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-[#FF6B6B] to-[#4ECDC4] rounded-2xl flex items-center justify-center mx-auto mb-4">
              <i className="ri-book-open-line text-white text-2xl sm:text-3xl"></i>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2" style={{ fontFamily: 'Playfair Display, serif' }}>
              Bem-vinda de volta
            </h1>
            <p className="text-sm sm:text-base text-gray-600">Entre para acessar sua conta</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5 sm:space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4ECDC4] focus:border-transparent transition-all text-sm sm:text-base"
                placeholder="seu@email.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Senha
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4ECDC4] focus:border-transparent transition-all text-sm sm:text-base"
                placeholder="••••••••"
              />
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 text-[#4ECDC4] border-gray-300 rounded focus:ring-[#4ECDC4] cursor-pointer"
                />
                <span className="ml-2 text-sm text-gray-600">Lembrar-me</span>
              </label>
            </div>

            {showResendEmail && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <i className="ri-mail-line text-amber-600 text-xl mt-0.5"></i>
                  <div className="flex-1">
                    <p className="text-sm text-amber-800 mb-2">
                      Seu email ainda não foi confirmado. Verifique sua caixa de entrada.
                    </p>
                    <button
                      type="button"
                      onClick={handleResendConfirmation}
                      className="text-sm text-amber-700 font-medium hover:text-amber-900 underline cursor-pointer"
                    >
                      Reenviar email de confirmação
                    </button>
                  </div>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full px-6 py-3 sm:py-4 bg-gradient-to-r from-[#4ECDC4] to-[#45B8B0] text-white font-semibold rounded-lg hover:shadow-lg transform hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap text-sm sm:text-base"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <i className="ri-loader-4-line animate-spin"></i>
                  Entrando...
                </span>
              ) : (
                'Entrar'
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Não tem uma conta?{' '}
              <Link to="/register" className="text-[#4ECDC4] font-medium hover:underline cursor-pointer">
                Criar conta
              </Link>
            </p>
          </div>
        </div>

        <div className="mt-6 text-center">
          <Link to="/" className="text-sm text-gray-600 hover:text-gray-900 cursor-pointer">
            <i className="ri-arrow-left-line mr-1"></i>
            Voltar para o site
          </Link>
        </div>
      </div>
    </div>
  );
}
