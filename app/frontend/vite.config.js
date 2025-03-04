import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { visualizer } from 'rollup-plugin-visualizer'
import autoprefixer from 'autoprefixer'
import cssnano from 'cssnano'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig(({ command, mode }) => {
  // Load env variables from .env files
  const env = loadEnv(mode, process.cwd(), '')
  
  return {
    plugins: [
      react(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.ico', 'robots.txt', 'apple-touch-icon.png'],
        manifest: {
          name: 'CryptoV4 Trading Platform',
          short_name: 'CryptoV4',
          description: 'Advanced cryptocurrency trading platform',
          theme_color: '#1a1a2e',
          background_color: '#f5f5f5',
          icons: [
            {
              src: '/android-chrome-192x192.png',
              sizes: '192x192',
              type: 'image/png',
            },
            {
              src: '/android-chrome-512x512.png',
              sizes: '512x512',
              type: 'image/png',
            },
            {
              src: '/android-chrome-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable',
            },
          ],
        },
        workbox: {
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/api\.cryptov4\.com\/.*/i,
              handler: 'NetworkFirst',
              options: {
                cacheName: 'api-cache',
                expiration: {
                  maxEntries: 100,
                  maxAgeSeconds: 60 * 60 * 24, // 24 hours
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
            {
              urlPattern: /\.(?:png|jpg|jpeg|svg|gif)$/,
              handler: 'CacheFirst',
              options: {
                cacheName: 'images-cache',
                expiration: {
                  maxEntries: 50,
                  maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
                },
              },
            },
          ],
        },
      }),
      // Add bundle visualizer in analyze mode
      mode === 'analyze' && visualizer({
        open: true,
        filename: 'dist/stats.html',
        gzipSize: true,
        brotliSize: true,
      }),
    ],
    
    // Base public path when served in production
    base: '/',
    
    // Build configuration
    build: {
      outDir: 'dist',
      assetsDir: 'assets',
      // Generate source maps for production build
      sourcemap: mode !== 'production',
      // Minify options
      minify: mode === 'production',
      terserOptions: {
        compress: {
          drop_console: mode === 'production',
          drop_debugger: mode === 'production',
        },
      },
      // Chunk size warning limit
      chunkSizeWarningLimit: 1000,
      // Rollup options
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-router-dom', 'react-bootstrap', 'react-icons'],
            charts: ['recharts', 'chart.js'],
          },
        },
      },
    },
    
    // Server options
    server: {
      port: parseInt(env.VITE_PORT || 3000, 10),
      strictPort: true,
      host: true, // Listen on all addresses
      open: true, // Auto-open browser
      proxy: {
        // Proxy API requests to backend during development
        '/api': {
          target: env.VITE_API_URL || 'http://localhost:5000',
          changeOrigin: true,
          secure: false,
        },
      },
    },
    
    // Resolve options
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
        '@components': '/src/components',
        '@pages': '/src/pages',
        '@services': '/src/services',
        '@hooks': '/src/hooks',
        '@assets': '/src/assets',
      },
    },
    
    // esbuild configuration to support JSX in .js files
    esbuild: {
      loader: 'jsx',
      include: /src\/.*\.jsx?$/,
      exclude: [],
    },
    
    // CSS options
    css: {
      // Process CSS with PostCSS
      postcss: {
        plugins: [
          autoprefixer,
          cssnano({
            preset: ['default', {
              discardComments: {
                removeAll: true,
              },
            }],
          }),
        ],
      },
    },
    
    // Define global constants
    define: {
      // Make env variables available to the client
      ...Object.keys(env).reduce((acc, key) => {
        if (key.startsWith('VITE_')) {
          acc[`import.meta.env.${key}`] = JSON.stringify(env[key])
        }
        return acc
      }, {}),
    },
    
    preview: {
      port: 3000,
      strictPort: true,
    },
  }
})
