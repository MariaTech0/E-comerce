
import { Link } from 'react-router-dom';
import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';

export default function Footer() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase
        .from('newsletter_subscribers')
        .insert([{ email, subscribed_at: new Date().toISOString() }]);

      if (error) throw error;
      
      toast.success('Inscrição realizada com sucesso!');
      setEmail('');
    } catch (error: any) {
      console.error('Erro ao inscrever:', error);
      toast.error('Erro ao realizar inscrição. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <footer className="bg-gradient-to-br from-sky-200 via-blue-200 to-cyan-200 text-gray-800 mt-20 mx-8 rounded-t-3xl relative overflow-hidden">
      <div className="absolute inset-0 flex items-end justify-center opacity-10 pointer-events-none">
        <i className="ri-book-open-line text-[180px] text-white/30 pb-8"></i>
      </div>

      <div className="relative max-w-7xl mx-auto px-12 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          {/* Sobre a Livraria */}
          <div className="md:col-span-1">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-white/40 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                <i className="ri-book-2-line text-2xl text-gray-800"></i>
              </div>
              <h3 className="font-serif text-2xl font-bold text-gray-900">
                Livraria Digital
              </h3>
            </div>
            <p className="text-gray-700 leading-relaxed">
              Milhares de ebooks em mais de 100 categorias. Transformando a forma como você descobre e consome literatura digital.
            </p>
          </div>

          {/* Links Rápidos */}
          <div>
            <h4 className="font-bold text-lg text-gray-900 mb-4">Links Rápidos</h4>
            <ul className="space-y-3">
              <li>
                <Link to="/catalog" className="text-gray-700 hover:text-gray-900 transition-colors flex items-center gap-2 cursor-pointer">
                  <i className="ri-arrow-right-s-line"></i>
                  Catálogo Completo
                </Link>
              </li>
              <li>
                <Link to="/catalog" className="text-gray-700 hover:text-gray-900 transition-colors flex items-center gap-2 cursor-pointer">
                  <i className="ri-arrow-right-s-line"></i>
                  Categorias
                </Link>
              </li>
              <li>
                <Link to="/catalog" className="text-gray-700 hover:text-gray-900 transition-colors flex items-center gap-2 cursor-pointer">
                  <i className="ri-arrow-right-s-line"></i>
                  Mais Vendidos
                </Link>
              </li>
              <li>
                <Link to="/about" className="text-gray-700 hover:text-gray-900 transition-colors flex items-center gap-2 cursor-pointer">
                  <i className="ri-arrow-right-s-line"></i>
                  Sobre Nós
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-gray-700 hover:text-gray-900 transition-colors flex items-center gap-2 cursor-pointer">
                  <i className="ri-arrow-right-s-line"></i>
                  Contato
                </Link>
              </li>
            </ul>
          </div>

          {/* Contato */}
          <div>
            <h4 className="font-bold text-lg text-gray-900 mb-4">Contato</h4>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-white/40 backdrop-blur-sm rounded-xl flex items-center justify-center flex-shrink-0">
                  <i className="ri-mail-line text-lg text-gray-800"></i>
                </div>
                <div>
                  <p className="text-xs text-gray-600 mb-1">Email</p>
                  <a href="mailto:c-arminha1973@hotmail.com" className="text-gray-800 hover:text-gray-900 font-medium cursor-pointer">
                    c-arminha1973@hotmail.com
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-white/40 backdrop-blur-sm rounded-xl flex items-center justify-center flex-shrink-0">
                  <i className="ri-whatsapp-line text-lg text-gray-800"></i>
                </div>
                <div>
                  <p className="text-xs text-gray-600 mb-1">WhatsApp</p>
                  <a href="https://wa.me/352621190950" target="_blank" rel="noopener noreferrer" className="text-gray-800 hover:text-gray-900 font-medium cursor-pointer">
                    +352 621 190 950
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-white/40 backdrop-blur-sm rounded-xl flex items-center justify-center flex-shrink-0">
                  <i className="ri-facebook-fill text-lg text-gray-800"></i>
                </div>
                <div>
                  <p className="text-xs text-gray-600 mb-1">Facebook</p>
                  <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="text-gray-800 hover:text-gray-900 font-medium cursor-pointer">
                    Siga-nos
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Newsletter */}
          <div>
            <h4 className="font-bold text-lg text-gray-900 mb-4">Newsletter</h4>
            <p className="text-gray-700 mb-4 text-sm">
              Receba novidades, lançamentos e ofertas exclusivas.
            </p>
            <form onSubmit={handleNewsletterSubmit} className="space-y-3">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Seu melhor email"
                required
                className="w-full px-4 py-3 bg-white/60 backdrop-blur-sm border border-white/40 rounded-xl focus:outline-none focus:ring-2 focus:ring-white/60 text-gray-800 placeholder-gray-600"
              />
              <button
                type="submit"
                disabled={loading}
                className="w-full px-6 py-3 bg-gray-800 text-white rounded-xl hover:bg-gray-900 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer whitespace-nowrap"
              >
                {loading ? 'Inscrevendo...' : 'Inscrever-se'}
              </button>
            </form>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-white/30 flex justify-center items-center">
          <p className="text-gray-700 text-sm">
            © 2024 Livraria Digital. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
}
