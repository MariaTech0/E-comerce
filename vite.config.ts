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
});
