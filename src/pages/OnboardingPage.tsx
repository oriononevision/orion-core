import { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Layers,
  Sparkles,
  Target,
  Workflow,
} from 'lucide-react'
import { OrionLogo } from '../components/OrionLogo'
import ToolBadge from '../components/ToolBadge'
import { categoryLabels, tools } from '../data/tools'
import { designModes, suggestDesignMode } from '../onboarding/designModes'
import { onboardingGoals } from '../onboarding/goals'
import { completeOnboarding } from '../onboarding/store'
import type { DesignModeId, OnboardingGoalId } from '../onboarding/types'

const ease = [0.22, 1, 0.36, 1] as const
const steps = ['Bienvenue', 'Objectifs', 'Logiciels', 'Design', 'Prêt'] as const

export default function OnboardingPage() {
  const [step, setStep] = useState(0)
  const [goals, setGoals] = useState<OnboardingGoalId[]>([])
  const [toolIds, setToolIds] = useState<string[]>(['gmail', 'calendar', 'drive'])
  const [designMode, setDesignMode] = useState<DesignModeId | null>(null)
  const [categoryFilter, setCategoryFilter] = useState<string | 'all'>('all')

  const suggested = useMemo(() => suggestDesignMode(goals), [goals])
  const activeDesign = designMode ?? suggested

  const filteredTools = tools.filter(
    (t) => categoryFilter === 'all' || t.category === categoryFilter,
  )

  const categories = useMemo(
    () => Array.from(new Set(tools.map((t) => t.category))),
    [],
  )

  const canNext =
    step === 0 ||
    (step === 1 && goals.length > 0) ||
    (step === 2 && toolIds.length > 0) ||
    step === 3 ||
    step === 4

  const toggleGoal = (id: OnboardingGoalId) => {
    setGoals((prev) =>
      prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id],
    )
  }

  const toggleTool = (id: string) => {
    setToolIds((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id],
    )
  }

  const finish = () => {
    completeOnboarding({
      goals,
      toolIds,
      designMode: activeDesign,
    })
    window.location.assign('/')
  }

  const progress = ((step + 1) / steps.length) * 100

  return (
    <div className="onboard">
      <div className="onboard__bg" aria-hidden="true">
        <img src="/images/hero-cosmic-bg.jpg" alt="" />
        <div className="onboard__veil" />
      </div>

      <header className="onboard__top">
        <div className="onboard__brand">
          <OrionLogo markSize={22} />
          <span className="onboard__brand-sub">Configuration</span>
        </div>
        <div className="onboard__progress" aria-label={`Étape ${step + 1} sur ${steps.length}`}>
          <div className="onboard__progress-track">
            <motion.i
              className="onboard__progress-fill"
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.45, ease }}
            />
          </div>
          <ol className="onboard__steps">
            {steps.map((label, i) => (
              <li
                key={label}
                className={i === step ? 'is-active' : i < step ? 'is-done' : ''}
              >
                {label}
              </li>
            ))}
          </ol>
        </div>
      </header>

      <main className={`onboard__main${step === 0 ? ' onboard__main--hero' : ''}`}>
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            className="onboard__panel"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.4, ease }}
          >
            {step === 0 ? (
              <section className="onboard__welcome">
                <div className="onboard__welcome-copy">
                  <p className="onboard__kicker">
                    <Sparkles size={14} /> Étape 1 — Bienvenue
                  </p>
                  <h1>
                    Construisons
                    <br />
                    <em>votre Hub</em>
                  </h1>
                  <p className="onboard__lead">
                    Un espace vide, puis un design calé sur vos outils et votre
                    façon de travailler.
                  </p>
                  <ul className="onboard__pillars">
                    <li>
                      <Target size={16} />
                      <span>Objectifs clairs</span>
                    </li>
                    <li>
                      <Workflow size={16} />
                      <span>Logiciels branchés</span>
                    </li>
                    <li>
                      <Layers size={16} />
                      <span>Modèle de Hub</span>
                    </li>
                  </ul>
                </div>

                <motion.div
                  className="onboard__stage"
                  aria-hidden
                  initial={{ opacity: 0, scale: 0.96, x: 24 }}
                  animate={{ opacity: 1, scale: 1, x: 0 }}
                  transition={{ duration: 0.7, ease, delay: 0.1 }}
                >
                  <div className="onboard__stage-frame">
                    <div className="onboard__stage-bar">
                      <i />
                      <i />
                      <i />
                      <span>ORION Hub</span>
                    </div>
                    <div className="onboard__stage-grid">
                      <div className="onboard__tile onboard__tile--wide">
                        <em>Priorités</em>
                        <b />
                        <b />
                      </div>
                      <div className="onboard__tile">
                        <em>Agents</em>
                        <span className="onboard__pulse" />
                      </div>
                      <div className="onboard__tile">
                        <em>Outils</em>
                        <div className="onboard__dots">
                          <i />
                          <i />
                          <i />
                        </div>
                      </div>
                      <div className="onboard__tile onboard__tile--wide">
                        <em>Projets</em>
                        <div className="onboard__bars">
                          <i style={{ width: '72%' }} />
                          <i style={{ width: '48%' }} />
                          <i style={{ width: '61%' }} />
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="onboard__orbit" />
                </motion.div>
              </section>
            ) : null}

            {step === 1 ? (
              <section>
                <p className="onboard__kicker">Étape 2 — Objectifs</p>
                <h1>Que voulez-vous accomplir&nbsp;?</h1>
                <p className="onboard__lead">
                  Un ou plusieurs objectifs — on orientera le design du Hub.
                </p>
                <div className="onboard__cards">
                  {onboardingGoals.map((g) => {
                    const on = goals.includes(g.id)
                    return (
                      <button
                        key={g.id}
                        type="button"
                        className={`onboard__card${on ? ' is-on' : ''}`}
                        onClick={() => toggleGoal(g.id)}
                      >
                        <span className="onboard__check" aria-hidden>
                          {on ? <Check size={14} /> : null}
                        </span>
                        <strong>{g.label}</strong>
                        <span>{g.description}</span>
                      </button>
                    )
                  })}
                </div>
              </section>
            ) : null}

            {step === 2 ? (
              <section>
                <p className="onboard__kicker">Étape 3 — Logiciels</p>
                <h1>Quels logiciels utilisez-vous&nbsp;?</h1>
                <p className="onboard__lead">
                  Cochez ceux à afficher dans ORION. La connexion se fera ensuite.
                </p>
                <div className="onboard__filters">
                  <button
                    type="button"
                    className={categoryFilter === 'all' ? 'is-active' : ''}
                    onClick={() => setCategoryFilter('all')}
                  >
                    Tous
                  </button>
                  {categories.map((c) => (
                    <button
                      key={c}
                      type="button"
                      className={categoryFilter === c ? 'is-active' : ''}
                      onClick={() => setCategoryFilter(c)}
                    >
                      {categoryLabels[c]}
                    </button>
                  ))}
                </div>
                <div className="onboard__tools">
                  {filteredTools.map((t) => {
                    const on = toolIds.includes(t.id)
                    return (
                      <button
                        key={t.id}
                        type="button"
                        className={`onboard__tool${on ? ' is-on' : ''}`}
                        onClick={() => toggleTool(t.id)}
                      >
                        <ToolBadge id={t.id} />
                        <span>
                          <strong>{t.name}</strong>
                          <em>{t.description}</em>
                        </span>
                        <span className="onboard__check" aria-hidden>
                          {on ? <Check size={14} /> : null}
                        </span>
                      </button>
                    )
                  })}
                </div>
                <p className="onboard__count">
                  {toolIds.length} logiciel{toolIds.length > 1 ? 's' : ''} sélectionné
                  {toolIds.length > 1 ? 's' : ''}
                </p>
              </section>
            ) : null}

            {step === 3 ? (
              <section>
                <p className="onboard__kicker">Étape 4 — Design</p>
                <h1>Comment voulez-vous votre Hub&nbsp;?</h1>
                <p className="onboard__lead">
                  Un mode de base — personnalisable ensuite.
                  {!designMode ? (
                    <>
                      {' '}
                      <span className="onboard__suggest">
                        Suggéré&nbsp;: {designModes.find((d) => d.id === suggested)?.label}
                      </span>
                    </>
                  ) : null}
                </p>
                <div className="onboard__designs">
                  {designModes.map((mode) => {
                    const on = activeDesign === mode.id
                    return (
                      <button
                        key={mode.id}
                        type="button"
                        className={`onboard__design${on ? ' is-on' : ''}`}
                        onClick={() => setDesignMode(mode.id)}
                      >
                        <div className="onboard__preview" aria-hidden>
                          {mode.preview.map((block, i) => (
                            <span
                              key={i}
                              className={`onboard__preview-block onboard__preview-block--${block.tone}`}
                              style={{
                                gridColumn: `span ${block.w}`,
                                gridRow: `span ${block.h}`,
                              }}
                            />
                          ))}
                        </div>
                        <div className="onboard__design-meta">
                          <strong>{mode.label}</strong>
                          <em>{mode.tagline}</em>
                          <span>{mode.description}</span>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </section>
            ) : null}

            {step === 4 ? (
              <section className="onboard__ready">
                <p className="onboard__kicker">Étape 5 — Prêt</p>
                <h1>Votre Hub est prêt</h1>
                <p className="onboard__lead">
                  Mode{' '}
                  <strong>
                    {designModes.find((d) => d.id === activeDesign)?.label}
                  </strong>{' '}
                  · {toolIds.length} logiciel
                  {toolIds.length > 1 ? 's' : ''}
                </p>
                <div className="onboard__summary">
                  <div>
                    <h3>Objectifs</h3>
                    <ul>
                      {goals.map((id) => (
                        <li key={id}>
                          {onboardingGoals.find((g) => g.id === id)?.label}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h3>Logiciels</h3>
                    <div className="onboard__summary-tools">
                      {toolIds.slice(0, 8).map((id) => (
                        <ToolBadge key={id} id={id} size="sm" />
                      ))}
                      {toolIds.length > 8 ? (
                        <span className="muted">+{toolIds.length - 8}</span>
                      ) : null}
                    </div>
                  </div>
                  <div>
                    <h3>Design</h3>
                    <p>
                      {designModes.find((d) => d.id === activeDesign)?.tagline}
                    </p>
                  </div>
                </div>
                <p className="muted onboard__hint">
                  Ensuite : connectez vos comptes, puis affinez l’affichage.
                </p>
              </section>
            ) : null}
          </motion.div>
        </AnimatePresence>
      </main>

      <footer className="onboard__foot">
        <button
          type="button"
          className="onboard__nav onboard__nav--ghost"
          disabled={step === 0}
          onClick={() => setStep((s) => Math.max(0, s - 1))}
        >
          <ArrowLeft size={16} /> Retour
        </button>
        {step < steps.length - 1 ? (
          <button
            type="button"
            className="onboard__nav onboard__nav--primary"
            disabled={!canNext}
            onClick={() => {
              if (step === 1 && !designMode) setDesignMode(suggested)
              setStep((s) => s + 1)
            }}
          >
            Continuer <ArrowRight size={16} />
          </button>
        ) : (
          <button
            type="button"
            className="onboard__nav onboard__nav--primary"
            onClick={finish}
          >
            Lancer mon Hub <ArrowRight size={16} />
          </button>
        )}
      </footer>
    </div>
  )
}
