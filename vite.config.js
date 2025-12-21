import { defineConfig } from 'vite';

export default defineConfig({
    // Directorio raíz del proyecto
    root: './',

    // Puerto de desarrollo
    server: {
        port: 3000,
        open: true // Abre navegador automáticamente
    },

    // Configuración de build
    build: {
        // Directorio de salida
        outDir: 'dist',

        // Vaciar directorio antes de build
        emptyOutDir: true,

        // Opciones de Rollup
        rollupOptions: {
            input: {
                main: './index.html'
            }
        },

        // Minificación con esbuild (incluido por defecto)
        minify: 'esbuild',

        // Source maps para debugging
        sourcemap: true
    },

    // Resolución de módulos
    resolve: {
        alias: {
            '@': '/src',
            '@modules': '/src/modules',
            '@utils': '/src/utils'
        }
    },

    // Excluir node_modules de optimización
    optimizeDeps: {
        exclude: ['jest', 'jest-environment-jsdom']
    }
});
