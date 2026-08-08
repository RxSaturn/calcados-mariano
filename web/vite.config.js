import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],

  server: {
    // Em desenvolvimento, o Vite encaminha as chamadas da API para o backend na porta
    // 3000. Assim o navegador fala só com a origem do Vite, e o CORS não entra no
    // caminho. Em produção, aponte VITE_API_URL para a URL real da API.
    proxy: {
      '/produtos': 'http://localhost:3000',
      '/health': 'http://localhost:3000',
      // A sessão do painel vive num cookie que a API escreve. Sem o proxy, o
      // navegador trataria a chamada como outra origem e não mandaria o cookie.
      '/auth': 'http://localhost:3000'
    }
  }
});
