---
name: Sistemas de Gestão Gastronômica
colors:
  surface: '#f8f9ff'
  surface-dim: '#cbdbf5'
  surface-bright: '#f8f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eff4ff'
  surface-container: '#e5eeff'
  surface-container-high: '#dce9ff'
  surface-container-highest: '#d3e4fe'
  on-surface: '#0b1c30'
  on-surface-variant: '#3f4944'
  inverse-surface: '#213145'
  inverse-on-surface: '#eaf1ff'
  outline: '#6f7973'
  outline-variant: '#bec9c2'
  surface-tint: '#1b6b51'
  primary: '#004532'
  on-primary: '#ffffff'
  primary-container: '#065f46'
  on-primary-container: '#8bd6b7'
  inverse-primary: '#8bd6b6'
  secondary: '#565e74'
  on-secondary: '#ffffff'
  secondary-container: '#dae2fd'
  on-secondary-container: '#5c647a'
  tertiary: '#2f3d51'
  on-tertiary: '#ffffff'
  tertiary-container: '#465469'
  on-tertiary-container: '#bac8e1'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#a6f2d1'
  primary-fixed-dim: '#8bd6b6'
  on-primary-fixed: '#002116'
  on-primary-fixed-variant: '#00513b'
  secondary-fixed: '#dae2fd'
  secondary-fixed-dim: '#bec6e0'
  on-secondary-fixed: '#131b2e'
  on-secondary-fixed-variant: '#3f465c'
  tertiary-fixed: '#d5e3fd'
  tertiary-fixed-dim: '#b9c7e0'
  on-tertiary-fixed: '#0d1c2f'
  on-tertiary-fixed-variant: '#3a485c'
  background: '#f8f9ff'
  on-background: '#0b1c30'
  surface-variant: '#d3e4fe'
typography:
  h1:
    fontFamily: Inter
    fontSize: 30px
    fontWeight: '700'
    lineHeight: 38px
    letterSpacing: -0.02em
  h1-mobile:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
  h2:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.01em
  h3:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 28px
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  body-sm:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 18px
  label-md:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.05em
  code:
    fontFamily: jetbrainsMono
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  base: 4px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  gutter: 16px
  container-max: 1440px
---

## Brand & Style

O foco central deste design system é a **eficiência operacional e precisão técnica**. Voltado para o ambiente dinâmico de restaurantes e operações de food service, a interface prioriza a densidade de informações sem sacrificar a legibilidade. 

A estética adotada é a **Corporate / Modern**, utilizando uma abordagem utilitária que transmite confiança e controle. O design deve evocar uma sensação de ferramenta robusta, capaz de lidar com grandes volumes de dados (pedidos, estoque, fluxo de caixa) em tempo real. A linguagem visual evita ornamentos desnecessários, focando em hierarquia clara e feedback imediato para o usuário.

**Objetivos de Design:**
- Minimizar a carga cognitiva em momentos de alta demanda (pico de serviço).
- Garantir que ações críticas (cancelar pedido, fechar conta) sejam visualmente distintas.
- Manter uma aparência profissional e higiênica, refletindo os padrões do setor.

## Colors

A paleta é fundamentada em um **Emerald Green profundo** como cor primária, escolhido por sua associação com estabilidade, frescor e profissionalismo. As cores neutras utilizam uma escala de cinzas frios (Cool Grays) para manter a interface sóbria e reduzir o cansaço visual em turnos longos.

