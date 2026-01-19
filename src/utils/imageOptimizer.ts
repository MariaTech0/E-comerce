/**
 * Otimizador de Imagens
 * Gerencia carregamento lazy, cache e fallbacks
 */

// Cache de imagens carregadas
const imageCache = new Map<string, boolean>();

/**
 * Preload de imagem crítica
 */
export function preloadImage(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (imageCache.has(src)) {
      resolve();
      return;
    }

    const img = new Image();
    img.onload = () => {
      imageCache.set(src, true);
      resolve();
    };
    img.onerror = reject;
    img.src = src;
  });
}

/**
 * Preload de múltiplas imagens
 */
export async function preloadImages(urls: string[]): Promise<void> {
  await Promise.all(urls.map(url => preloadImage(url)));
}

/**
 * Lazy loading observer
 */
export function createLazyLoadObserver(
  callback: (entry: IntersectionObserverEntry) => void
): IntersectionObserver {
  return new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          callback(entry);
        }
      });
    },
    {
      rootMargin: '50px', // Carrega 50px antes de entrar na viewport
      threshold: 0.01
    }
  );
}

/**
 * Gera URL de imagem otimizada
 */
export function getOptimizedImageUrl(
  url: string,
  width?: number,
  height?: number
): string {
  if (!url) return '';
  
  // Se for URL do Readdy.ai, adiciona parâmetros de otimização
  if (url.includes('readdy.ai/api/search-image')) {
    const urlObj = new URL(url);
    if (width) urlObj.searchParams.set('width', width.toString());
    if (height) urlObj.searchParams.set('height', height.toString());
    return urlObj.toString();
  }
  
  return url;
}

/**
 * Fallback de imagem
 */
export function getImageWithFallback(
  primaryUrl: string,
  fallbackUrl: string,
  onError?: () => void
): string {
  if (imageCache.has(primaryUrl)) {
    return primaryUrl;
  }
  
  // Tenta carregar imagem primária
  const img = new Image();
  img.onload = () => imageCache.set(primaryUrl, true);
  img.onerror = () => {
    if (onError) onError();
  };
  img.src = primaryUrl;
  
  return primaryUrl;
}

/**
 * Limpa cache de imagens antigas
 */
export function clearImageCache(): void {
  imageCache.clear();
}

/**
 * Verifica se imagem está em cache
 */
export function isImageCached(url: string): boolean {
  return imageCache.has(url);
}
