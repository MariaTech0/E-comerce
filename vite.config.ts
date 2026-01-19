<<<<<<< HEAD
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import { resolve } from "path"; // use 'path', não 'node:path'
import AutoImport from "unplugin-auto-import/vite";

/**
 * Configuração de deploy:
 * - GitHub Pages (repositório E-comerce): base = "/E-comerce/"
 * - Ambiente local / InfinityFree: base = "/"
 *
 * Antes do build, defina a variável de ambiente:
 * Windows CMD:
 *   set DEPLOY_TARGET=github
 *   set DEPLOY_TARGET=infinityfree
 * Linux/macOS:
 *   export DEPLOY_TARGET=github
 */
const deployTarget = process.env.DEPLOY_TARGET || "";
const base = deployTarget === "github" ? "/E-comerce/" : "/";

export default defineConfig({
  base, // ⚡ ESSENCIAL para GitHub Pages
  define: {
    __BASE_PATH__: JSON.stringify(base),
    __IS_PREVIEW__: JSON.stringify(false),
    __READDY_PROJECT_ID__: JSON.stringify(process.env.PROJECT_ID || ""),
    __READDY_VERSION_ID__: JSON.stringify(process.env.VERSION_ID || ""),
    __READDY_AI_DOMAIN__: JSON.stringify(process.env.READDY_AI_DOMAIN || "https://readdy.ai"),
  },
  plugins: [
    react(),
    AutoImport({
      imports: [
        {
          react: [
            "React",
            "useState",
            "useEffect",
            "useContext",
            "useReducer",
            "useCallback",
            "useMemo",
            "useRef",
            "useImperativeHandle",
            "useLayoutEffect",
            "useDebugValue",
            "useDeferredValue",
            "useId",
            "useInsertionEffect",
            "useSyncExternalStore",
            "useTransition",
            "startTransition",
            "lazy",
            "memo",
            "forwardRef",
            "createContext",
            "createElement",
            "cloneElement",
            "isValidElement",
          ],
        },
        {
          "react-router-dom": [
            "useNavigate",
            "useLocation",
            "useParams",
            "useSearchParams",
            "Link",
            "NavLink",
            "Navigate",
            "Outlet",
          ],
        },
        {
          "react-i18next": ["useTranslation", "Trans"],
        },
      ],
      dts: true,
    }),
  ],
  resolve: {
    alias: {
      "@": resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 3000,
    host: true, // "0.0.0.0" funciona, mas true é mais padrão Vite
  },
  build: {
    sourcemap: false, // true para debug, false para produção
    outDir: "out",     // ⚡ Pasta de saída do build
    emptyOutDir: true, // Limpa antes de gerar
    minify: "terser",
    rollupOptions: {
      output: {
        entryFileNames: "assets/[name]-[hash].js",
        chunkFileNames: "assets/[name]-[hash].js",
        assetFileNames: "assets/[name]-[hash].[ext]",
      },
    },
    cssCodeSplit: true,
    assetsInlineLimit: 4096,
  },
=======
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  
  // Detectar ambiente de deploy
  const deployTarget = process.env.DEPLOY_TARGET || 'local';
  const isGitHub = deployTarget === 'github';
  const isInfinityFree = deployTarget === 'infinityfree';
  const isProd = mode === 'production';

  // Base path dinâmico por ambiente
  // InfinityFree: raiz '/'
  // GitHub Pages: '/E-comerce/' (se o repositório for github.com/usuario/E-comerce)
  // Local: raiz '/'
  const base = isGitHub ? '/E-comerce/' : '/';

  console.log('🚀 Vite Config:');
  console.log(`   Mode: ${mode}`);
  console.log(`   Deploy Target: ${deployTarget}`);
  console.log(`   Base Path: ${base}`);
  console.log(`   Production: ${isProd}`);

  return {
    plugins: [react()],
    base, // base path dinâmico

    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },

    define: {
      __BASE_PATH__: JSON.stringify(base),
      __PROJECT_ID__: JSON.stringify(env.VITE_PROJECT_ID || ''),
      __VERSION_ID__: JSON.stringify(env.VITE_VERSION_ID || ''),
      __READDY_AI_DOMAIN__: JSON.stringify(env.VITE_READDY_AI_DOMAIN || 'https://readdy.ai'),
      __DEPLOY_TARGET__: JSON.stringify(deployTarget),
      __IS_PRODUCTION__: JSON.stringify(isProd),
    },

    server: {
      port: 3000,
      host: true,
      open: true,
      strictPort: false,
    },

    preview: {
      port: 4173,
      host: true,
      strictPort: false,
    },

    build: {
      outDir: 'dist',
      emptyOutDir: true,
      sourcemap: !isProd,
      minify: isProd ? 'terser' : false,
      terserOptions: isProd
        ? {
            compress: {
              drop_console: true,
              drop_debugger: true,
              pure_funcs: ['console.log', 'console.info', 'console.debug'],
            },
            format: {
              comments: false,
            },
          }
        : undefined,
      rollupOptions: {
        output: {
          manualChunks: {
            'react-vendor': ['react', 'react-dom', 'react-router-dom'],
            'supabase-vendor': ['@supabase/supabase-js'],
          },
          assetFileNames: 'assets/[name]-[hash].[ext]',
          chunkFileNames: 'assets/[name]-[hash].js',
          entryFileNames: 'assets/[name]-[hash].js',
        },
      },
      chunkSizeWarningLimit: 500,
      cssCodeSplit: true,
      assetsInlineLimit: 4096,
      reportCompressedSize: true,
    },

    optimizeDeps: {
      include: ['react', 'react-dom', 'react-router-dom', '@supabase/supabase-js'],
    },
  };
>>>>>>> d06c7e68bc4afcc6930a517987f13201504d64c0
});