- **Primária (#065F46):** Utilizada para ações principais, destaques de navegação e estados ativos.
- **Secundária (#0F172A):** Um Slate escuro para textos de alta hierarquia e elementos estruturais como barras laterais.
- **Neutros:** Tons de cinza azulado que diferenciam superfícies de fundo de bordas de componentes.
- **Semântica:** O sistema de cores de status é rigoroso. O verde de sucesso é distinto do esmeralda primário para evitar confusão entre "ação da marca" e "confirmação de sistema".

## Typography

Utilizamos a **Inter** como fonte principal devido à sua excelente legibilidade em telas de alta densidade e tamanhos reduzidos. A hierarquia é construída através do peso e do contraste de escala, garantindo que o usuário identifique rapidamente o contexto da página.

Para interfaces operacionais (como PDV ou gestão de estoque), priorizamos o uso de `body-sm` e `body-md` para maximizar a quantidade de dados visíveis. O uso de `label-md` em caixa alta é reservado para cabeçalhos de tabelas e metadados de pequenos cards, facilitando a escaneabilidade. Números e valores monetários devem sempre utilizar pesos levemente superiores para destaque.

## Layout & Spacing

O sistema de espaçamento baseia-se em uma grade de **8px**, com subdivisões de **4px** para componentes compactos. A abordagem é de **Fixed Grid** para o dashboard principal e ferramentas administrativas, garantindo que a densidade da informação permaneça controlada.

**Configuração de Grid:**
- **Desktop (12 colunas):** Margens de 24px, gutters de 16px.
- **Tablet (8 colunas):** Margens de 16px, gutters de 12px.
- **Mobile (4 colunas):** Margens de 12px, gutters de 8px.

A aplicação deve priorizar o alinhamento vertical rigoroso. Elementos relacionados (como labels e inputs) utilizam o incremento de 4px, enquanto grupos de informações distintos utilizam 16px ou 24px para criar separação visual clara sem desperdiçar espaço na tela.

## Elevation & Depth

Para manter a clareza e evitar ruído visual em telas saturadas de dados, este design system utiliza **camadas tonais e contornos sutis** em vez de sombras pesadas.

- **Nível 0 (Fundo):** Cor de fundo neutra clara (`#F8FAFC`).
- **Nível 1 (Cards/Superfícies):** Branco puro com borda de 1px em cinza muito claro (`#E2E8F0`).
- **Nível 2 (Popovers/Dropdowns):** Utiliza uma sombra "ambient" muito suave (blur de 8px, 4% de opacidade) para destacar o elemento do plano de fundo imediato.
- **Nível 3 (Modais):** Sombras mais profundas e uma sobreposição (overlay) de 40% de opacidade para focar a atenção do usuário.

O uso de profundidade deve ser funcional: apenas elementos interativos ou flutuantes recebem elevação. Tabelas e listas de dados permanecem "planas" no Nível 1.

## Shapes

O sistema utiliza um arredondamento **Soft (0.25rem / 4px)**. Esta escolha equilibra a seriedade de uma ferramenta profissional com a modernidade de um SaaS atual. 

- **Botões e Inputs:** 4px de raio de borda para manter a precisão.
- **Cards de Métricas:** 8px (`rounded-lg`) para suavizar grandes áreas de conteúdo.
- **Badges de Status:** 2px ou totalmente circulares (pill) dependendo do contexto de densidade.

A consistência nos raios de borda é crucial para que a interface pareça um sistema único e integrado. Elementos de seleção (como checkboxes) mantêm o raio de 2px para reforçar a natureza binária da escolha.

## Components

Os componentes são desenhados para alta densidade operacional:

- **Tabelas de Dados:** Altura de linha compacta (aprox. 40px), cabeçalhos fixos com fundo cinza sutil, e suporte a estados de hover para facilitar o rastreamento ocular.
- **Badges de Status:** Design sólido para estados críticos (Perigo/Erro) e design de contorno ou fundo suave para estados informativos. Sempre acompanhados de texto em português claro (ex: "Pendente", "Finalizado", "Cancelado").
- **Campos de Entrada (Inputs):** Rótulos sempre visíveis acima do campo. Estados de erro destacados por borda vermelha de 2px e ícone de aviso interno.
- **Botões:** 
  - *Primário:* Verde Esmeralda sólido com texto branco.
  - *Secundário:* Contorno Slate com fundo transparente.
  - *Terciário/Ghost:* Apenas texto para ações de menor importância ou dentro de tabelas.
- **Cards de Métricas:** Foco no valor numérico em `h2` ou `h3`, com um pequeno indicador de tendência (seta para cima/baixo) e label descritivo.
- **Modais:** Largura controlada (Max 600px para formulários), sempre com cabeçalho claro e botões de ação fixos no rodapé à direita.

**Componentes Adicionais:** Mini-dashboards de cozinha (KDS) com cards de pedidos expansíveis e cronômetros de cor dinâmica baseados no tempo de espera.