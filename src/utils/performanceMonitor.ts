/**
 * Monitor de Performance
 * Rastreia métricas de performance e otimiza carregamento
 */

interface PerformanceMetrics {
  pageLoadTime: number;
  firstContentfulPaint: number;
  largestContentfulPaint: number;
  timeToInteractive: number;
  totalBlockingTime: number;
}

class PerformanceMonitor {
  private metrics: Partial<PerformanceMetrics> = {};

  /**
   * Inicia monitoramento de performance
   */
  start(): void {
    if (typeof window === 'undefined') return;

    // Observa métricas de performance
    this.observePerformance();
    
    // Monitora carregamento da página
    this.monitorPageLoad();
  }

  /**
   * Observa métricas de performance
   */
  private observePerformance(): void {
    if ('PerformanceObserver' in window) {
      // First Contentful Paint
      const fcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          if (entry.name === 'first-contentful-paint') {
            this.metrics.firstContentfulPaint = entry.startTime;
            console.log(`✅ FCP: ${entry.startTime.toFixed(2)}ms`);
          }
        });
      });
      fcpObserver.observe({ entryTypes: ['paint'] });

      // Largest Contentful Paint
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        this.metrics.largestContentfulPaint = lastEntry.startTime;
        console.log(`✅ LCP: ${lastEntry.startTime.toFixed(2)}ms`);
      });
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
    }
  }

  /**
   * Monitora carregamento da página
   */
  private monitorPageLoad(): void {
    window.addEventListener('load', () => {
      const perfData = performance.timing;
      const pageLoadTime = perfData.loadEventEnd - perfData.navigationStart;
      this.metrics.pageLoadTime = pageLoadTime;
      
      console.log(`✅ Página carregada em: ${pageLoadTime}ms`);
      
      // Envia métricas para analytics (opcional)
      this.sendMetrics();
    });
  }

  /**
   * Envia métricas para analytics
   */
  private sendMetrics(): void {
    // Aqui você pode enviar para Google Analytics, Sentry, etc.
    console.log('📊 Métricas de Performance:', this.metrics);
  }

  /**
   * Obtém métricas atuais
   */
  getMetrics(): Partial<PerformanceMetrics> {
    return { ...this.metrics };
  }

  /**
   * Marca início de uma operação
   */
  mark(name: string): void {
    performance.mark(name);
  }

  /**
   * Mede tempo entre duas marcas
   */
  measure(name: string, startMark: string, endMark: string): number {
    performance.measure(name, startMark, endMark);
    const measure = performance.getEntriesByName(name)[0];
    return measure.duration;
  }

  /**
   * Limpa marcas e medidas
   */
  clear(): void {
    performance.clearMarks();
    performance.clearMeasures();
  }
}

// Singleton
export const performanceMonitor = new PerformanceMonitor();

/**
 * Hook para medir performance de componentes
 */
export function measureComponentRender(componentName: string) {
  const startMark = `${componentName}-start`;
  const endMark = `${componentName}-end`;
  
  performanceMonitor.mark(startMark);
  
  return () => {
    performanceMonitor.mark(endMark);
    const duration = performanceMonitor.measure(
      `${componentName}-render`,
      startMark,
      endMark
    );
    console.log(`⚡ ${componentName} renderizado em ${duration.toFixed(2)}ms`);
  };
}
