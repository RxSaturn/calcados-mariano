import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

// Desmonta o que cada teste renderizou, para um teste não ver a tela do outro.
afterEach(cleanup);
