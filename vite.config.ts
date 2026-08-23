import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig(({ mode }) => {
    return {
        base: mode === 'development' ? '/' : '/',
        plugins: [react(), tailwindcss()],
        resolve: {
            alias: {
                '@': path.resolve(__dirname, '.'),
            },
        },
        server: {
            port: 5000,
            host: '0.0.0.0',
            strictPort: true,
            proxy: {
                '/api': {
                    target: 'http://localhost:3001',
                    changeOrigin: true,
                }
            }
        },
    };
});