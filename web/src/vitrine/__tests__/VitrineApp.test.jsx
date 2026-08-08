import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import VitrineApp from '../VitrineApp';
import * as api from '../../api/produtos';
import { WHATSAPP } from '../../config';

vi.mock('../../api/produtos');

const PRODUTOS = [
    {
        id: 1,
        nome: 'Chuteira Nike Beco 2',
        categoria: 'Chuteira',
        publico: 'Masculino',
        marca: 'Nike',
        cor: 'Preta',
        numeracao: '41',
        quantidade: 2,
        descricao: 'Society, solado de borracha.',
        imagem_url: null
    },
    {
        id: 2,
        nome: 'Sandália Rasteira',
        categoria: 'Sandália',
        publico: 'Feminino',
        marca: 'Mariano',
        cor: 'Caramelo',
        numeracao: '37',
        quantidade: 0,
        descricao: null,
        imagem_url: 'https://exemplo.test/sandalia.jpg'
    }
];

/** A API devolve envelope, e não array. É justamente aqui que a tela quebrava. */
const envelope = (produtos) => ({
    produtos,
    total: produtos.length,
    pagina: 1,
    limite: 50,
    paginas: 1
});

beforeEach(() => {
    vi.resetAllMocks();
    api.listarProdutos.mockResolvedValue(envelope(PRODUTOS));
    api.listarOpcoesDeFiltro.mockResolvedValue({
        categorias: ['Chuteira', 'Sandália'],
        publicos: ['Masculino', 'Feminino']
    });
    api.buscarProdutos.mockResolvedValue([PRODUTOS[0]]);
});

describe('vitrine', () => {
    it('lê o envelope da API e mostra um card por produto', async () => {
        render(<VitrineApp />);

        expect(await screen.findByText('Chuteira Nike Beco 2')).toBeInTheDocument();
        expect(screen.getByText('Sandália Rasteira')).toBeInTheDocument();
    });

    it('não trata a resposta como array cru', async () => {
        // O código antigo fazia `Array.isArray(dados)` e, com o envelope,
        // caía no ramo vazio: a vitrine ficava sem nenhum produto enquanto a
        // API respondia 200. O sintoma era loja vazia, e não erro na tela.
        api.listarProdutos.mockResolvedValue(envelope([]));
        render(<VitrineApp />);

        expect(await screen.findByText(/Nenhum calçado encontrado/i)).toBeInTheDocument();
    });

    it('filtra por público chamando a API, e não no navegador', async () => {
        render(<VitrineApp />);
        await screen.findByText('Chuteira Nike Beco 2');

        await userEvent.click(screen.getByRole('button', { name: 'Feminino' }));

        await waitFor(() =>
            expect(api.listarProdutos).toHaveBeenCalledWith(
                expect.objectContaining({ publico: 'Feminino' })
            )
        );
    });

    it('monta o filtro com os públicos que existem no banco', async () => {
        render(<VitrineApp />);

        expect(await screen.findByRole('button', { name: 'Masculino' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Feminino' })).toBeInTheDocument();
        // "Infantil" existe na lista de valores aceitos, mas não neste banco.
        expect(screen.queryByRole('button', { name: 'Infantil' })).not.toBeInTheDocument();
    });

    it('busca pelo termo digitado usando a rota de busca', async () => {
        render(<VitrineApp />);
        await screen.findByText('Chuteira Nike Beco 2');

        await userEvent.type(screen.getByRole('searchbox'), 'chuteira');
        await userEvent.click(screen.getByRole('button', { name: 'Buscar' }));

        await waitFor(() => expect(api.buscarProdutos).toHaveBeenCalledWith('nome', 'chuteira'));
    });

    it('ordena chamando a API com o valor que ela aceita', async () => {
        render(<VitrineApp />);
        await screen.findByText('Chuteira Nike Beco 2');

        await userEvent.selectOptions(screen.getByRole('combobox'), 'quantidade');

        await waitFor(() =>
            expect(api.listarProdutos).toHaveBeenCalledWith(
                expect.objectContaining({ ordenar: 'quantidade' })
            )
        );
    });

    it('monta o link do WhatsApp com o número da configuração', async () => {
        render(<VitrineApp />);
        await userEvent.click(await screen.findByText('Chuteira Nike Beco 2'));

        const link = screen.getByRole('link', { name: /Consultar no WhatsApp/i });
        expect(link).toHaveAttribute('href', expect.stringContaining(`wa.me/${WHATSAPP}`));
        // A mensagem leva o que a loja precisa para responder sem perguntar de novo.
        expect(link.getAttribute('href')).toContain(encodeURIComponent('Chuteira Nike Beco 2'));
        expect(link.getAttribute('href')).toContain(encodeURIComponent('Ref: 1'));
    });

    it('mostra o marcador local quando o produto não tem foto', async () => {
        render(<VitrineApp />);
        await screen.findByText('Chuteira Nike Beco 2');

        // O produto 1 não tem imagem: precisa cair no desenho local, e nunca
        // num serviço de fora.
        expect(screen.getAllByRole('img', { name: /Foto ainda não cadastrada/i }).length).toBe(1);
        expect(document.body.innerHTML).not.toContain('via.placeholder.com');
    });

    it('avisa quando a API falha, em vez de fingir loja vazia', async () => {
        api.listarProdutos.mockRejectedValue(new Error('rede fora'));
        render(<VitrineApp />);

        expect(await screen.findByText(/Não foi possível carregar os produtos/i)).toBeInTheDocument();
    });

    it('não promete compra segura, SSL nem proteção de dados', async () => {
        render(<VitrineApp />);
        await screen.findByText('Chuteira Nike Beco 2');

        // A vitrine não vende, não cobra e não coleta dado. Dizer o contrário
        // é enganar quem vai até a loja contando com isso.
        const texto = document.body.textContent;
        expect(texto).not.toMatch(/100% Segura/i);
        expect(texto).not.toMatch(/SSL/i);
        expect(texto).not.toMatch(/dados protegidos/i);
    });

    it('marca o produto sem estoque como esgotado', async () => {
        render(<VitrineApp />);
        await userEvent.click(await screen.findByText('Sandália Rasteira'));

        expect(screen.getByText(/Produto esgotado/i)).toBeInTheDocument();
    });
});
