# Ligação ao backend

## Visão geral

O backend é um servidor Node.js com Express, executado por defeito na porta `3000`. O mesmo servidor HTTP suporta:

- API REST em `/api`;
- ficheiros de imagem em `/uploads`;
- ficheiros de áudio da IA em `/audio`;
- WebSocket na mesma porta;
- streaming de chat em `/api/chat/stream` usando SSE.

O código principal está em `backend/index.js`. A camada de dados (`backend/db.js`) suporta PostgreSQL e também SQLite em cenários locais/testes, conforme a configuração do ambiente.

## URLs

### Web

O `client-web` resolve a base nesta ordem:

1. `VITE_API_URL`, quando definido;
2. `API_BASE_URL` guardado no `localStorage`;
3. hostname atual com a porta `3000`.

Assim, a API normalmente fica em `http://<host>:3000/api`. A URL do WebSocket pode ser definida por `window.__APP_WS_URL__` ou `VITE_WS_URL`; sem isso, usa `ws://<hostname>:3000`.

### React Native

O `client-app` usa `HOST` de `react-native-config` ou estes padrões:

- Android Emulator: `10.0.2.2`;
- iOS Simulator: `localhost`;
- dispositivo físico: IP local do computador que executa o backend.

Com isso, são construídas `BASE_URL`, `API_URL` (`BASE_URL/api`) e `WS_URL` (`ws://<host>:3000`). O IP, fallback VPS, mesa e restaurante também podem ser alterados nas definições e persistidos em `app_state.json`.

## REST e cabeçalhos

As chamadas JSON usam `Content-Type: application/json`. Uploads usam `multipart/form-data`.

O painel administrativo guarda o JWT em `localStorage` e envia:

```http
Authorization: Bearer <token>
```

O cliente de mesa identifica o tenant com:

```http
x-restaurant-id: <restaurant_id>
```

O backend extrai `restaurant_id` do JWT ou desse cabeçalho. Se nenhum for enviado, existe fallback de compatibilidade para o restaurante `1`; em produção, o cliente deve sempre enviar o identificador correto.

## Autenticação e autorização

- `POST /api/auth/login` devolve um JWT válido por 8 horas.
- `POST /api/auth/setup` cria o primeiro superadmin, apenas se ainda não existir.
- `POST /api/auth/register-restaurant` cria restaurante, utilizador admin e definições iniciais.
- Rotas administrativas de escrita exigem JWT.
- Rotas `/api/superadmin/*` e `/api/database/*` exigem JWT com role `superadmin`.
- Em desenvolvimento, CORS é aberto; em produção, é usada uma whitelist configurada por `CORS_ORIGIN` e origens derivadas do host.

O cliente web e o painel removem o token e redirecionam para login ao receber `401`/`403`. O backend aplica rate limiting em `/api`, headers de segurança e, quando disponível, Helmet.

## WebSocket

O WebSocket não possui um path separado: faz upgrade na mesma origem/porta do backend. O cliente envia periodicamente:

```json
{"type":"PING"}
```

e recebe `PONG`. O backend também envia dados de logs (`LOG_DATA`) e eventos operacionais, incluindo atualizações de pedidos e chamadas de funcionário. O `client-web` reconecta com backoff; o React Native usa `useWebSocket`.

## Streaming de IA

`POST /api/chat/stream` responde como `text/event-stream`. Os eventos principais são `start`, `chunk`, `done` e `error`. Cada evento vem no formato SSE:

```text
data: {"type":"chunk","content":"..."}
```

O chat de texto/voz pode usar `x-api-key` quando `AI_MODULE_API_KEY` está configurada. O streaming atual não exige esse middleware específico, mas deve continuar protegido na infraestrutura de produção.

## Diagnóstico

- `GET /api/health`: saúde geral da API.
- `GET /api/backend/heartbeat`: estado e histórico do heartbeat do backend.
- `GET /api/database/status`: estado da base, protegido para superadmin.
- O cliente possui componentes de diagnóstico para API e WebSocket.

