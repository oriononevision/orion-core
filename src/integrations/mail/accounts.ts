/** Comptes mail multi-providers (Gmail OAuth + Outlook + IMAP générique). */

export type MailProviderId = 'gmail' | 'outlook' | 'yahoo' | 'icloud' | 'imap'

export type MailAccount = {
  id: string
  provider: MailProviderId
  email: string
  label: string
  imapHost?: string
  imapPort?: number
  connectedAt: string
  status: 'connected' | 'pending_sync' | 'error'
  note?: string
}

const LS_KEY = 'orion_mail_accounts_v1'

export function listMailAccounts(): MailAccount[] {
  try {
    const raw = localStorage.getItem(LS_KEY)
    if (!raw) return []
    return JSON.parse(raw) as MailAccount[]
  } catch {
    return []
  }
}

export function saveMailAccount(account: MailAccount) {
  const all = listMailAccounts().filter((a) => a.id !== account.id)
  all.push(account)
  localStorage.setItem(LS_KEY, JSON.stringify(all))
  window.dispatchEvent(new Event('orion-mail-accounts'))
}

export function removeMailAccount(id: string) {
  const all = listMailAccounts().filter((a) => a.id !== id)
  localStorage.setItem(LS_KEY, JSON.stringify(all))
  window.dispatchEvent(new Event('orion-mail-accounts'))
}

export function removeMailAccountsByProvider(provider: MailProviderId) {
  const all = listMailAccounts().filter((a) => a.provider !== provider)
  localStorage.setItem(LS_KEY, JSON.stringify(all))
  window.dispatchEvent(new Event('orion-mail-accounts'))
}

const PRESETS: Record<
  MailProviderId,
  { host: string; port: number; label: string }
> = {
  gmail: { host: 'imap.gmail.com', port: 993, label: 'Gmail' },
  outlook: { host: 'outlook.office365.com', port: 993, label: 'Outlook / Microsoft 365' },
  yahoo: { host: 'imap.mail.yahoo.com', port: 993, label: 'Yahoo Mail' },
  icloud: { host: 'imap.mail.me.com', port: 993, label: 'iCloud Mail' },
  imap: { host: '', port: 993, label: 'IMAP / Exchange' },
}

export function connectImapStyleAccount(input: {
  provider: Exclude<MailProviderId, 'gmail'>
  email: string
  imapHost?: string
  imapPort?: number
}): MailAccount {
  const email = input.email.trim().toLowerCase()
  const preset = PRESETS[input.provider]
  const account: MailAccount = {
    id: `${input.provider}-${email}`,
    provider: input.provider,
    email,
    label: preset.label,
    imapHost: input.imapHost?.trim() || preset.host || undefined,
    imapPort: input.imapPort || preset.port,
    connectedAt: new Date().toISOString(),
    status: 'pending_sync',
    note:
      input.provider === 'outlook'
        ? 'Compte enregistré. Sync Microsoft Graph dès Client ID configuré, sinon via bridge IMAP.'
        : 'Compte enregistré. Sync IMAP via le bridge Orion (le navigateur ne parle pas IMAP seul).',
  }
  saveMailAccount(account)
  return account
}

export const mailToolIds = new Set<string>([
  'gmail',
  'outlook',
  'yahoo',
  'icloud',
  'imap',
])
