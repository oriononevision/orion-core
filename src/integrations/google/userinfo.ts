export type GoogleProfile = {
  email: string
  name: string
  picture?: string
}

export async function fetchGoogleProfile(accessToken: string): Promise<GoogleProfile> {
  const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  if (!res.ok) throw new Error('Impossible de récupérer le profil Google')
  const data = (await res.json()) as { email?: string; name?: string; picture?: string }
  if (!data.email) throw new Error('Profil Google sans e-mail')
  return {
    email: data.email,
    name: data.name || data.email,
    picture: data.picture,
  }
}
