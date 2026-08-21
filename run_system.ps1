# run_system.ps1
# Script interativo de gerenciamento para o sistema Interactive Restaurant
# OS: Windows - Shell: PowerShell

# Forçar caminhos padrão no PATH do script
$env:Path = "C:\Program Files\nodejs;" + $env:Path

# Localizar dinamicamente o PostgreSQL mais recente
$PgBinPath = ""
if (Test-Path "C:\Program Files\PostgreSQL") {
    $dirs = Get-ChildItem "C:\Program Files\PostgreSQL" -Directory | Sort-Object Name -Descending
    foreach ($dir in $dirs) {
        $bin = "$($dir.FullName)\bin"
        if (Test-Path "$bin\psql.exe") {
            $PgBinPath = $bin
            $env:Path = "$PgBinPath;" + $env:Path
            break
        }
    }
}

# Função para extrair variáveis do arquivo .env
function Get-EnvVar {
    param (
        [string]$FilePath,
        [string]$VarName,
        [string]$DefaultValue
    )
    if (Test-Path $FilePath) {
        $lines = Get-Content $FilePath
        foreach ($line in $lines) {
            $line = $line.Trim()
            if ($line.StartsWith("#") -or [string]::IsNullOrEmpty($line)) { continue }
            if ($line -like "$VarName=*") {
                $value = $line.Substring($VarName.Length + 1)
                # Remover aspas se presentes
                if (($value.StartsWith('"') -and $value.EndsWith('"')) -or ($value.StartsWith("'") -and $value.EndsWith("'"))) {
                    $value = $value.Substring(1, $value.Length - 2)
                }
                return $value
            }
        }
    }
    return $DefaultValue
}

# Obter IP de rede local da máquina
function Get-LocalIP {
    $ips = Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.InterfaceAlias -notlike "*Loopback*" -and $_.IPAddress -notlike "169.254*" }
    $ip = ($ips | Select-Object -First 1).IPAddress
    if ([string]::IsNullOrEmpty($ip)) {
        return "localhost"
    }
    return $ip
}

# Função para verificar requisitos do sistema
function Show-Requirements {
    Clear-Host
    Write-Host "=============================================" -ForegroundColor Cyan
    Write-Host "   VERIFICACAO DE REQUISITOS DO SISTEMA" -ForegroundColor Cyan
    Write-Host "=============================================" -ForegroundColor Cyan
    Write-Host ""

    # Node.js
    $nodeVer = node -v 2>$null
    if ($nodeVer) {
        Write-Host "[OK] Node.js detectado: $nodeVer" -ForegroundColor Green
    } else {
        Write-Host "[FALTA] Node.js nao encontrado no PATH do sistema." -ForegroundColor Red
        Write-Host "        (Adicionado temporariamente C:\Program Files\nodejs)" -ForegroundColor Yellow
    }

    # npm
    $npmVer = npm.cmd -v 2>$null
    if ($npmVer) {
        Write-Host "[OK] npm detectado: v$npmVer" -ForegroundColor Green
    } else {
        Write-Host "[FALTA] npm nao encontrado." -ForegroundColor Red
    }

    # Python
    $pythonVer = python --version 2>$null
    if ($pythonVer) {
        Write-Host "[OK] Python detectado: $pythonVer" -ForegroundColor Green
    } else {
        Write-Host "[AVISO] Python nao encontrado (necessario apenas para o AI Bridge)." -ForegroundColor Yellow
    }

    # PostgreSQL
    if ($PgBinPath) {
        Write-Host "[OK] PostgreSQL detectado em: $PgBinPath" -ForegroundColor Green
        $psqlVer = psql --version 2>$null
        Write-Host "     Versao do cliente psql: $psqlVer" -ForegroundColor Gray
    } else {
        Write-Host "[FALTA] Binarios do PostgreSQL nao encontrados no disco." -ForegroundColor Red
    }

    # PostgreSQL Windows Service
    $pgService = Get-Service | Where-Object Name -like 'postgresql*'
    if ($pgService) {
        if ($pgService.Status -eq 'Running') {
            Write-Host "[OK] Servico do PostgreSQL '$($pgService.Name)' esta rodando." -ForegroundColor Green
        } else {
            Write-Host "[AVISO] Servico do PostgreSQL '$($pgService.Name)' existe mas esta $($pgService.Status)." -ForegroundColor Yellow
            Write-Host "        Para iniciar execute: Start-Service $($pgService.Name)" -ForegroundColor Gray
        }
    } else {
        Write-Host "[AVISO] Servico Windows do PostgreSQL nao foi localizado." -ForegroundColor Yellow
    }

    # Arquivos .env
    Write-Host ""
    Write-Host "Arquivos de configuracao .env:" -ForegroundColor Cyan
    $envFiles = @(
        @("Backend", "backend\.env"),
        @("Admin Panel", "admin-panel\.env"),
        @("Client Web", "client-web\.env"),
        @("Client App", "client-app\ClientApp\.env")
    )
    foreach ($item in $envFiles) {
        if (Test-Path $item[1]) {
            Write-Host "  [OK] $($item[0]): $($item[1]) configurado" -ForegroundColor Green
        } else {
            Write-Host "  [FALTA] $($item[0]): $($item[1]) nao encontrado!" -ForegroundColor Red
        }
    }

    Write-Host ""
    Write-Host "Pressione qualquer tecla para retornar ao menu..."
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
}

