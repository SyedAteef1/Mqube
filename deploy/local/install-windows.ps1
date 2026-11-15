# MQube on a local (in-shop) Windows server, using Docker Desktop.
# 1. Install Docker Desktop (https://www.docker.com/products/docker-desktop), open it once, and
#    tick "Start Docker Desktop when you sign in".
# 2. Open PowerShell in the deploy folder and run:   powershell -ExecutionPolicy Bypass -File local\install-windows.ps1
# Staff then open  http://<server-ip>  from any computer on the shop network.
$ErrorActionPreference = "Stop"
Set-Location (Join-Path $PSScriptRoot "..")
$EnvFile = ".env.production"
function New-Secret { -join ((1..32) | ForEach-Object { '{0:x2}' -f (Get-Random -Maximum 256) }) }

if (-not (Get-Command docker -ErrorAction SilentlyContinue)) { throw "Docker Desktop is not installed or not running." }

if (Test-Path $EnvFile) {
  Write-Host "$EnvFile already exists; keeping its passwords and secrets."
} else {
  do {
    $p1 = Read-Host "Choose the owner (admin) password, at least 12 characters" -AsSecureString
    $p2 = Read-Host "Type it again" -AsSecureString
    $a = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($p1))
    $b = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($p2))
    $ok = ($a -eq $b) -and ($a.Length -ge 12)
    if (-not $ok) { Write-Host "Passwords differ or are shorter than 12 characters. Try again." }
  } until ($ok)
  $email = Read-Host "Owner email (optional)"
  $bdir = Read-Host "Backup folder, e.g. E:\MQubeBackups [./backups]"
  if (-not $bdir) { $bdir = "./backups" }
  @(
    "# MQube local server settings. Keep this file private.",
    "DOMAIN=:80",
    "POSTGRES_PASSWORD=$(New-Secret)",
    "JWT_SECRET_KEY=$(New-Secret)",
    "INTERNAL_SERVICE_KEY=$(New-Secret)",
    "SGIP_VAULT_MASTER_KEY=$(New-Secret)",
    "MQUBE_ADMIN_PASSWORD=$a",
    "MQUBE_ADMIN_EMAIL=$email",
    "BACKUP_DIR=$bdir",
    "BACKUP_KEEP_DAYS=30",
    "GUNICORN_WORKERS=2"
  ) | Set-Content -Encoding ascii $EnvFile
  Write-Host "Saved $EnvFile"
}

Write-Host "Building and starting MQube (first time takes 5-10 minutes)..."
docker compose -f docker-compose.prod.yml --env-file $EnvFile up -d --build
docker compose -f docker-compose.prod.yml --env-file $EnvFile ps

try { New-NetFirewallRule -DisplayName "MQube (port 80)" -Direction Inbound -Protocol TCP -LocalPort 80 -Action Allow -ErrorAction Stop | Out-Null; Write-Host "Firewall: port 80 opened" } catch { Write-Host "Open port 80 in Windows Firewall if other computers cannot connect." }

Write-Host ""
Write-Host "Online access for the hosted MQube website (free, no domain): Tailscale Funnel"
if (Get-Command tailscale -ErrorAction SilentlyContinue) {
  $ans = Read-Host "Turn on Tailscale Funnel now? (Y/n)"
  if ($ans -ne "n") {
    tailscale up
    tailscale funnel --bg 80
    $url = ((tailscale funnel status) | Select-String -Pattern 'https://\S+' | Select-Object -First 1).Matches.Value.TrimEnd('/')
    if ($url) { $url | Set-Content ONLINE_ADDRESS.txt; Write-Host ""; Write-Host "SEND THIS ADDRESS to the person who manages the MQube website:  $url" }
  }
} else {
  Write-Host "Install Tailscale from https://tailscale.com/download, sign in, then run:  tailscale funnel --bg 80"
}

$ip = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.IPAddress -notlike "127.*" -and $_.PrefixOrigin -ne "WellKnown" } | Select-Object -First 1).IPAddress
Write-Host ""
Write-Host "MQube is running. Open  http://$ip  on any computer in the shop and sign in as  admin"
Write-Host "Give this computer a fixed address in the router so the address never changes."
