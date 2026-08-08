import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/__tests__/setup.js'],
    include: ['src/**/*.test.{js,jsx}'],

    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      include: ['src/**/*.{js,jsx}'],

      // main.jsx só monta a raiz do React, e config.js só exporta constantes. Medir
      // os dois inflaria o número sem dizer nada sobre o que está testado.
      exclude: ['src/main.jsx', 'src/config.js', 'src/__tests__/**'],

      // Mesma regra do vitest.config.mjs da raiz: medir, arredondar para baixo até o
      // múltiplo de 5, e limitar em 95. Medição de 08/2026: 96.99 linhas, 96.71
      // comandos, 100 funções, 91.07 ramos.
      thresholds: {
        lines: 95,
        statements: 95,
        functions: 95,
        branches: 90
      }
    }
  }
});
