import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
export default defineConfig({
    plugins: [react()],
    build: {
        outDir: '../dist-client',
        emptyOutDir: true,
    },
    server: {
        proxy: {
            '/api': 'http://localhost:8086',
            '/interaction': 'http://localhost:8086',
        }
    }
});
//# sourceMappingURL=vite.config.js.map