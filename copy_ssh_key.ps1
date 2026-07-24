$pubKey = Get-Content -Path "C:\Users\diegu\.ssh\id_rsa.pub"
Write-Host "SSH Public Key ready: $pubKey"

# Script para adicionar a chave SSH na VPS
$code = @"
mkdir -p ~/.ssh
echo '$pubKey' >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
chmod 700 ~/.ssh
"@

Write-Host $code
