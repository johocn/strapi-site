import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  server: {
    port: 5174,
    proxy: {
      // 请求 /admin-api/* 会被代理到 http://localhost:3000/admin-api/*
      '/admin-api': { target: 'http://localhost:3000', changeOrigin: true },
    },
  },
});
