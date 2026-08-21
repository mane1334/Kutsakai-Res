# Identidade Visual do Admin Panel

## Direcao visual

O Admin Panel usa uma estetica operacional moderna, limpa e densa, pensada para uso diario em restaurante. A interface deve parecer profissional, rapida de escanear e confiavel, sem cara de landing page.

A base visual atual combina a paleta antiga vinho/rose com uma composicao mais nova: cards limpos, cantos discretos, tipografia forte, bastante alinhamento e hierarquia clara.

## Paleta principal

### Cores de marca

- Vinho principal: `#6d2430`
- Vinho escuro da sidebar: `#571923`
- Vinho profundo: `#4c121a`
- Texto principal: `#1f1115`
- Texto secundario: `#5f323b`
- Texto auxiliar: `#7a4a54`

### Fundos

- Fundo geral: `#fff7ed`
- Fundo de cards: `#ffffff`
- Fundo suave/realce: `#fff1f2`
- Fundo ativo da sidebar: `#ffffff`

### Bordas

- Borda padrao: `#e7c8c2`
- Borda hover/realce: `#b97c83`

### Estados

- Acao primaria: `#6d2430`
- Erro/perigo: `#ba1a1a`
- Badge/alerta vermelho: `#ef4444`
- Destaque claro: `#ffe4e6`

## Tipografia

Fonte principal:

```css
Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif
```

Regras:

- Titulos de pagina devem ser fortes, com peso `800`.
- Textos de apoio devem ser menores, com cor secundaria.
- Labels devem usar caixa alta apenas em indicadores curtos, como `ADMIN PANEL`, `FATURAMENTO HOJE` e `TICKET MEDIO`.
- Evitar letras muito espacadas; usar tracking leve apenas em pequenos kickers.

## Layout

### Estrutura

- Sidebar fixa a esquerda em telas grandes.
- Header superior fixo com fundo levemente translucido.
- Conteudo central limitado por largura maxima de `1440px`.
- Paginas com padding consistente: `px-5 py-6`, aumentando em telas maiores.

### Alinhamento

- Cards sempre alinhados em grid.
- Titulo, subtitulo e acoes do topo devem ficar na mesma faixa visual.
- Nao usar textos soltos sem margem ou hierarquia.
- Evitar componentes encostados nas bordas da tela.

## Sidebar

A sidebar preserva a identidade antiga do produto.

Base:

- Fundo: `#571923`
- Texto: branco ou rose muito claro
- Item ativo: fundo branco com texto vinho
- Hover: branco com baixa opacidade

Classes atuais:

```css
.admin-sidebar
.admin-sidebar-header
.admin-sidebar-link
.admin-sidebar-link-active
```

Regras:

- A sidebar deve continuar escura.
- O texto precisa ter contraste alto.
- O item ativo deve ser muito claro para facilitar localizacao.
- Icones devem ser pequenos e consistentes.

## Cards

Classe base:

```css
.admin-card
```

Estilo:

- Fundo branco.
- Borda `#e7c8c2`.
- Raio de borda `0.5rem`.
- Sem sombras pesadas por padrao.

Uso:

- Cards devem representar informacoes reais: metricas, listas, paineis de formulario ou blocos operacionais.
- Nao colocar cards dentro de cards.
- Nao transformar secoes inteiras em cards se elas forem apenas grupos de layout.

## Botoes

### Primario

Classe:

```css
.admin-primary-btn
```

Uso:

- Acoes principais da tela.
- Confirmacoes.
- Envio de formularios.

Cor:

- Fundo `#6d2430`
- Texto branco

### Secundario

Classe:

```css
.admin-secondary-btn
```

Uso:

- Filtros.
- Acoes neutras.
- Botoes de navegacao contextual.

### Perigo

Classe:

```css
.admin-danger-btn
```

Uso:

- Excluir.
- Cancelar pedido.
- Acoes irreversiveis.

## Formularios

Classe base:

```css
.admin-input
```

Regras:

- Inputs devem ocupar a largura disponivel.
- Labels devem ficar acima dos campos.
- Foco deve usar borda vinho e ring suave.
- Mensagens de erro devem ficar proximas ao campo afetado.

## Textos padrao

### Titulo de pagina

Classe:

```css
.admin-page-title
```

Uso:

- Nome principal da tela.
- Exemplo: `Dashboard operacional`, `Gestao de Pedidos Atuais`, `Gerenciamento de Cardapio`.

### Texto auxiliar

Classe:

```css
.admin-page-copy
```

Uso:

- Explicar brevemente o estado ou objetivo da pagina.
- Deve ser curto e operacional.

### Kicker

Classe:

```css
.admin-kicker
```

Uso:

- Marcadores pequenos acima do titulo.
- Exemplo: `ADMIN PANEL`, `CONFIGURACOES`, `RELATORIOS`.

## Iconografia

Usar preferencialmente `react-icons/fi`, mantendo o mesmo estilo de linha.

Regras:

- Icones em botoes devem ser pequenos: `h-4 w-4` ou `h-5 w-5`.
- Evitar misturar muitos estilos de icones.
- Icones devem reforcar a acao, nao decorar sem funcao.

## Responsividade

Em telas pequenas:

- Header deve manter titulo truncado se necessario.
- Sidebar deve virar menu sobreposto.
- Cards devem empilhar em uma coluna.
- Botoes de acoes devem quebrar linha sem sobrepor texto.

## Regras de consistencia

- Manter a paleta vinho/rose como identidade principal.
- Nao voltar para azul/verde como cor primaria do Admin Panel.
- Evitar gradientes decorativos.
- Evitar cards com cantos muito arredondados.
- Evitar sombras fortes em excesso.
- Preservar densidade de informacao para uso operacional.
- Todo texto deve estar alinhado e com contraste suficiente.
- Toda pagina deve parecer parte do mesmo sistema.

## Tokens e classes atuais

Arquivos principais:

- `admin-panel/src/index.css`
- `admin-panel/tailwind.config.js`
- `admin-panel/src/layouts/AdminLayout.jsx`

Classes compartilhadas:

```css
.admin-card
.admin-page
.admin-page-header
.admin-page-copy
.admin-kicker
.admin-page-title
.admin-section-title
.admin-field-label
.admin-input
.admin-soft-panel
.admin-primary-btn
.admin-secondary-btn
.admin-danger-btn
.admin-sidebar
.admin-sidebar-header
.admin-sidebar-link
.admin-sidebar-link-active
```

## Checklist para novas telas

- A tela usa `admin-page` como base.
- O titulo usa `admin-page-title`.
- O subtitulo usa `admin-page-copy`.
- Cards usam `admin-card`.
- Inputs usam `admin-input`.
- Botoes usam as classes globais existentes.
- A cor primaria continua vinho.
- Textos nao ficam desalinhados nem sobrepostos.
- A tela funciona em desktop e mobile.
