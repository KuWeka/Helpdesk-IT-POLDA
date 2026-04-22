import path from 'node:path';
import react from '@vitejs/plugin-react';
import { createLogger, defineConfig } from 'vite';
import { readFileSync } from 'node:fs';

const pkg = JSON.parse(readFileSync('./package.json', 'utf-8'));
const allDeps = Object.keys(pkg.dependencies || {});

const logger = createLogger();
const loggerError = logger.error;

logger.error = (msg, options) => {
  if (options?.error?.toString().includes('CssSyntaxError: [postcss]')) {
    return;
  }

  loggerError(msg, options);
};

export default defineConfig({
  optimizeDeps: {
    include: allDeps,
  },
  customLogger: logger,
  plugins: [react()],
  server: {
    port: 3000,
    cors: true,
    headers: {
      'Cross-Origin-Embedder-Policy': 'credentialless',
    },
    allowedHosts: true,
  },
  resolve: {
    extensions: ['.jsx', '.js', '.tsx', '.ts', '.json'],
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    rollupOptions: {
      external: [
        '@babel/parser',
        '@babel/traverse',
        '@babel/generator',
        '@babel/types',
      ],
    },
  },
});
