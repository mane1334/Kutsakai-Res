# Design do sistema

Este documento descreve a linguagem visual e a organização dos principais clientes do Interactive Restaurantes.

## Arquitetura visual

O produto é dividido em três superfícies:

- `client-web`: menu digital para o cliente, carrinho, pedido, chamada de funcionário e chat.
- `client-app/ClientApp`: versão React Native para tablets/kiosks, com bloqueio de ecrã, anúncios, temas e configuração de servidor.
- `admin-panel`: painel operacional para restaurantes e superadmins.

O backend não renderiza a interface. Ele fornece dados, imagens, autenticação, eventos em tempo real e respostas de IA através de HTTP, WebSocket e Server-Sent Events.

## Identidade do Admin Panel

O painel administrativo usa uma estética operacional, densa e fácil de consultar durante o serviço do restaurante.

### Paleta

| Token | Valor | Uso |
|---|---|---|
| Vinho principal | `#6d2430` | Ações primárias, foco e marca |
| Sidebar | `#571923` | Navegação lateral e header |
| Vinho profundo | `#4c121a` | Bordas e separação da navegação |
| Fundo geral | `#fff7ed` | Área principal |
| Fundo de card | `#ffffff` | Cards e formulários |
| Fundo suave | `#fff1f2` | Painéis de apoio e hover |
| Texto principal | `#1f1115` | Títulos e conteúdo |
| Texto secundário | `#5f323b` | Labels e descrições |
| Texto auxiliar | `#7a4a54` | Kicker e ajuda contextual |
| Borda | `#e7c8c2` | Cards e inputs |
| Perigo | `#ba1a1a` | Exclusões e ações destrutivas |

### Componentes e layout

- Fonte: `Inter`, com fallback para fontes do sistema.
- Sidebar fixa em desktop e sobreposta em ecrãs pequenos.
- Header superior com identidade vinho.
- Conteúdo central com largura máxima aproximada de `1440px`.
- Cards brancos, borda fina, raio discreto de `0.5rem` e sombras leves.
- Botões primários vinho, secundários brancos com borda e perigosos vermelhos.
- Ícones preferencialmente de linha, usando `react-icons/fi` no painel.
- O layout responsivo empilha cards e permite que as ações quebrem linha em dispositivos pequenos.

As classes globais estão em `admin-panel/src/index.css`, incluindo `admin-card`, `admin-page`, `admin-page-title`, `admin-input`, `admin-primary-btn`, `admin-secondary-btn` e `admin-danger-btn`.

## Design do cliente web

O `client-web` usa Tailwind CSS e uma base clara, com vermelho/vinho como cor de ação. A interface é orientada ao menu:

1. cabeçalho e identidade do restaurante;
2. anúncios e destaques;
3. categorias e lista de pratos;
4. detalhe do prato;
5. carrinho e pedido atual;
6. ações auxiliares, como chamar funcionário e abrir o chat.

Existem estados para tema escuro (`.theme-dark`), tema de marca (`.theme-brand`), skeleton loading, fade-in, slide-up e tratamento de imagens indisponíveis. A configuração de tema e restaurante pode vir das definições recebidas do backend.

## Design do cliente React Native

O `client-app` suporta os temas `dark`, `light`, `ocean`, `sunset`, `forest` e `luxury`. Cada tema define fundo, superfície, primária, texto, bordas, estados, overlay e gradiente do cabeçalho.

Além do menu e do carrinho, a experiência mobile inclui:

- modo kiosk com bloqueio por inatividade;
- ecrã de proteção com anúncios;
- modal de definições para IP, mesa, restaurante, tema e idioma;
- português e inglês;
- feedback por toasts, modais e barra de estado do pedido.

## Regras de consistência

- Manter contraste suficiente entre texto e fundo.
- Usar a cor primária para ações, não para decoração excessiva.
- Não introduzir gradientes ou sombras fortes no Admin Panel sem necessidade funcional.
- Manter estados visuais claros para carregamento, sucesso, erro, aviso e pedido cancelado.
- Novos componentes devem reutilizar os tokens/classes existentes da superfície onde forem adicionados.

