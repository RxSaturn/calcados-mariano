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
        isolate: true,

        coverage: {
            provider: 'v8',
            reporter: ['text', 'lcov'],
            include: ['src/**/*.js'],

            // O piso vem da medição real, e não de um número escolhido no ar.
            //
            // A regra: medir, arredondar para baixo até o múltiplo de 5, e limitar em
            // 95. Ela é grosseira de propósito. Um piso colado na medição falha a cada
            // ponto de oscilação e vira ruído. Um piso de 100 transforma toda função
            // nova em falha de CI antes de o teste dela entrar, o que empurra o teste
            // para depois em vez de ajudar. Um degrau de 5 pontos ainda pega uma queda
            // de verdade.
            //
            // Medição de 08/2026: 96.56 linhas, 95.06 comandos, 95.72 funções,
            // 85.89 ramos.
            //
            // Para subir o piso, escreva o teste, rode npm run test:coverage e ajuste.
            // Nunca baixe o piso para fazer a CI passar: ele existe justamente para
            // avisar que a cobertura caiu.
            thresholds: {
                lines: 95,
                statements: 95,
                functions: 95,
                branches: 85
            }
        }
    }
});
