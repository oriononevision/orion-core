# Configure Stripe Connect OAuth for ORION Core (Supabase Edge secrets).
# Usage:
#   $env:SUPABASE_ACCESS_TOKEN = "sbp_…"
#   .\scripts\set-stripe-oauth.ps1 -ClientId "ca_…" -SecretKey "sk_test_…"
#
# Dashboard Stripe (test) :
#   https://dashboard.stripe.com/test/settings/connect/onboarding-options/oauth
# Callback à coller dans « Redirect URIs » :
#   https://mebudscarxhtwfihtopl.supabase.co/functions/v1/oauth-callback

param(
  [Parameter(Mandatory = $true)][string]$ClientId,
  [Parameter(Mandatory = $true)][string]$SecretKey,
  [string]$ProjectRef = "mebudscarxhtwfihtopl"
)

if (-not $env:SUPABASE_ACCESS_TOKEN) {
  Write-Error "Définis SUPABASE_ACCESS_TOKEN (Account → Access Tokens Supabase)."
  exit 1
}

if ($ClientId -notmatch '^ca_') {
  Write-Warning "Un Client ID Connect commence en général par ca_"
}
if ($SecretKey -notmatch '^sk_(test|live)_') {
  Write-Warning "La clé secrète Stripe commence en général par sk_test_ ou sk_live_"
}

npx supabase secrets set `
  "STRIPE_CLIENT_ID=$ClientId" `
  "STRIPE_SECRET_KEY=$SecretKey" `
  --project-ref $ProjectRef

npx supabase functions deploy oauth-start oauth-callback connections-list --project-ref $ProjectRef

Write-Host ""
Write-Host "OK. Vérifie dans Core → Connexions → Stripe → Autoriser Stripe."
Write-Host "Callback Stripe :"
Write-Host "  https://$ProjectRef.supabase.co/functions/v1/oauth-callback"
