/**
 * Marcador para produto sem foto.
 *
 * O código anterior apontava para `via.placeholder.com`. Isso põe a vitrine na
 * dependência de um serviço de terceiro para mostrar o que ela não tem: sem
 * internet, ou com aquele serviço fora do ar, a tela inteira fica de imagem
 * quebrada. Um desenho local sempre aparece, e não conta para ninguém de fora
 * quais produtos foram vistos.
 */
function SemImagem({ className }) {
    return (
        <svg
            className={className}
            viewBox="0 0 300 300"
            role="img"
            aria-label="Foto ainda não cadastrada"
        >
            <rect width="300" height="300" fill="#eceaf1" />
            {/* Silhueta simples de calçado, para a lacuna não parecer defeito. */}
            <path
                d="M60 175h72l38 26c9 6 20 9 31 9h29a10 10 0 0 1 0 20H78a18 18 0 0 1-18-18z"
                fill="#c9c4d4"
            />
            <path d="M60 175v-14a6 6 0 0 1 12 0v14z" fill="#b3adc2" />
            <text
                x="150"
                y="252"
                textAnchor="middle"
                fontFamily="system-ui, sans-serif"
                fontSize="17"
                fill="#7d768f"
            >
                Foto em breve
            </text>
        </svg>
    );
}

export default SemImagem;
