import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        environment: 'node',
        include: ['tests/**/*.test.js'],

        // describe, it, expect, beforeAll e afterAll ficam globais. Sem isso, cada
        // arquivo de teste precisaria importar a API do vitest com 'import', e o
        // backend é CommonJS. Com globals, os testes ficam CommonJS puro e o require
        // do app pode acontecer dentro do beforeAll, depois de DB_PATH ser definido.
        globals: true,

        // Um processo por arquivo de teste, com registro de módulos próprio. Cada
        // arquivo cria o seu banco temporário, e src/config/db.js lê DB_PATH uma vez
        // por processo. Sem isolamento, dois arquivos compartilhariam a mesma conexão.
        pool: 'forks',
        isolate: true
    }
});
