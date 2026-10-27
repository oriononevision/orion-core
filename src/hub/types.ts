export type HubWindowType =
  | 'stats'
  | 'mail_priorities'
  | 'agents'
  | 'tools'
  | 'projects'
  | 'activity'
  | 'notes'
  | 'chart_placeholder'
  | 'widget_placeholder'

export type HubColSpan = 3 | 4 | 6 | 8 | 12
export type HubHeight = 'sm' | 'md' | 'lg' | 'xl'

export type HubWindowConfig = {
  id: string
  type: HubWindowType
  /** Largeur sur grille 12 colonnes */
  w: HubColSpan
  h: HubHeight
  /** Titre personnalisé (sinon libellé catalogue) */
  title?: string
  /** Connecteurs liés à cette fenêtre */
  connectorIds: string[]
  /** Masquer la fenêtre sans la supprimer */
  hidden?: boolean
}

export type HubLayout = {
  version: 1
  windows: HubWindowConfig[]
}

export type HubWindowCatalogItem = {
  type: HubWindowType
  label: string
  description: string
  defaultW: HubColSpan
  defaultH: HubHeight
  /** Connecteurs suggérés à l’ajout */
  suggestedConnectors?: string[]
  /** Fonctionnalité à venir (contenu placeholder) */
  comingSoon?: boolean
  maxInstances?: number
}
