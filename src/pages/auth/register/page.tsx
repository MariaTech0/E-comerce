
import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../../../lib/supabase';
import toast from 'react-hot-toast';

export default function RegisterPage() {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Verificar se já está logado
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        navigate('/');
      }
    };

    checkUser();
  }, [navigate]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validações
    if (password.length < 6) {
      toast.error('A senha deve ter pelo menos 6 caracteres');
      return;
    }

    if (password !== confirmPassword) {
      toast.error('As senhas não coincidem');
      return;
    }

    if (!acceptTerms) {
      toast.error('Você precisa aceitar os termos e condições');
      return;
    }

    setLoading(true);

    try {
      // Criar usuário no Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            phone: phone || null,
          },
          // Desabilitar confirmação de email para facilitar o uso
          emailRedirectTo: window.location.origin,
        },
      });

      if (authError) throw authError;

      if (!authData.user) {
        throw new Error('Erro ao criar conta');
      }

      // Criar perfil do usuário
      const { error: profileError } = await supabase
        .from('user_profiles')
        .insert([
          {
            id: authData.user.id,
            full_name: fullName,
            role: 'customer',
            force_password_change: false,
          },
        ]);

      if (profileError) {
        console.error('Erro ao criar perfil:', profileError);
      }

      // Verificar se precisa confirmar email
      if (authData.session) {
        // Login automático (email não precisa confirmação)
        toast.success('Conta criada com sucesso! Bem-vindo(a)!');
        setTimeout(() => {
          navigate('/');
        }, 1000);
      } else {
        // Precisa confirmar email
        toast.success('Conta criada! Verifique seu email para confirmar o cadastro.', {
          duration: 5000,
        });
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      }
    } catch (error: any) {
      console.error('Erro ao criar conta:', error);
      
      if (error.message?.includes('already registered')) {
        toast.error('Este email já está cadastrado');
      } else {
        toast.error(error.message || 'Erro ao criar conta. Tente novamente.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 via-white to-green-50 px-4 py-12">
      <div className="w-full max-w-6xl">
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          <div className="grid lg:grid-cols-2">
            {/* Coluna Esquerda - Benefícios */}
            <div className="hidden lg:flex flex-col justify-center bg-gradient-to-br from-[#4ECDC4] to-[#45B8B0] p-12 text-white">
              <div className="mb-8">
                <div className="w-16 h-16 bg-gradient-to-br from-[#FF6B6B] via-[#FF8E53] to-[#4ECDC4] rounded-2xl flex items-center justify-center mb-4">
                  <i className="ri-book-open-line text-white text-3xl"></i>
                </div>
                <h2 className="text-3xl font-bold mb-2" style={{ fontFamily: 'Playfair Display, serif' }}>
                  Livraria Digital
                </h2>
                <p className="text-lg text-white/90">
                  Junte-se a milhares de leitores apaixonados!
                </p>
              </div>

              <div className="space-y-6 mb-8">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <i className="ri-shield-check-line text-2xl"></i>
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-1">100% Seguro</h3>
                    <p className="text-white/80 text-sm">Pagamentos protegidos e dados criptografados</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <i className="ri-cloud-line text-2xl"></i>
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-1">Download Instantâneo</h3>
                    <p className="text-white/80 text-sm">Acesso imediato aos seus ebooks após a compra</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <i className="ri-book-2-line text-2xl"></i>
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-1">Biblioteca Pessoal</h3>
                    <p className="text-white/80 text-sm">Todos os seus livros em um só lugar</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <i className="ri-customer-service-2-line text-2xl"></i>
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-1">Suporte 24/7</h3>
                    <p className="text-white/80 text-sm">Estamos sempre aqui para ajudar você</p>
                  </div>
                </div>
              </div>

              <div className="border-t border-white/20 pt-6">
                <p className="text-sm text-white/70 mb-3">Confiança e Segurança:</p>
                <div className="flex items-center gap-4 flex-wrap">
                  <div className="flex items-center gap-2 bg-white/10 px-3 py-2 rounded-lg">
                    <i className="ri-lock-line text-lg"></i>
                    <span className="text-sm font-medium">SSL Seguro</span>
                  </div>
                  <div className="flex items-center gap-2 bg-white/10 px-3 py-2 rounded-lg">
                    <i className="ri-shield-check-line text-lg"></i>
                    <span className="text-sm font-medium">Dados Protegidos</span>
                  </div>
                  <div className="flex items-center gap-2 bg-white/10 px-3 py-2 rounded-lg">
                    <i className="ri-verified-badge-line text-lg"></i>
                    <span className="text-sm font-medium">Verificado</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Coluna Direita - Formulário */}
            <div className="p-8 sm:p-12">
              {/* Logo Mobile */}
              <div className="lg:hidden text-center mb-8">
                <div className="w-16 h-16 bg-gradient-to-br from-[#FF6B6B] via-[#FF8E53] to-[#4ECDC4] rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <i className="ri-book-open-line text-white text-3xl"></i>
                </div>
                <h2 className="text-2xl font-bold text-gray-900" style={{ fontFamily: 'Playfair Display, serif' }}>
                  Livraria Digital
                </h2>
              </div>

              <div className="mb-8">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2" style={{ fontFamily: 'Playfair Display, serif' }}>
                  Criar Sua Conta
                </h1>
                <p className="text-gray-600">Preencha os dados abaixo para começar</p>
              </div>

              <form onSubmit={handleRegister} className="space-y-5">
                <div>
                  <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-2">
                    Nome Completo *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <i className="ri-user-line text-gray-400"></i>
                    </div>
                    <input
                      id="fullName"
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4ECDC4] focus:border-transparent transition-all text-sm"
                      placeholder="João Silva"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    Email *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <i className="ri-mail-line text-gray-400"></i>
                    </div>
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4ECDC4] focus:border-transparent transition-all text-sm"
                      placeholder="seu@email.com"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                    Telefone (opcional)
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <i className="ri-phone-line text-gray-400"></i>
                    </div>
                    <input
                      id="phone"
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4ECDC4] focus:border-transparent transition-all text-sm"
                      placeholder="+351 912 345 678"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                    Senha *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <i className="ri-lock-line text-gray-400"></i>
                    </div>
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4ECDC4] focus:border-transparent transition-all text-sm"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer"
                    >
                      <i className={`${showPassword ? 'ri-eye-off-line' : 'ri-eye-line'} text-gray-400 hover:text-gray-600`}></i>
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Mínimo de 6 caracteres</p>
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                    Confirmar Senha *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <i className="ri-lock-line text-gray-400"></i>
                    </div>
                    <input
                      id="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4ECDC4] focus:border-transparent transition-all text-sm"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer"
                    >
                      <i className={`${showConfirmPassword ? 'ri-eye-off-line' : 'ri-eye-line'} text-gray-400 hover:text-gray-600`}></i>
                    </button>
                  </div>
                </div>

                <div className="flex items-start">
                  <input
                    id="terms"
                    type="checkbox"
                    checked={acceptTerms}
                    onChange={(e) => setAcceptTerms(e.target.checked)}
                    className="w-4 h-4 text-[#4ECDC4] border-gray-300 rounded focus:ring-[#4ECDC4] cursor-pointer mt-1"
                  />
                  <label htmlFor="terms" className="ml-3 text-sm text-gray-600 cursor-pointer">
                    Aceito os{' '}
                    <a href="#" className="text-[#4ECDC4] hover:underline">
                      termos e condições
                    </a>{' '}
                    e a{' '}
                    <a href="#" className="text-[#4ECDC4] hover:underline">
                      política de privacidade
                    </a>
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full px-6 py-4 bg-gradient-to-r from-[#4ECDC4] to-[#45B8B0] text-white font-semibold rounded-lg hover:shadow-lg transform hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <i className="ri-loader-4-line animate-spin"></i>
                      Criando sua conta...
                    </span>
                  ) : (
                    'Criar Minha Conta'
                  )}
                </button>
              </form>

              <div className="mt-6 text-center">
                <p className="text-sm text-gray-600">
                  Já tem uma conta?{' '}
                  <Link to="/login" className="text-[#4ECDC4] font-medium hover:underline cursor-pointer">
                    Fazer login
                  </Link>
                </p>
              </div>

              {/* Selos Mobile */}
              <div className="lg:hidden mt-8 pt-6 border-t border-gray-200">
                <div className="flex items-center justify-center gap-4 flex-wrap">
                  <div className="flex items-center gap-2 text-gray-600">
                    <i className="ri-lock-line"></i>
                    <span className="text-xs">SSL Seguro</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <i className="ri-shield-check-line"></i>
                    <span className="text-xs">Protegido</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <i className="ri-verified-badge-line"></i>
                    <span className="text-xs">Verificado</span>
                  </div>
                </div>
              </div>
            </div>
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
