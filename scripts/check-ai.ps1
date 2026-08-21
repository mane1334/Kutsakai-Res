# check-ai.ps1
# Verifica chat (NVIDIA) via backend e saúde do ai-bridge (ASR/TTS)

param(
    [string]$EnvPath,
    [string]$BackendUrl,
    [string]$AudioFile
)

function Load-EnvFile {
    param([string]$Path)
    $envMap = @{}
    if (-not $Path) { return $envMap }
    if (-not (Test-Path $Path)) { return $envMap }

    Get-Content $Path | ForEach-Object {
        $line = $_.Trim()
        if (-not $line -or $line.StartsWith('#')) { return }
        $parts = $line -split '=', 2
        if ($parts.Length -eq 2) {
            $key = $parts[0].Trim()
            $val = $parts[1].Trim()
            if ($key) { $envMap[$key] = $val }
        }
    }
    return $envMap
}

if (-not $EnvPath) {
    if (Test-Path ".\\backend\\.env") { $EnvPath = ".\\backend\\.env" }
    elseif (Test-Path ".\\.env") { $EnvPath = ".\\.env" }
}

$envMap = Load-EnvFile -Path $EnvPath

$port = $envMap["PORT"]
if (-not $BackendUrl) {
    if ($port) { $BackendUrl = "http://localhost:$port" }
    else { $BackendUrl = "http://localhost:3000" }
}

$aiKey = $envMap["AI_MODULE_API_KEY"]
$asrUrl = $envMap["AI_ASR_URL"]
$ttsUrl = $envMap["AI_TTS_URL"]

Write-Host "== AI Check ==" -ForegroundColor Cyan
if ($EnvPath) { Write-Host "Env: $EnvPath" }
Write-Host "Backend: $BackendUrl"

# 1) Chat test
Write-Host "`n[1/3] Testando /api/chat..." -ForegroundColor Yellow
try {
    $headers = @{}
    if ($aiKey) { $headers["x-api-key"] = $aiKey }
    $body = @{ message = "Olá! Pode sugerir um prato leve?" } | ConvertTo-Json
    $resp = Invoke-RestMethod -Method Post -Uri "$BackendUrl/api/chat" -Headers $headers -ContentType "application/json" -Body $body -TimeoutSec 20
    if ($resp.reply) {
        Write-Host "OK: resposta recebida." -ForegroundColor Green
    } else {
        Write-Warning "Sem campo 'reply' na resposta."
    }
} catch {
    Write-Error "Falha no /api/chat: $($_.Exception.Message)"
}

# 2) AI Bridge health
if ($asrUrl -or $ttsUrl) {
    $base = $null
    if ($asrUrl) { $base = ($asrUrl -replace '/asr$','') }
    elseif ($ttsUrl) { $base = ($ttsUrl -replace '/tts$','') }

    if ($base) {
        Write-Host "`n[2/3] Testando AI Bridge /health..." -ForegroundColor Yellow
        try {
            $health = Invoke-RestMethod -Method Get -Uri "$base/health" -TimeoutSec 10
            if ($health.status -eq "ok") {
                Write-Host "OK: ai-bridge saudável." -ForegroundColor Green
            } else {
                Write-Warning "ai-bridge respondeu, mas status != ok."
            }
        } catch {
            Write-Error "Falha no ai-bridge /health: $($_.Exception.Message)"
        }
    }
}

# 3) TTS test
if ($ttsUrl) {
    Write-Host "`n[3/3] Testando TTS..." -ForegroundColor Yellow
    try {
        $payload = @{ text = "Olá, sua mesa já está pronta." } | ConvertTo-Json
        $tts = Invoke-WebRequest -Method Post -Uri $ttsUrl -ContentType "application/json" -Body $payload -TimeoutSec 30
        if ($tts.StatusCode -ge 200 -and $tts.StatusCode -lt 300) {
            $outFile = Join-Path $PSScriptRoot "tts_test.wav"
            [System.IO.File]::WriteAllBytes($outFile, $tts.Content)
            Write-Host "OK: áudio salvo em $outFile" -ForegroundColor Green
        } else {
            Write-Warning "TTS respondeu com status $($tts.StatusCode)"
        }
    } catch {
        Write-Error "Falha no TTS: $($_.Exception.Message)"
    }
} else {
    Write-Host "`n[3/3] TTS não configurado (AI_TTS_URL vazio)." -ForegroundColor Yellow
}

# ASR opcional com arquivo de áudio
if ($AudioFile -and (Test-Path $AudioFile) -and $asrUrl) {
    Write-Host "`n[extra] Testando ASR com arquivo..." -ForegroundColor Yellow
    try {
        $form = @{ file = Get-Item $AudioFile }
        $asrResp = Invoke-RestMethod -Method Post -Uri $asrUrl -Form $form -TimeoutSec 60
        Write-Host "ASR: $($asrResp.text)" -ForegroundColor Green
    } catch {
        Write-Error "Falha no ASR: $($_.Exception.Message)"
    }
}
