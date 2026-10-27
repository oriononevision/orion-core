/** AES-GCM encrypt/decrypt for OAuth tokens at rest. */

function b64encode(bytes: Uint8Array): string {
  let s = ''
  for (const b of bytes) s += String.fromCharCode(b)
  return btoa(s)
}

function b64decode(s: string): Uint8Array {
  const bin = atob(s)
  const out = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i)
  return out
}

async function getKey(): Promise<CryptoKey> {
  const raw = Deno.env.get('CONNECTIONS_ENCRYPTION_KEY')?.trim()
  if (!raw) throw new Error('CONNECTIONS_ENCRYPTION_KEY manquant')
  // Accept base64 32-byte key or derive from passphrase via SHA-256
  let keyBytes: Uint8Array
  try {
    const decoded = b64decode(raw)
    keyBytes = decoded.length === 32 ? decoded : new Uint8Array(await crypto.subtle.digest('SHA-256', decoded))
  } catch {
    keyBytes = new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(raw)))
  }
  return crypto.subtle.importKey('raw', keyBytes, 'AES-GCM', false, ['encrypt', 'decrypt'])
}

export async function encryptSecret(plain: string | null | undefined): Promise<string | null> {
  if (!plain) return null
  const key = await getKey()
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const cipher = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    new TextEncoder().encode(plain),
  )
  return `v1:${b64encode(iv)}:${b64encode(new Uint8Array(cipher))}`
}

export async function decryptSecret(payload: string | null | undefined): Promise<string | null> {
  if (!payload) return null
  if (!payload.startsWith('v1:')) return payload
  const [, ivB64, dataB64] = payload.split(':')
  const key = await getKey()
  const plain = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: b64decode(ivB64) },
    key,
    b64decode(dataB64),
  )
  return new TextDecoder().decode(plain)
}