# Função para instalar/reinstalar as dependências
function Install-AllDependencies {
    Clear-Host
    Write-Host "=============================================" -ForegroundColor Cyan
    Write-Host "   INSTALACAO DE DEPENDENCIAS" -ForegroundColor Cyan
    Write-Host "=============================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Escolha uma opcao:"
    Write-Host "1. Instalar Tudo (Root, Workspaces, Web, Mobile) [Recomendado]"
    Write-Host "2. Instalar apenas Workspaces principais (Backend, Admin, Ads, AI)"
    Write-Host "3. Instalar apenas Client Web"
    Write-Host "4. Instalar apenas Client App (Metro/Mobile)"
    Write-Host "0. Voltar"
    Write-Host ""
    $op = Read-Host "Opcao"

    $ScriptDir = $PSScriptRoot

    switch ($op) {
        "1" {
            Write-Host "`nInstalando workspaces..." -ForegroundColor Cyan
            npm.cmd install --workspaces
            Write-Host "`nInstalando client-web..." -ForegroundColor Cyan
            Push-Location "$ScriptDir\client-web"; npm.cmd install; Pop-Location
            Write-Host "`nInstalando client-app..." -ForegroundColor Cyan
            Push-Location "$ScriptDir\client-app\ClientApp"; npm.cmd install; Pop-Location
            Write-Host "`nInstalacao concluida!" -ForegroundColor Green
        }
        "2" {
            Write-Host "`nInstalando workspaces..." -ForegroundColor Cyan
            npm.cmd install --workspaces
            Write-Host "`nConcluido!" -ForegroundColor Green
        }
        "3" {
            Write-Host "`nInstalando client-web..." -ForegroundColor Cyan
            Push-Location "$ScriptDir\client-web"; npm.cmd install; Pop-Location
            Write-Host "`nConcluido!" -ForegroundColor Green
        }
        "4" {
            Write-Host "`nInstalando client-app..." -ForegroundColor Cyan
            Push-Location "$ScriptDir\client-app\ClientApp"; npm.cmd install; Pop-Location
            Write-Host "`nConcluido!" -ForegroundColor Green
        }
        "0" { return }
    }

    Write-Host ""
    Write-Host "Pressione qualquer tecla para continuar..."
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
}

