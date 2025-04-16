import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // Ensure .js files are treated as .jsx by esbuild
  esbuild: {
    loader: 'jsx',
    include: /src\/.*\.jsx?$/, // Include js and jsx files in src
    exclude: [],
  },
  optimizeDeps: {
      esbuildOptions: {
          loader: {
              '.js': 'jsx',
          },
      },
  },
  server: {
    port: 3000, // Run the frontend dev server on port 3000 (Vite might override this if port is busy)
    proxy: {
      // Proxy API requests to the backend server
      '/api': {
        target: 'http://localhost:5000', // Your backend server address
        changeOrigin: true,
        secure: false,
      },
    },
  },
})
