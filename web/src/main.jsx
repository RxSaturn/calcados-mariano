import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Route, Routes } from 'react-router-dom';

import './index.css';
import VitrineApp from './vitrine/VitrineApp.jsx';
import Painel from './painel/Painel.jsx';

/*
 * Duas telas, um app.
 *
 * `/` é a vitrine, aberta a quem vier da rua, e `/admin` é o painel de quem
 * cuida do estoque. São dois públicos com necessidades opostas — um quer ver
 * o calçado, o outro quer contar o que tem — e por isso são telas separadas.
 *
 * O que elas dividem é o que não faz sentido duplicar: o cliente da API, a
 * configuração da loja e o build. Uma equipe de três pessoas não mantém dois
 * projetos npm em dia, e a segunda cópia sempre é a que fica velha.
 *
 * A rota `/admin` não é segredo, e não é ela que protege o painel: quem
 * protege é a exigência de sessão nas rotas de escrita da API. Esconder o
 * endereço só enganaria quem confia nele.
 */
createRoot(document.getElementById('root')).render(
    <StrictMode>
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<VitrineApp />} />
                <Route path="/admin" element={<Painel />} />
                {/* Endereço desconhecido cai na vitrine, que é a porta da loja. */}
                <Route path="*" element={<VitrineApp />} />
            </Routes>
        </BrowserRouter>
    </StrictMode>
);