# Função para realizar Backup do Banco de Dados
function Backup-Database {
    Clear-Host
    Write-Host "=============================================" -ForegroundColor Cyan
    Write-Host "   BACKUP DO BANCO DE DADOS POSTGRESQL" -ForegroundColor Cyan
    Write-Host "=============================================" -ForegroundColor Cyan
    Write-Host ""

    # Carregar dados do .env do backend
    $backendEnv = "backend\.env"
    if (-not (Test-Path $backendEnv)) {
        Write-Host "[ERRO] Arquivo .env do backend nao encontrado. Impossivel ler configuracoes." -ForegroundColor Red
        Write-Host "Pressione qualquer tecla para retornar..."
        $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
        return
    }

    $dbType = Get-EnvVar -FilePath $backendEnv -VarName "DB_TYPE" -DefaultValue "sqlite"
    $dbHost = Get-EnvVar -FilePath $backendEnv -VarName "DB_HOST" -DefaultValue "localhost"
    $dbPort = Get-EnvVar -FilePath $backendEnv -VarName "DB_PORT" -DefaultValue "5432"
    $dbName = Get-EnvVar -FilePath $backendEnv -VarName "DB_NAME" -DefaultValue "restaurant_db"
    $dbUser = Get-EnvVar -FilePath $backendEnv -VarName "DB_USER" -DefaultValue "postgres"
    $dbPass = Get-EnvVar -FilePath $backendEnv -VarName "DB_PASSWORD" -DefaultValue ""

    Write-Host "Configuracoes lidas do backend\.env:" -ForegroundColor Gray
    Write-Host "  Tipo: $dbType"
    Write-Host "  Banco: $dbName"
    Write-Host "  Usuario: $dbUser"
    Write-Host "  Host: ${dbHost}:$dbPort"
    Write-Host ""

    if ($dbType -ne "postgresql") {
        Write-Host "[AVISO] O backend nao esta configurado com DB_TYPE=postgresql." -ForegroundColor Yellow
        Write-Host "        O backup do PostgreSQL pode nao refletir os dados de teste locais se voce estiver usando SQLite." -ForegroundColor Yellow
        Write-Host ""
    }

    # Criar pasta de backups se nao existir
    $backupDir = "backups"
    if (-not (Test-Path $backupDir)) {
        New-Item -ItemType Directory -Path $backupDir | Out-Null
    }

    # Nome do arquivo de backup
    $timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
    $defaultFilename = "backup_$($dbName)_$timestamp.sql"
    $filename = Read-Host "Nome do arquivo de backup (Pressione Enter para '$defaultFilename')"
    if ([string]::IsNullOrEmpty($filename)) { $filename = $defaultFilename }
    
    $backupPath = "$backupDir\$filename"

    Write-Host "`nExecutando pg_dump..." -ForegroundColor Yellow

    # Configurar variavel de ambiente temporaria para senha do pg_dump
    $env:PGPASSWORD = $dbPass
    try {
        if (-not $PgBinPath) {
            throw "Caminho do PostgreSQL nao localizado. pg_dump nao disponivel."
        }
        
        $pgDumpPath = "$PgBinPath\pg_dump.exe"
        & $pgDumpPath -h $dbHost -p $dbPort -U $dbUser -F c -b -v -f $backupPath $dbName 2>$null

        if ($LASTEXITCODE -eq 0) {
            Write-Host "`n[SUCESSO] Backup gravado em: $backupPath" -ForegroundColor Green
        } else {
            throw "Falha ao executar pg_dump (codigo de erro: $LASTEXITCODE)"
        }
    }
    catch {
        Write-Host "`n[ERRO] Falha ao realizar o backup: $_" -ForegroundColor Red
    }
    finally {
        # Limpar variavel de ambiente
        Remove-Item Env:PGPASSWORD -ErrorAction SilentlyContinue
    }

    Write-Host ""
    Write-Host "Pressione qualquer tecla para retornar ao menu..."
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
}

