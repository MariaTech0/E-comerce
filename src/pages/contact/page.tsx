import { useState } from 'react';

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus('idle');

    try {
      const formBody = new URLSearchParams({
        name: formData.name,
        email: formData.email,
        subject: formData.subject,
        message: formData.message,
      }).toString();

      const response = await fetch('{{FORM_SUBMIT_URL}}', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formBody,
      });

      if (response.ok) {
        setSubmitStatus('success');
        setFormData({ name: '', email: '', subject: '', message: '' });
      } else {
        setSubmitStatus('error');
      }
    } catch (error) {
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-blue-50">
      <div className="pt-24 pb-16">
        {/* Hero Section com Imagem de Fundo VIBRANTE */}
        <div className="relative py-20 mb-16 overflow-hidden">
          {/* Imagem de Fundo VIBRANTE E ANIMADA */}
          <div 
            className="absolute inset-0 bg-cover bg-center animate-ken-burns"
            style={{
              backgroundImage: `url('https://readdy.ai/api/search-image?query=vibrant%20modern%20customer%20service%20office%20with%20bright%20natural%20lighting%2C%20colorful%20workspace%20with%20plants%20and%20cheerful%20atmosphere%2C%20friendly%20welcoming%20environment%2C%20contemporary%20design%20with%20vivid%20colors%2C%20professional%20photography%20high%20quality&width=1920&height=400&seq=contact-hero-vibrant&orientation=landscape')`,
            }}
          />
          
          {/* Overlay Gradiente MAIS LEVE */}
          <div className="absolute inset-0 bg-gradient-to-br from-sky-400/70 via-blue-500/60 to-cyan-500/70"></div>
          
          {/* Padrão Decorativo Animado */}
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-5 left-10 w-64 h-64 bg-white rounded-full blur-3xl animate-pulse-slow"></div>
            <div className="absolute bottom-5 right-10 w-80 h-80 bg-white rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '1s' }}></div>
          </div>

          {/* Conteúdo */}
          <div className="relative max-w-7xl mx-auto px-4 text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-white/20 backdrop-blur-sm rounded-3xl mb-6 shadow-xl">
              <i className="ri-customer-service-2-line text-4xl text-white"></i>
            </div>
            <h1 className="text-5xl font-bold text-white mb-4" style={{ fontFamily: 'Playfair Display, serif' }}>
              Entre em Contato
            </h1>
            <p className="text-xl text-white/95 max-w-2xl mx-auto">
              Estamos aqui para ajudar! Envie sua mensagem e responderemos o mais breve possível.
            </p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Informações de Contato */}
            <div className="lg:col-span-1 space-y-6">
              <div className="bg-white rounded-2xl shadow-lg p-8 border border-sky-100">
                <div className="flex items-start gap-4 mb-6">
                  <div className="w-12 h-12 bg-gradient-to-br from-sky-400 to-blue-500 rounded-xl flex items-center justify-center flex-shrink-0">
                    <i className="ri-mail-line text-white text-xl"></i>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">Email</h3>
                    <a href="mailto:c-arminha1973@hotmail.com" className="text-sky-500 hover:text-sky-600 cursor-pointer">
                      c-arminha1973@hotmail.com
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-4 mb-6">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center flex-shrink-0">
                    <i className="ri-whatsapp-line text-white text-xl"></i>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">WhatsApp</h3>
                    <a href="https://wa.me/352621190950" target="_blank" rel="noopener noreferrer" className="text-green-500 hover:text-green-600 cursor-pointer">
                      +352 621 190 950
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-teal-500 to-cyan-500 rounded-xl flex items-center justify-center flex-shrink-0">
                    <i className="ri-map-pin-line text-white text-xl"></i>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">Localização</h3>
                    <p className="text-gray-600">Luxemburgo</p>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-sky-400 to-blue-500 rounded-2xl shadow-lg p-8 text-white">
                <h3 className="text-2xl font-bold mb-4" style={{ fontFamily: 'Playfair Display, serif' }}>
                  Horário de Atendimento
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Segunda - Sexta</span>
                    <span>9h - 18h</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Sábado</span>
                    <span>10h - 14h</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Domingo</span>
                    <span>Fechado</span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-lg p-8 border border-sky-100">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Redes Sociais</h3>
                <div className="flex gap-3">
                  <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center text-white hover:scale-110 transition-transform cursor-pointer">
                    <i className="ri-facebook-fill text-xl"></i>
                  </a>
                  <a href="mailto:c-arminha1973@hotmail.com" className="w-12 h-12 bg-gradient-to-br from-sky-400 to-blue-500 rounded-xl flex items-center justify-center text-white hover:scale-110 transition-transform cursor-pointer">
                    <i className="ri-mail-line text-xl"></i>
                  </a>
                  <a href="https://wa.me/352621190950" target="_blank" rel="noopener noreferrer" className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center text-white hover:scale-110 transition-transform cursor-pointer">
                    <i className="ri-whatsapp-line text-xl"></i>
                  </a>
                </div>
              </div>
            </div>

            {/* Formulário */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-2xl shadow-lg p-8 border border-sky-100">
                <h2 className="text-3xl font-bold text-gray-900 mb-6" style={{ fontFamily: 'Playfair Display, serif' }}>
                  Envie sua Mensagem
                </h2>

                {submitStatus === 'success' && (
                  <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
                    <i className="ri-checkbox-circle-line text-green-500 text-2xl"></i>
                    <p className="text-green-700">Mensagem enviada com sucesso! Responderemos em breve.</p>
                  </div>
                )}

                {submitStatus === 'error' && (
                  <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
                    <i className="ri-error-warning-line text-red-500 text-2xl"></i>
                    <p className="text-red-700">Erro ao enviar mensagem. Tente novamente.</p>
                  </div>
                )}

                <form id="contact-form" data-readdy-form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Nome Completo *
                      </label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent text-sm"
                        placeholder="Seu nome"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email *
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent text-sm"
                        placeholder="seu@email.com"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Assunto *
                    </label>
                    <input
                      type="text"
                      name="subject"
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent text-sm"
                      placeholder="Sobre o que você quer falar?"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Mensagem *
                    </label>
                    <textarea
                      name="message"
                      value={formData.message}
                      onChange={(e) => {
                        if (e.target.value.length <= 500) {
                          setFormData({ ...formData, message: e.target.value });
                        }
                      }}
                      rows={6}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent text-sm resize-none"
                      placeholder="Escreva sua mensagem aqui..."
                      required
                      maxLength={500}
                    />
                    <p className="text-sm text-gray-500 mt-2">
                      {formData.message.length}/500 caracteres
                    </p>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-4 bg-gradient-to-r from-sky-400 to-blue-500 text-white font-semibold rounded-lg hover:from-sky-500 hover:to-blue-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-sky-500/30 whitespace-nowrap cursor-pointer"
                  >
                    {isSubmitting ? (
                      <>
                        <i className="ri-loader-4-line animate-spin mr-2"></i>
                        Enviando...
                      </>
                    ) : (
                      <>
                        <i className="ri-send-plane-fill mr-2"></i>
                        Enviar Mensagem
                      </>
                    )}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
