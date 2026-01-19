import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

export default function AboutPage() {
  const [settings, setSettings] = useState<any>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('site_settings')
        .select('*')
        .eq('section', 'about');

      if (error) throw error;

      const settingsObj: any = {};
      data?.forEach((setting: any) => {
        settingsObj[setting.key] = setting.value;
      });
      setSettings(settingsObj);
    } catch (error) {
      console.error('Erro ao buscar configurações:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-turquoise border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-cyan-50">
      <div className="pt-24 pb-16">
        {/* Hero Section com Imagem de Fundo VIBRANTE */}
        <div className="relative overflow-hidden py-32 mb-20">
          {/* Imagem de Fundo VIBRANTE E ANIMADA */}
          <div 
            className="absolute inset-0 bg-cover bg-center animate-ken-burns"
            style={{
              backgroundImage: `url(${settings.hero_background || 'https://readdy.ai/api/search-image?query=vibrant%20colorful%20bookstore%20with%20bright%20natural%20lighting%20featuring%20rainbow%20colored%20book%20spines%20on%20modern%20white%20shelves%2C%20cozy%20reading%20corner%20with%20plants%20and%20warm%20sunlight%2C%20cheerful%20inviting%20atmosphere%2C%20contemporary%20minimalist%20design%20with%20pops%20of%20color%2C%20professional%20lifestyle%20photography%2C%20high%20quality%20bright%20vivid%20colors&width=1920&height=800&seq=about-hero-vibrant&orientation=landscape'})`,
            }}
          ></div>
          
          {/* Overlay Escuro LEVE apenas para contraste do texto */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/20 to-black/30"></div>
          
          {/* Padrão Decorativo Animado */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-10 left-10 w-72 h-72 bg-white rounded-full blur-3xl animate-pulse-slow"></div>
            <div className="absolute bottom-10 right-10 w-96 h-96 bg-white rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '1s' }}></div>
          </div>

          {/* Conteúdo */}
          <div className="relative max-w-7xl mx-auto px-4 text-center">
            <div className="inline-flex items-center gap-2 px-6 py-3 bg-white/20 backdrop-blur-sm rounded-full mb-8 animate-fade-in">
              <i className="ri-book-open-line text-2xl text-white"></i>
              <span className="text-white font-semibold">Nossa História</span>
            </div>
            
            <h1 className="text-7xl font-bold text-white mb-6 animate-slide-up" style={{ fontFamily: 'Playfair Display, serif' }}>
              {settings.hero_title || 'Sobre a Nossa Livraria'}
            </h1>
            
            <p className="text-2xl text-white/95 max-w-4xl mx-auto leading-relaxed animate-slide-up" style={{ animationDelay: '0.1s' }}>
              {settings.hero_subtitle || 'Transformando a forma como você descobre e consome literatura digital'}
            </p>

            {/* Estatísticas Animadas */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16 max-w-4xl mx-auto">
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 hover:bg-white/20 transition-all duration-300 animate-fade-in" style={{ animationDelay: '0.2s' }}>
                <div className="text-5xl font-bold text-white mb-2">10.000+</div>
                <div className="text-white/90 font-medium">Ebooks Disponíveis</div>
              </div>
              
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 hover:bg-white/20 transition-all duration-300 animate-fade-in" style={{ animationDelay: '0.3s' }}>
                <div className="text-5xl font-bold text-white mb-2">50.000+</div>
                <div className="text-white/90 font-medium">Leitores Felizes</div>
              </div>
              
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 hover:bg-white/20 transition-all duration-300 animate-fade-in" style={{ animationDelay: '0.4s' }}>
                <div className="text-5xl font-bold text-white mb-2">4.9/5</div>
                <div className="text-white/90 font-medium">Avaliação Média</div>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4">
          {/* Nossa História */}
          <div className="grid lg:grid-cols-2 gap-16 items-center mb-24">
            <div className="order-2 lg:order-1 animate-slide-left">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-teal-100 to-cyan-100 rounded-full mb-6">
                <i className="ri-time-line text-teal-600"></i>
                <span className="text-teal-700 font-semibold text-sm">NOSSA JORNADA</span>
              </div>
              
              <h2 className="text-5xl font-bold text-gray-900 mb-6" style={{ fontFamily: 'Playfair Display, serif' }}>
                {settings.history_title || 'Nossa História'}
              </h2>
              
              <div className="space-y-6 text-lg text-gray-700 leading-relaxed">
                {(settings.history_text || 'Fundada em 2024, nossa livraria digital nasceu da paixão pela leitura e da visão de tornar o conhecimento acessível a todos. Começamos com um catálogo modesto de 50 títulos e hoje oferecemos mais de 10.000 ebooks em mais de 100 categorias diferentes.\n\nNossa missão é democratizar o acesso à literatura de qualidade, oferecendo uma plataforma intuitiva, segura e repleta de títulos cuidadosamente selecionados para todos os gostos e idades.\n\nAcreditamos que cada livro tem o poder de transformar vidas, expandir horizontes e criar conexões. Por isso, trabalhamos incansavelmente para oferecer a melhor experiência de compra e leitura digital.')
                  .split('\n\n')
                  .map((paragraph: string, index: number) => (
                    <p key={index} className="animate-fade-in" style={{ animationDelay: `${0.1 * index}s` }}>
                      {paragraph}
                    </p>
                  ))}
              </div>

              {/* Timeline */}
              <div className="mt-10 space-y-6">
                <div className="flex items-start gap-4 animate-fade-in" style={{ animationDelay: '0.3s' }}>
                  <div className="w-12 h-12 bg-gradient-to-br from-teal-500 to-cyan-500 rounded-xl flex items-center justify-center flex-shrink-0">
                    <i className="ri-rocket-line text-2xl text-white"></i>
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 mb-1">2024 - Fundação</h4>
                    <p className="text-gray-600">Início da jornada com 50 títulos selecionados</p>
                  </div>
                </div>

                <div className="flex items-start gap-4 animate-fade-in" style={{ animationDelay: '0.4s' }}>
                  <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-xl flex items-center justify-center flex-shrink-0">
                    <i className="ri-trophy-line text-2xl text-white"></i>
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 mb-1">Hoje</h4>
                    <p className="text-gray-600">10.000+ ebooks e 50.000+ leitores satisfeitos</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="order-1 lg:order-2 animate-slide-right">
              <div className="relative group">
                <div className="absolute -inset-4 bg-gradient-to-r from-teal-400 to-cyan-400 rounded-3xl blur-2xl opacity-30 group-hover:opacity-50 transition-opacity duration-500"></div>
                <img
                  src={settings.history_image || 'https://readdy.ai/api/search-image?query=modern%20elegant%20bookstore%20interior%20with%20warm%20lighting%20and%20comfortable%20reading%20spaces%20featuring%20wooden%20shelves%20filled%20with%20colorful%20books%20cozy%20armchairs%20and%20soft%20ambient%20glow%20creating%20an%20inviting%20atmosphere%20for%20book%20lovers%20minimalist%20design%20with%20natural%20materials%20professional%20photography&width=800&height=600&seq=about-story-img&orientation=landscape'}
                  alt="Nossa história"
                  className="relative rounded-3xl shadow-2xl w-full h-[500px] object-cover object-center transform group-hover:scale-105 transition-transform duration-500"
                />
                
                {/* Badge Flutuante */}
                <div className="absolute -bottom-6 -right-6 bg-white rounded-2xl shadow-2xl p-6 animate-float">
                  <div className="flex items-center gap-3">
                    <div className="w-14 h-14 bg-gradient-to-br from-teal-500 to-cyan-500 rounded-xl flex items-center justify-center">
                      <i className="ri-award-line text-3xl text-white"></i>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-gray-900">4.9/5</div>
                      <div className="text-sm text-gray-600">Avaliação</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Fundadora */}
          <div className="bg-gradient-to-br from-teal-500 via-cyan-500 to-blue-500 rounded-3xl shadow-2xl p-12 mb-24 relative overflow-hidden animate-fade-in">
            {/* Padrão Decorativo */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl"></div>
              <div className="absolute bottom-0 left-0 w-72 h-72 bg-white rounded-full blur-3xl"></div>
            </div>

            <div className="relative grid lg:grid-cols-3 gap-10 items-center">
              <div className="lg:col-span-1 flex justify-center">
                {settings.founder_photo ? (
                  <div className="relative group">
                    <div className="absolute -inset-2 bg-white/30 rounded-full blur-xl group-hover:blur-2xl transition-all duration-300"></div>
                    <img
                      src={settings.founder_photo}
                      alt={settings.founder_name || 'Fundadora'}
                      className="relative w-56 h-56 rounded-full object-cover border-4 border-white/50 shadow-2xl"
                    />
                  </div>
                ) : (
                  <div className="w-56 h-56 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center border-4 border-white/30 shadow-2xl group hover:scale-105 transition-transform duration-300">
                    <span className="text-9xl font-bold text-white" style={{ fontFamily: 'Playfair Display, serif' }}>
                      {(settings.founder_name || 'C')[0].toUpperCase()}
                    </span>
                  </div>
                )}
              </div>

              <div className="lg:col-span-2 text-white">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full mb-4">
                  <i className="ri-user-star-line text-white"></i>
                  <span className="font-semibold text-sm">FUNDADORA</span>
                </div>

                <h3 className="text-5xl font-bold mb-2" style={{ fontFamily: 'Playfair Display, serif' }}>
                  {settings.founder_name || 'Carminha'}
                </h3>
                
                <p className="text-xl text-white/90 mb-6 font-medium">
                  {settings.founder_title || 'Fundadora & CEO'}
                </p>

                <p className="text-xl text-white/95 mb-8 leading-relaxed italic">
                  "{settings.founder_bio || 'Minha paixão por livros começou na infância e nunca parou de crescer. Criar esta livraria digital foi realizar um sonho: conectar leitores apaixonados com histórias incríveis.'}"
                </p>

                {/* Botões de Contato */}
                <div className="flex flex-wrap gap-4">
                  <a 
                    href={`mailto:${settings.contact_email || 'c-arminha1973@hotmail.com'}`}
                    className="px-6 py-3 bg-white text-teal-600 rounded-xl font-semibold hover:bg-white/90 transition-all shadow-lg hover:shadow-xl hover:scale-105 whitespace-nowrap cursor-pointer flex items-center gap-2"
                  >
                    <i className="ri-mail-line text-xl"></i>
                    Email
                  </a>
                  
                  <a 
                    href={settings.facebook_url || 'https://facebook.com'}
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="px-6 py-3 bg-white/20 backdrop-blur-sm border-2 border-white/30 rounded-xl font-semibold hover:bg-white/30 transition-all shadow-lg hover:shadow-xl hover:scale-105 whitespace-nowrap cursor-pointer flex items-center gap-2"
                  >
                    <i className="ri-facebook-fill text-xl"></i>
                    Facebook
                  </a>
                  
                  <a 
                    href={`https://wa.me/${(settings.whatsapp || '352621190950').replace(/\D/g, '')}`}
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="px-6 py-3 bg-white/20 backdrop-blur-sm border-2 border-white/30 rounded-xl font-semibold hover:bg-white/30 transition-all shadow-lg hover:shadow-xl hover:scale-105 whitespace-nowrap cursor-pointer flex items-center gap-2"
                  >
                    <i className="ri-whatsapp-line text-xl"></i>
                    WhatsApp
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Nossos Valores */}
          <div className="mb-24">
            <div className="text-center mb-16 animate-fade-in">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-teal-100 to-cyan-100 rounded-full mb-6">
                <i className="ri-heart-line text-teal-600"></i>
                <span className="text-teal-700 font-semibold text-sm">NOSSOS PRINCÍPIOS</span>
              </div>
              
              <h2 className="text-5xl font-bold text-gray-900 mb-4" style={{ fontFamily: 'Playfair Display, serif' }}>
                {settings.values_title || 'Nossos Valores'}
              </h2>
              
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                {settings.values_subtitle || 'Os pilares que guiam nossa missão de democratizar o acesso à literatura'}
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {/* Valor 1 */}
              <div className="group bg-white rounded-3xl shadow-lg p-8 border-2 border-transparent hover:border-teal-400 hover:shadow-2xl transition-all duration-300 animate-fade-in" style={{ animationDelay: '0.1s' }}>
                <div className="w-20 h-20 bg-gradient-to-br from-teal-400 to-cyan-500 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                  <i className="ri-heart-line text-4xl text-white"></i>
                </div>
                
                <h3 className="text-2xl font-bold text-gray-900 mb-4">
                  {settings.value1_title || 'Paixão pela Leitura'}
                </h3>
                
                <p className="text-gray-600 leading-relaxed">
                  {settings.value1_description || 'Acreditamos no poder transformador dos livros e trabalhamos para inspirar o amor pela leitura em todas as idades.'}
                </p>
              </div>

              {/* Valor 2 */}
              <div className="group bg-white rounded-3xl shadow-lg p-8 border-2 border-transparent hover:border-cyan-400 hover:shadow-2xl transition-all duration-300 animate-fade-in" style={{ animationDelay: '0.2s' }}>
                <div className="w-20 h-20 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                  <i className="ri-shield-check-line text-4xl text-white"></i>
                </div>
                
                <h3 className="text-2xl font-bold text-gray-900 mb-4">
                  {settings.value2_title || 'Qualidade & Segurança'}
                </h3>
                
                <p className="text-gray-600 leading-relaxed">
                  {settings.value2_description || 'Selecionamos cuidadosamente cada título e garantimos transações 100% seguras para sua tranquilidade.'}
                </p>
              </div>

              {/* Valor 3 */}
              <div className="group bg-white rounded-3xl shadow-lg p-8 border-2 border-transparent hover:border-blue-400 hover:shadow-2xl transition-all duration-300 animate-fade-in" style={{ animationDelay: '0.3s' }}>
                <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                  <i className="ri-customer-service-2-line text-4xl text-white"></i>
                </div>
                
                <h3 className="text-2xl font-bold text-gray-900 mb-4">
                  {settings.value3_title || 'Atendimento Excepcional'}
                </h3>
                
                <p className="text-gray-600 leading-relaxed">
                  {settings.value3_description || 'Nossa equipe está sempre pronta para ajudar, garantindo a melhor experiência de compra e leitura.'}
                </p>
              </div>
            </div>
          </div>

          {/* Informações de Contato */}
          <div className="bg-gradient-to-br from-gray-50 to-teal-50 rounded-3xl shadow-xl p-12 mb-24 animate-fade-in">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-gray-900 mb-4" style={{ fontFamily: 'Playfair Display, serif' }}>
                Entre em Contato
              </h2>
              <p className="text-xl text-gray-600">
                Estamos aqui para ajudar você
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {/* Email */}
              <a 
                href={`mailto:${settings.contact_email || 'c-arminha1973@hotmail.com'}`}
                className="group bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 cursor-pointer border-2 border-transparent hover:border-teal-400"
              >
                <div className="w-16 h-16 bg-gradient-to-br from-teal-400 to-cyan-500 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  <i className="ri-mail-line text-3xl text-white"></i>
                </div>
                
                <h3 className="text-xl font-bold text-gray-900 mb-3">Email</h3>
                
                <p className="text-teal-600 font-medium break-all">
                  {settings.contact_email || 'c-arminha1973@hotmail.com'}
                </p>
                
                <p className="text-gray-600 text-sm mt-2">
                  Resposta em até 24 horas
                </p>
              </a>

              {/* Telefone */}
              <a 
                href={`tel:${(settings.contact_phone || '+352621190950').replace(/\s/g, '')}`}
                className="group bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 cursor-pointer border-2 border-transparent hover:border-cyan-400"
              >
                <div className="w-16 h-16 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  <i className="ri-phone-line text-3xl text-white"></i>
                </div>
                
                <h3 className="text-xl font-bold text-gray-900 mb-3">Telefone</h3>
                
                <p className="text-cyan-600 font-medium">
                  {settings.contact_phone || '+352 621 190 950'}
                </p>
                
                <p className="text-gray-600 text-sm mt-2">
                  Seg-Sex: 8h às 16h
                </p>
              </a>

              {/* WhatsApp */}
              <a 
                href={`https://wa.me/${(settings.whatsapp || '352621190950').replace(/\D/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="group bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 cursor-pointer border-2 border-transparent hover:border-green-400"
              >
                <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-emerald-500 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  <i className="ri-whatsapp-line text-3xl text-white"></i>
                </div>
                
                <h3 className="text-xl font-bold text-gray-900 mb-3">WhatsApp</h3>
                
                <p className="text-green-600 font-medium">
                  {settings.whatsapp || '+352 621 190 950'}
                </p>
                
                <p className="text-gray-600 text-sm mt-2">
                  Atendimento rápido
                </p>
              </a>
            </div>
          </div>

          {/* CTA Final */}
          <div className="text-center bg-gradient-to-br from-teal-500 via-cyan-500 to-blue-500 rounded-3xl shadow-2xl p-16 relative overflow-hidden animate-fade-in">
            {/* Padrão Decorativo */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-0 left-0 w-96 h-96 bg-white rounded-full blur-3xl"></div>
              <div className="absolute bottom-0 right-0 w-72 h-72 bg-white rounded-full blur-3xl"></div>
            </div>

            <div className="relative">
              <h2 className="text-5xl font-bold text-white mb-6" style={{ fontFamily: 'Playfair Display, serif' }}>
                Pronto para Começar sua Jornada?
              </h2>
              
              <p className="text-2xl text-white/95 mb-10 max-w-3xl mx-auto leading-relaxed">
                Explore nosso catálogo com mais de 10.000 títulos e encontre seu próximo livro favorito hoje mesmo!
              </p>
              
              <div className="flex flex-wrap gap-6 justify-center">
                <a
                  href="/catalog"
                  className="group px-10 py-5 bg-white text-teal-600 font-bold rounded-xl hover:bg-white/90 transition-all shadow-2xl hover:shadow-3xl hover:scale-105 whitespace-nowrap cursor-pointer flex items-center gap-3 text-lg"
                >
                  <i className="ri-book-open-line text-2xl group-hover:rotate-12 transition-transform duration-300"></i>
                  Explorar Catálogo
                </a>
                
                <a
                  href="/contact"
                  className="px-10 py-5 bg-white/20 backdrop-blur-sm border-2 border-white/50 text-white font-bold rounded-xl hover:bg-white/30 transition-all shadow-xl hover:shadow-2xl hover:scale-105 whitespace-nowrap cursor-pointer flex items-center gap-3 text-lg"
                >
                  <i className="ri-customer-service-2-line text-2xl"></i>
                  Fale Conosco
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