# Iniciar servidores em novas janelas do PowerShell
function Start-AllServers {
    Clear-Host
    Write-Host "=============================================" -ForegroundColor Cyan
    Write-Host "   INICIANDO SERVIDORES DO SISTEMA" -ForegroundColor Cyan
    Write-Host "=============================================" -ForegroundColor Cyan
    Write-Host ""

    $LanIp = Get-LocalIP
    Write-Host "IP de Rede Local detectado: $LanIp" -ForegroundColor Yellow
    Write-Host ""

    $ScriptDir = $PSScriptRoot

    # 1. AI Bridge (Python)
    $AiBridgePath = "$ScriptDir\ai-bridge"
    if (Test-Path "$AiBridgePath\app.py") {
        Write-Host "-> Iniciando AI Bridge (Porta 8000)..." -ForegroundColor Cyan
        Start-Process powershell -ArgumentList "-NoExit", "-Command", "& {Title 'AI Bridge (Porta 8000)'; cd '$AiBridgePath'; python -m uvicorn app:app --host 0.0.0.0 --port 8000}" -WindowStyle Normal
    }

    # 2. Backend
    Write-Host "-> Iniciando Backend (Porta 3000)..." -ForegroundColor Cyan
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "& {Title 'Backend Server (Porta 3000)'; `$env:Path = 'C:\Program Files\nodejs;' + `$env:Path; cd '$ScriptDir\backend'; npm.cmd run dev}" -WindowStyle Normal

    # 3. Ads Module
    Write-Host "-> Iniciando Ads Module (Porta 3003)..." -ForegroundColor Cyan
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "& {Title 'Ads Module (Porta 3003)'; `$env:Path = 'C:\Program Files\nodejs;' + `$env:Path; cd '$ScriptDir\ads-module'; npm.cmd run dev}" -WindowStyle Normal

    # 4. Client Web
    Write-Host "-> Iniciando Client Web (Porta 3002)..." -ForegroundColor Cyan
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "& {Title 'Client Web (Porta 3002)'; `$env:Path = 'C:\Program Files\nodejs;' + `$env:Path; cd '$ScriptDir\client-web'; npm.cmd run dev}" -WindowStyle Normal

    # 5. Admin Panel
    Write-Host "-> Iniciando Admin Panel (Porta 3001)..." -ForegroundColor Cyan
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "& {Title 'Admin Panel (Porta 3001)'; `$env:Path = 'C:\Program Files\nodejs;' + `$env:Path; cd '$ScriptDir\admin-panel'; npm.cmd run dev}" -WindowStyle Normal

    # 6. Client App (Metro Bundler)
    Write-Host "-> Iniciando Client App Metro Bundler..." -ForegroundColor Cyan
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "& {Title 'Client App Metro (React Native)'; `$env:Path = 'C:\Program Files\nodejs;' + `$env:Path; cd '$ScriptDir\client-app\ClientApp'; npm.cmd start}" -WindowStyle Normal

    Write-Host ""
    Write-Host "[OK] Todos os servidores foram abertos em janelas separadas!" -ForegroundColor Green
    Write-Host "Aguarde alguns segundos para que eles terminem de inicializar." -ForegroundColor Gray
    Write-Host ""
    Write-Host "Pressione qualquer tecla para retornar ao menu..."
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
}

# Função para abrir as páginas de forma rápida
function Open-SystemPages {
    Clear-Host
    Write-Host "=============================================" -ForegroundColor Cyan
    Write-Host "   ABRINDO PAGINAS NO NAVEGADOR" -ForegroundColor Cyan
    Write-Host "=============================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Abrindo..." -ForegroundColor Yellow

    # URLs locais
    Start-Process "http://localhost:3001"            # Admin Panel
    Start-Process "http://localhost:3002"            # Client Web
    Start-Process "http://localhost:3003/health"     # Ads Module Health Check
    Start-Process "http://localhost:3000/api/health" # Backend Health Check

    Write-Host "Paginas enviadas ao navegador padrao." -ForegroundColor Green
    Write-Host ""
    Write-Host "Pressione qualquer tecla para retornar ao menu..."
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
}

