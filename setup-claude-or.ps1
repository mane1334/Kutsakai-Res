# Configuração nativa do Claude Code para usar o OpenRouter
$env:OPENROUTER_API_KEY = "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"
$env:ANTHROPIC_BASE_URL = "https://openrouter.ai/api"
$env:ANTHROPIC_AUTH_TOKEN = $env:OPENROUTER_API_KEY
$env:ANTHROPIC_API_KEY = "" # Importante: deve estar vazio para evitar conflitos

# Configuração de Modelos
$env:ANTHROPIC_DEFAULT_OPUS_MODEL = "z-ai/glm-4.5-air:free"
$env:ANTHROPIC_DEFAULT_SONNET_MODEL = "z-ai/glm-4.5-air:free"
$env:ANTHROPIC_DEFAULT_HAIKU_MODEL = "z-ai/glm-4.5-air:free"
$env:CLAUDE_CODE_SUBAGENT_MODEL = "z-ai/glm-4.5-air:free"

Write-Host "Variáveis de ambiente do OpenRouter configuradas para esta sessão." -ForegroundColor Cyan
Write-Host "O Claude Code agora usa OpenRouter nativamente nas rotas da Anthropic." -ForegroundColor Yellow

# Função de ajuda opcional
function claude-or {
    claude --model "z-ai/glm-4.5-air:free" @args
}

Write-Host "Como a integração é nativa, você pode simplesmente usar 'claude' em vez de especificar a flag do modelo." -ForegroundColor Green
