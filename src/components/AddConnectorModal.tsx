import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  ArrowRight,
  Check,
  ChevronDown,
  Link2,
  MonitorSmartphone,
  Sparkles,
  X,
} from 'lucide-react'
import {
  createCustomConnector,
  createSessionConnector,
} from '../integrations/bridge'
import {
  SOFTWARE_CATALOG,
  detectFromUrl,
  faviconFor,
  guessDisplayName,
  normalizeProductUrl,
} from '../integrations/softwareCatalog'
import { upsertLocalSessionConnector } from '../integrations/sessionStore'
import { desktopApi, isOrionDesktop, sessionSlugFromUrl } from '../lib/desktop'
import { saveConnection } from '../lib/connectionStore'

type Props = {
  open: boolean
  onClose: () => void
  /** Connecteur custom créé (slug). */
  onCreated: (slug: string) => void
  /** Logiciel déjà supporté → ouvrir la connexion native. */
  onConnectKnown: (toolId: string) => void
}

export default function AddConnectorModal({
  open,
  onClose,
  onCreated,
  onConnectKnown,
}: Props) {
  const desktop = isOrionDesktop()
  const api = desktopApi()

  const [url, setUrl] = useState('')
  const [step, setStep] = useState<'link' | 'unknown' | 'session'>('link')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [advanced, setAdvanced] = useState(false)
  const [clientId, setClientId] = useState('')
  const [clientSecret, setClientSecret] = useState('')
  const [sessionSlug, setSessionSlug] = useState<string | null>(null)
  const [hint, setHint] = useState<string | null>(null)

  const hit = useMemo(() => detectFromUrl(url), [url])
  const previewName = hit?.name || guessDisplayName(url)
  const previewLogo = url.trim() ? faviconFor(url) : null

  function reset() {
    setUrl('')
    setStep('link')
    setBusy(false)
    setError(null)
    setAdvanced(false)
    setClientId('')
    setClientSecret('')
    setSessionSlug(null)
    setHint(null)
  }

  function close() {
    reset()
    onClose()
  }

  function onContinue() {
    setError(null)
    setHint(null)
    const raw = url.trim()
    if (!raw) {
      setError('Collez le lien du logiciel (ex. slack.com).')
      return
    }
    const known = detectFromUrl(raw)
    if (known) {
      close()
      onConnectKnown(known.id)
      return
    }
    // Desktop : connexion réelle via fenêtre + session
    if (desktop && api) {
      setStep('session')
      return
    }
    setStep('unknown')
  }

  async function onOpenLoginWindow() {
    if (!api) {
      setError('API Desktop indisponible.')
      return
    }
    setError(null)
    setBusy(true)
    try {
      const origin = normalizeProductUrl(url)
      const slug = sessionSlugFromUrl(origin, previewName)
      setSessionSlug(slug)
      await api.openSessionLogin({
        slug,
        url: origin,
        name: previewName || 'Logiciel',
      })
      setHint(
        'Connectez-vous avec votre compte dans la fenêtre Orion, puis cliquez sur « Enregistrer la connexion ».',
      )
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Impossible d’ouvrir la fenêtre')
    } finally {
      setBusy(false)
    }
  }

  async function onConfirmSession() {
    if (!api) {
      setError('API Desktop indisponible.')
      return
    }
    setError(null)
    setBusy(true)
    try {
      const origin = normalizeProductUrl(url)
      const slug = sessionSlug || sessionSlugFromUrl(origin, previewName)
      const inspection = await api.inspectSession({ slug, url: origin })

      if (!inspection.likelySignedIn && inspection.cookieCount < 1) {
        setError(
          'Aucune session détectée. Connectez-vous dans la fenêtre, puis réessayez.',
        )
        setBusy(false)
        return
      }

      const connectedAt = new Date().toISOString()
      const localRow = {
        slug,
        name: previewName || 'Nouveau logiciel',
        product_url: origin,
        logo_url: previewLogo,
        category: 'productivite',
        account_label: previewName || undefined,
        cookie_count: inspection.cookieCount,
        connected_at: connectedAt,
      }
      upsertLocalSessionConnector(localRow)
      saveConnection({
        id: slug,
        status: 'connected',
        accounts: 1,
        lastSync: 'Session Desktop',
        itemsSynced: inspection.cookieCount || 1,
        connectedAt,
        accountLabel: previewName || undefined,
      })

      try {
        await createSessionConnector({
          productUrl: origin,
          name: previewName || 'Nouveau logiciel',
          slug,
          category: 'productivite',
          accountLabel: previewName || undefined,
          cookieCount: inspection.cookieCount,
        })
      } catch {
        /* Edge pas encore déployée : la session locale Desktop suffit */
      }

      onCreated(slug)
      close()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Enregistrement impossible')
    } finally {
      setBusy(false)
    }
  }

  async function onAddSimple() {
    setError(null)
    setBusy(true)
    try {
      if (advanced && clientId.trim() && clientSecret.trim()) {
        const domain = guessDisplayName(url).toLowerCase() || 'app'
        const origin = normalizeProductUrl(url)
        let authorizeUrl = `${origin.replace(/\/$/, '')}/oauth/authorize`
        let tokenUrl = `${origin.replace(/\/$/, '')}/oauth/token`
        try {
          const u = new URL(origin)
          authorizeUrl = `${u.origin}/oauth/authorize`
          tokenUrl = `${u.origin}/oauth/token`
        } catch {
          /* keep */
        }
        const res = await createCustomConnector({
          productUrl: origin,
          name: previewName || domain,
          authorizeUrl,
          tokenUrl,
          clientId: clientId.trim(),
          clientSecret: clientSecret.trim(),
          scopes: '',
          category: 'productivite',
        })
        onCreated(res.connector.slug)
        close()
        return
      }

      const origin = normalizeProductUrl(url)
      const res = await createCustomConnector({
        productUrl: origin,
        name: previewName || 'Nouveau logiciel',
        authorizeUrl: 'https://orion.local/pending/authorize',
        tokenUrl: 'https://orion.local/pending/token',
        clientId: 'pending',
        clientSecret: `pending_${crypto.randomUUID()}`,
        scopes: '__orion_pending__',
        category: 'productivite',
      })
      onCreated(res.connector.slug)
      close()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Impossible d’ajouter ce logiciel')
    } finally {
      setBusy(false)
    }
  }

  function pickChip(domain: string) {
    setUrl(`https://${domain}`)
    setError(null)
    setHint(null)
    setStep('link')
  }

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="modal-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => {
            if (!busy) close()
          }}
        >
          <motion.div
            className="modal modal--add"
            role="dialog"
            aria-labelledby="add-connector-title"
            initial={{ opacity: 0, y: 18, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.97 }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="modal__close"
              onClick={close}
              aria-label="Fermer"
            >
              <X size={16} />
            </button>

            <div className="add-soft">
              <div className="add-soft__badge">
                {desktop ? <MonitorSmartphone size={16} /> : <Sparkles size={16} />}
              </div>
              <p className="eyebrow">
                {desktop ? 'ORION Desktop' : 'Connexion rapide'}
              </p>
              <h2 id="add-connector-title">Ajouter un logiciel</h2>
              <p className="add-soft__lead">
                {desktop
                  ? 'Collez le lien, connectez-vous avec votre compte dans Orion — la session est conservée.'
                  : 'Collez le lien — Orion détecte l’outil et lance la connexion. Aucune config technique pour les apps déjà supportées.'}
              </p>

              {step === 'link' ? (
                <>
                  <label className="add-soft__url">
                    <Link2 size={18} />
                    <input
                      type="url"
                      autoFocus
                      placeholder="https://slack.com  ou  notion.so"
                      value={url}
                      onChange={(e) => {
                        setUrl(e.target.value)
                        setError(null)
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') onContinue()
                      }}
                      disabled={busy}
                    />
                  </label>

                  {url.trim() && previewName ? (
                    <div className={`add-soft__detect${hit ? ' is-known' : ''}`}>
                      {previewLogo ? (
                        <img src={previewLogo} alt="" width={28} height={28} />
                      ) : null}
                      <div>
                        <strong>{previewName}</strong>
                        <span>
                          {hit
                            ? `Prêt à connecter · ${hit.blurb}`
                            : desktop
                              ? 'Connexion Desktop par session'
                              : 'Pas encore dans le catalogue Orion'}
                        </span>
                      </div>
                      {hit ? <Check size={16} className="add-soft__ok" /> : null}
                    </div>
                  ) : null}

                  <div className="add-soft__chips">
                    <span className="add-soft__chips-label">Exemples</span>
                    {SOFTWARE_CATALOG.slice(0, 8).map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        className="add-soft__chip"
                        onClick={() => pickChip(c.domain)}
                      >
                        {c.name}
                      </button>
                    ))}
                  </div>

                  {error ? <p className="mail-list__error">{error}</p> : null}

                  <div className="modal__actions add-soft__actions">
                    <button type="button" className="btn btn--ghost" onClick={close}>
                      Annuler
                    </button>
                    <button
                      type="button"
                      className="btn btn--white"
                      onClick={onContinue}
                      disabled={busy || !url.trim()}
                    >
                      {hit ? 'Connecter' : 'Continuer'}
                      <ArrowRight size={16} />
                    </button>
                  </div>
                </>
              ) : null}

              {step === 'session' ? (
                <>
                  <div className="add-soft__detect is-known">
                    {previewLogo ? (
                      <img src={previewLogo} alt="" width={28} height={28} />
                    ) : null}
                    <div>
                      <strong>{previewName || 'Nouveau logiciel'}</strong>
                      <span>{normalizeProductUrl(url)}</span>
                    </div>
                  </div>

                  <p className="add-soft__lead add-soft__lead--sm">
                    Orion ouvre le site dans une fenêtre sécurisée. Connectez-vous
                    avec votre e-mail / mot de passe (ou SSO) — la session reste
                    liée à ce logiciel.
                  </p>

                  {hint ? <p className="add-soft__hint">{hint}</p> : null}
                  {error ? <p className="mail-list__error">{error}</p> : null}

                  <div className="modal__actions add-soft__actions">
                    <button
                      type="button"
                      className="btn btn--ghost"
                      onClick={() => {
                        setStep('link')
                        setHint(null)
                        setError(null)
                      }}
                      disabled={busy}
                    >
                      Retour
                    </button>
                    <button
                      type="button"
                      className="btn btn--ghost"
                      onClick={() => void onOpenLoginWindow()}
                      disabled={busy}
                    >
                      {busy ? 'Ouverture…' : 'Ouvrir la connexion'}
                    </button>
                    <button
                      type="button"
                      className="btn btn--white"
                      onClick={() => void onConfirmSession()}
                      disabled={busy}
                    >
                      Enregistrer la connexion
                      <Check size={16} />
                    </button>
                  </div>
                </>
              ) : null}

              {step === 'unknown' ? (
                <>
                  <div className="add-soft__detect">
                    {previewLogo ? (
                      <img src={previewLogo} alt="" width={28} height={28} />
                    ) : null}
                    <div>
                      <strong>{previewName || 'Nouveau logiciel'}</strong>
                      <span>{normalizeProductUrl(url)}</span>
                    </div>
                  </div>

                  <p className="add-soft__lead add-soft__lead--sm">
                    Ce logiciel n’est pas encore branché nativement. Ajoutez-le à
                    votre espace — l’équipe Orion finalise l’activation, ou votre
                    IT branche les clés en un clic.
                  </p>

                  <button
                    type="button"
                    className="add-soft__advanced-toggle"
                    onClick={() => setAdvanced((v) => !v)}
                  >
                    <ChevronDown
                      size={16}
                      style={{
                        transform: advanced ? 'rotate(180deg)' : undefined,
                        transition: 'transform 0.2s ease',
                      }}
                    />
                    Mon IT a déjà les clés OAuth
                  </button>

                  {advanced ? (
                    <div className="add-soft__advanced">
                      <label className="gmail-connect__field">
                        Client ID
                        <input
                          type="text"
                          value={clientId}
                          onChange={(e) => setClientId(e.target.value)}
                          disabled={busy}
                          spellCheck={false}
                          autoComplete="off"
                        />
                      </label>
                      <label className="gmail-connect__field">
                        Client Secret
                        <input
                          type="password"
                          value={clientSecret}
                          onChange={(e) => setClientSecret(e.target.value)}
                          disabled={busy}
                          autoComplete="off"
                        />
                      </label>
                      <p className="add-soft__hint">
                        Callback à coller chez l’éditeur&nbsp;:
                        mebudscarxhtwfihtopl.supabase.co/functions/v1/oauth-callback
                      </p>
                    </div>
                  ) : null}

                  {error ? <p className="mail-list__error">{error}</p> : null}

                  <div className="modal__actions add-soft__actions">
                    <button
                      type="button"
                      className="btn btn--ghost"
                      onClick={() => setStep('link')}
                      disabled={busy}
                    >
                      Retour
                    </button>
                    <button
                      type="button"
                      className="btn btn--white"
                      onClick={() => void onAddSimple()}
                      disabled={busy}
                    >
                      {busy
                        ? 'Ajout…'
                        : advanced && clientId && clientSecret
                          ? 'Enregistrer et connecter'
                          : 'Ajouter à mon espace'}
                      <ArrowRight size={16} />
                    </button>
                  </div>
                </>
              ) : null}
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}
