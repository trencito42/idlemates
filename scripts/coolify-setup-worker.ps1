# Deprecated: the app now runs web + worker in one Coolify service.
# This script only ensures REDIS_URL exists on the main web application.
# Delete any separate idlemates-worker app in Coolify to avoid duplicate workers.

$token = "4|91DApsxZMgnaWcNVYUE1sqNfqab8HLULAvWiSfRyee44d867"
$base = "https://cp.blipmade.com/api/v1"
$headers = @{
  Authorization = "Bearer $token"
  Accept = "application/json"
  "Content-Type" = "application/json"
}

$webUuid = "mpl2dcvwdip1vjbseypks71v"
$redisUrl = "redis://default:T8BCHuSxhdSr6WvLsMfvjA81u8yhR2NPdpA7i4hYwou7zvNNPr1EQDE0bAylPFrA@qpmbeakby41600rd7ct67adi:6379/0"

Write-Host "Adding REDIS_URL to web app..."
Invoke-RestMethod -Method Post -Uri "$base/applications/$webUuid/envs" -Headers $headers -Body (@{
  key = "REDIS_URL"
  value = $redisUrl
  is_preview = $false
  is_literal = $false
} | ConvertTo-Json) | Out-Null

Write-Host "Redeploying web (web + worker run in same container)..."
$deployWeb = Invoke-RestMethod -Method Get -Uri "$base/deploy?uuid=$webUuid&force=true" -Headers $headers
Write-Host ($deployWeb | ConvertTo-Json -Compress)
