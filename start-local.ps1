$root = Split-Path -Parent $MyInvocation.MyCommand.Path

$storefront = Start-Process -FilePath "python" `
  -ArgumentList "-m", "http.server", "8000" `
  -WorkingDirectory $root `
  -PassThru

$portal = Start-Process -FilePath "npm.cmd" `
  -ArgumentList "--prefix", "creator-portal", "run", "dev" `
  -WorkingDirectory $root `
  -PassThru

Write-Host "Storefront: http://localhost:8000"
Write-Host "Creator portal: http://localhost:3000"
Write-Host "Press Ctrl+C to stop this launcher. Close the two child terminals if they remain open."

try {
  Wait-Process -Id $storefront.Id
} finally {
  if (!$storefront.HasExited) { Stop-Process -Id $storefront.Id -Force }
  if ($portal -and !$portal.HasExited) { Stop-Process -Id $portal.Id -Force }
}
