#!/usr/bin/env pwsh
# PowerShell test script for the /api/translate endpoint

$body = '{"text":"Hello world","target":"es"}'
try {
  $res = Invoke-RestMethod -Method Post -Uri 'http://localhost:3000/api/translate' -ContentType 'application/json' -Body $body -ErrorAction Stop
  Write-Output "Response:`n$res | ConvertTo-Json -Depth 5"
} catch {
  Write-Error "Request failed: $_"
}
