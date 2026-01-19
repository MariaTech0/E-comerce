import { Suspense, useEffect } from 'react';
import { BrowserRouter, useLocation } from 'react-router-dom';
import { AppRoutes } from './router';
import Navbar from './components/feature/Navbar';
import Footer from './components/feature/Footer';
import Cart from './components/feature/Cart';

// Componente de Loading otimizado
function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#4ECDC4]/10 to-[#FF6B6B]/10">
      <div className="text-center">
        <div className="relative w-20 h-20 mx-auto mb-6">
          <div className="absolute inset-0 border-4 border-[#4ECDC4]/30 rounded-full"></div>
          <div className="absolute inset-0 border-4 border-[#FF6B6B] border-t-transparent rounded-full animate-spin"></div>
        </div>
        <p className="text-gray-600 font-medium">Carregando...</p>
      </div>
    </div>
  );
}

function AppContent() {
  const location = useLocation();
  const isDashboard = location.pathname.startsWith('/dashboard');

  // Scroll suave para o topo ao mudar de página
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [location.pathname]);

  // Preload de imagens críticas
  useEffect(() => {
    const preloadImages = [
      'https://readdy.ai/api/search-image?query=vibrant%20colorful%20open%20book%20pages%20floating%20in%20bright%20dreamy%20sky%20with%20vivid%20turquoise%20coral%20pink%20and%20golden%20tones%2C%20magical%20literary%20aesthetic%2C%20dynamic%20composition%20with%20light%20rays%20and%20sparkles%2C%20joyful%20reading%20atmosphere%2C%20professional%20photography%20with%20rich%20saturated%20colors&width=1920&height=1080&seq=hero-vibrant-new&orientation=landscape'
    ];

    preloadImages.forEach(src => {
      const img = new Image();
      img.src = src;
    });
  }, []);

  return (
    <Suspense fallback={<LoadingScreen />}>
      {!isDashboard && <Navbar />}
      <AppRoutes />
      {!isDashboard && <Footer />}
      {!isDashboard && <Cart />}
    </Suspense>
  );
}

function App() {
  return (
    <BrowserRouter basename={__BASE_PATH__}>
      <AppContent />
    </BrowserRouter>
  );
}

export default App;
