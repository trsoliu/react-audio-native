import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'

export default defineConfig({
  build: {
    lib: {
      cssFileName: 'style',
      entry: 'src/index.ts',
      fileName: (format) => (format === 'es' ? 'index.js' : 'index.cjs'),
      formats: ['es', 'cjs'],
    },
    rollupOptions: {
      external: [
        '@trsoliu/audio-core',
        'lucide-react',
        'react',
        'react-dom',
        'react/jsx-runtime',
      ],
      output: {
        exports: 'named',
      },
    },
    sourcemap: true,
    target: 'es2019',
  },
  plugins: [
    react(),
    tailwindcss(),
    dts({
      bundleTypes: true,
      include: ['src'],
    }),
  ],
})
