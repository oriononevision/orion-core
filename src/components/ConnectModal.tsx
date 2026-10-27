import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Check, Loader2, X } from 'lucide-react'
import { useCore } from '../context/CoreContext'
import ToolBadge from './ToolBadge'
import { authModeFor, googleToolIds, imapToolIds } from '../integrations/config'

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())
}

export default function ConnectModal() {
  const {
    connectModalTool: tool,
    openConnectModal,
    connectTool,
    connectPhase,
    syncProgress,
    connectError,
    canConnectLive,
    googleConfigured,
  } = useCore()
  const [busy, setBusy] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [imapHost, setImapHost] = useState('')
  const [confirmed, setConfirmed] = useState(false)
  const [localError, setLocalError] = useState<string | null>(null)

  const mode = tool ? authModeFor(tool.id) : null
  const isGoogle = tool ? googleToolIds.has(tool.id) : false
  const isImap = tool ? imapToolIds.has(tool.id) : false
  const isOauth = mode === 'oauth'
  const needsEmail = isGoogle || isImap

  useEffect(() => {
    setEmail('')
    setPassword('')
    setImapHost('')
    setConfirmed(false)
    setLocalError(null)
    setBusy(false)
  }, [tool?.id])

  async function onConfirmConnect() {
    if (!tool || busy) return
    setLocalError(null)

    if (needsEmail) {
      if (!isValidEmail(email)) {
        setLocalError('Indiquez une adresse e-mail valide.')
        return
      }
      if (!confirmed) {
        setLocalError('Cochez la confirmation pour continuer.')
        return
      }
    }

    if (isImap && !password.trim()) {
      setLocalError('Mot de passe d’application requis.')
      return
    }

    setBusy(true)
    try {
      await connectTool(tool.id, {
        emailHint: needsEmail ? email.trim() : undefined,
        password: isImap ? password.trim() : undefined,
        imapHost: tool.id === 'imap' ? imapHost.trim() || undefined : undefined,
        displayName: tool.name,
        productUrl: tool.domain ? `https://${tool.domain}` : undefined,
      })
    } finally {
      setBusy(false)
    }
  }

  const inFlight =
    connectPhase === 'authorizing' ||
    connectPhase === 'granted' ||
    connectPhase === 'syncing' ||
    connectPhase === 'done'

  const liveReady = tool ? canConnectLive(tool.id) : false

  return (
    <AnimatePresence>
      {tool ? (
        <motion.div
          className="modal-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => {
            if (!inFlight) openConnectModal(null)
          }}
        >
          <motion.div
            className="modal"
            role="dialog"
            aria-labelledby="connect-title"
            initial={{ opacity: 0, y: 16, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.97 }}
            onClick={(e) => e.stopPropagation()}
          >
            {!inFlight ? (
              <button
                type="button"
                className="modal__close"
                onClick={() => openConnectModal(null)}
                aria-label="Fermer"
              >
                <X size={16} />
              </button>
            ) : null}

            <div className="modal__head">
              <ToolBadge id={tool.id} size="lg" />
              <div>
                <p className="eyebrow">
                  {isOauth ? 'OAuth sécurisé' : isImap ? 'IMAP' : 'Connexion rapide'}
                </p>
                <h2 id="connect-title">
                  {needsEmail ? `Lier ${tool.name}` : `Connecter ${tool.name}`}
                </h2>
                <p className="modal__domain">{tool.domain}</p>
              </div>
            </div>

            {connectPhase === 'idle' || connectPhase === 'error' ? (
              <>
                {isGoogle ? (
                  <div className="gmail-connect">
                    <p className="modal__lead">
                      Entrez l’adresse Gmail, confirmez, puis validez une fois sur
                      Google. Core synchronise ensuite votre boîte pour les agents.
                    </p>

                    <label className="gmail-connect__field">
                      Adresse Gmail
                      <input
                        type="email"
                        autoComplete="email"
                        placeholder="prenom@gmail.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        disabled={busy}
                      />
                    </label>

                    <label className="gmail-connect__check">
                      <input
                        type="checkbox"
                        checked={confirmed}
                        onChange={(e) => setConfirmed(e.target.checked)}
                        disabled={busy}
                      />
                      <span>
                        Je confirme connecter{' '}
                        <strong>{email.trim() || 'cette adresse'}</strong> à ORION
                        Core.
                      </span>
                    </label>

                    {!googleConfigured || !liveReady ? (
                      <p className="mail-setup">
                        Setup Google manquant.{' '}
                        <Link to="/setup-google" onClick={() => openConnectModal(null)}>
                          Coller le Client ID
                        </Link>
                      </p>
                    ) : null}
                  </div>
                ) : isImap ? (
                  <div className="gmail-connect">
                    <p className="modal__lead">
                      Yahoo, iCloud ou boîte IMAP : utilisez un{' '}
                      <strong>mot de passe d’application</strong> (pas le mot de passe
                      principal). ORION vérifie le LOGIN IMAP via le bridge.
                    </p>

                    <label className="gmail-connect__field">
                      Adresse e-mail
                      <input
                        type="email"
                        autoComplete="email"
                        placeholder={
                          tool.id === 'yahoo'
                            ? 'prenom@yahoo.com'
                            : tool.id === 'icloud'
                              ? 'prenom@icloud.com'
                              : 'prenom@entreprise.com'
                        }
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        disabled={busy}
                      />
                    </label>

                    <label className="gmail-connect__field">
                      Mot de passe d’application
                      <input
                        type="password"
                        autoComplete="current-password"
                        placeholder="••••••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        disabled={busy}
                      />
                    </label>

                    {tool.id === 'imap' ? (
                      <label className="gmail-connect__field">
                        Serveur IMAP
                        <input
                          type="text"
                          placeholder="imap.votre-domaine.com"
                          value={imapHost}
                          onChange={(e) => setImapHost(e.target.value)}
                          disabled={busy}
                          spellCheck={false}
                        />
                      </label>
                    ) : null}

                    <label className="gmail-connect__check">
                      <input
                        type="checkbox"
                        checked={confirmed}
                        onChange={(e) => setConfirmed(e.target.checked)}
                        disabled={busy}
                      />
                      <span>
                        Je confirme lier <strong>{email.trim() || 'cette adresse'}</strong>{' '}
                        à ORION Core.
                      </span>
                    </label>
                  </div>
                ) : (
                  <div className="gmail-connect">
                    <p className="modal__lead">{tool.description}</p>
                    {liveReady ? (
                      <p className="modal__note">
                        Autorisation OAuth via le bridge ORION. Après validation chez{' '}
                        {tool.name}, vous revenez ici avec le compte connecté.
                      </p>
                    ) : (
                      <p className="modal__note">
                        {tool.name} n’est pas encore branché nativement (OAuth serveur).
                        Ajoutez-le à votre espace — l’équipe Orion finalise l’activation.
                        Aucune clé technique à coller de votre côté.
                      </p>
                    )}
                  </div>
                )}

                {localError ? <p className="mail-list__error">{localError}</p> : null}
                {connectError ? <p className="mail-list__error">{connectError}</p> : null}

                <div className="modal__actions">
                  <button
                    type="button"
                    className="btn btn--ghost"
                    onClick={() => openConnectModal(null)}
                  >
                    Annuler
                  </button>
                  <button
                    type="button"
                    className="btn btn--white"
                    disabled={(isGoogle && !liveReady) || busy}
                    onClick={() => void onConfirmConnect()}
                  >
                    {busy
                      ? isOauth && liveReady
                        ? 'Redirection…'
                        : isOauth && !liveReady
                          ? 'Ajout…'
                          : 'Connexion…'
                      : needsEmail
                        ? 'Confirmer et connecter'
                        : isOauth && !liveReady
                          ? 'Ajouter à mon espace'
                          : `Autoriser ${tool.name}`}
                  </button>
                </div>
              </>
            ) : (
              <div className="connect-flow">
                <ol className="connect-steps">
                  <li className={stepClass(connectPhase, 'authorizing')}>
                    <StepIcon phase={connectPhase} step="authorizing" />
                    {isGoogle
                      ? `Confirmation Google${email ? ` · ${email}` : ''}`
                      : isOauth
                        ? `Autorisation ${tool.name}`
                        : `Lien compte${email ? ` · ${email}` : ''}`}
                  </li>
                  <li className={stepClass(connectPhase, 'granted')}>
                    <StepIcon phase={connectPhase} step="granted" />
                    Compte autorisé
                  </li>
                  <li className={stepClass(connectPhase, 'syncing')}>
                    <StepIcon phase={connectPhase} step="syncing" />
                    {isImap ? 'Vérification IMAP' : 'Synchronisation'}
                  </li>
                  <li className={stepClass(connectPhase, 'done')}>
                    <StepIcon phase={connectPhase} step="done" />
                    Prêt pour les agents
                  </li>
                </ol>
                <div className="connect-progress">
                  <div className="connect-progress__track">
                    <div
                      className="connect-progress__bar"
                      style={{ width: `${syncProgress}%` }}
                    />
                  </div>
                  <span>{syncProgress}%</span>
                </div>
              </div>
            )}
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}

function stepClass(phase: string, step: string) {
  const order = ['authorizing', 'granted', 'syncing', 'done']
  const pi = order.indexOf(phase)
  const si = order.indexOf(step)
  if (phase === 'done' || pi > si) return 'is-done'
  if (pi === si) return 'is-current'
  return ''
}

function StepIcon({ phase, step }: { phase: string; step: string }) {
  const order = ['authorizing', 'granted', 'syncing', 'done']
  const pi = order.indexOf(phase)
  const si = order.indexOf(step)
  if (phase === 'done' || pi > si) return <Check size={14} />
  if (pi === si) return <Loader2 size={14} className="spin" />
  return <span className="connect-steps__dot" />
}