# Mostrar o IP de conexao para outros dispositivos
function Show-TabletConnection {
    Clear-Host
    Write-Host "=============================================" -ForegroundColor Cyan
    Write-Host "   CONEXAO DE DISPOSITIVOS EXTERNOS (TABLET)" -ForegroundColor Cyan
    Write-Host "=============================================" -ForegroundColor Cyan
    Write-Host ""

    $LanIp = Get-LocalIP

    Write-Host "1. IP da Rede Local do seu PC:  $LanIp" -ForegroundColor Green
    Write-Host ""
    Write-Host "Como conectar seu Tablet ou Celular:" -ForegroundColor Cyan
    Write-Host "------------------------------------------------------------"
    Write-Host "A. Certifique-se de que o Tablet e o PC estao na mesma rede Wi-Fi." -ForegroundColor White
    Write-Host "B. No navegador do Tablet, digite os seguintes links:" -ForegroundColor White
    Write-Host "   - Para acessar o App Web de Clientes:   http://${LanIp}:3002" -ForegroundColor Yellow
    Write-Host "   - Para acessar o Painel de Administracao: http://${LanIp}:3001" -ForegroundColor Yellow
    Write-Host "   - Para verificar o Backend:              http://${LanIp}:3000/api/health" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Nota para o App Mobile (Android/iOS):" -ForegroundColor Cyan
    Write-Host "   - O Metro Bundler do Client App ja foi configurado automaticamente" -ForegroundColor Gray
    Write-Host "     no arquivo client-app\ClientApp\.env para usar o HOST=$LanIp." -ForegroundColor Gray
    Write-Host "   - Se voce mudar de rede ou de roteador, reinicie este script" -ForegroundColor Gray
    Write-Host "     para recalcular o IP e recarregar os servidores." -ForegroundColor Gray
    Write-Host ""
    Write-Host "Pressione qualquer tecla para retornar ao menu..."
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
}

# Loop principal do menu interativo
do {
    Clear-Host
    Write-Host "=============================================" -ForegroundColor Cyan
    Write-Host "   PAINEL DE GERENCIAMENTO - INTERACTIVE RESTAURANTE" -ForegroundColor Cyan
    Write-Host "=============================================" -ForegroundColor Cyan
    Write-Host "  IP Local de Rede: $(Get-LocalIP)" -ForegroundColor Yellow
    Write-Host "=============================================" -ForegroundColor Cyan
    Write-Host "  1. Verificar Requisitos e Servico do Banco" -ForegroundColor White
    Write-Host "  2. Instalar / Reinstalar Dependencias (npm install)" -ForegroundColor White
    Write-Host "  3. Realizar Backup do Banco de Dados (PostgreSQL)" -ForegroundColor White
    Write-Host "  4. Iniciar Todos os Servidores (Janelas Separadas)" -ForegroundColor White
    Write-Host "  5. Abrir Interfaces do Sistema no Navegador" -ForegroundColor White
    Write-Host "  6. Exibir IP de Conexao para Tablet/Dispositivos" -ForegroundColor White
    Write-Host "  0. Sair" -ForegroundColor White
    Write-Host "=============================================" -ForegroundColor Cyan
    Write-Host ""
    
    $choice = Read-Host "Escolha uma opcao [0-6]"
    
    switch ($choice) {
        "1" { Show-Requirements }
        "2" { Install-AllDependencies }
        "3" { Backup-Database }
        "4" { Start-AllServers }
        "5" { Open-SystemPages }
        "6" { Show-TabletConnection }
        "0" { break }
        default {
            Write-Host "Opcao invalida. Tente novamente." -ForegroundColor Red
            Start-Sleep -Seconds 1
        }
    }
} while ($choice -ne "0")

Write-Host "`nSaindo... Obrigado por usar o Launcher!" -ForegroundColor Cyan
Start-Sleep -Seconds 1
