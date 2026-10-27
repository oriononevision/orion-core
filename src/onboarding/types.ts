export type OnboardingGoalId =
  | 'mail'
  | 'projects'
  | 'tools'
  | 'agents'
  | 'kpi'

export type DesignModeId =
  | 'balanced'
  | 'mail_focus'
  | 'ops'
  | 'agents'
  | 'commercial'
  | 'minimal'

export type OnboardingProfile = {
  version: 1
  completed: boolean
  completedAt?: string
  goals: OnboardingGoalId[]
  toolIds: string[]
  designMode: DesignModeId | null
}

export type OnboardingGoal = {
  id: OnboardingGoalId
  label: string
  description: string
}

export type DesignMode = {
  id: DesignModeId
  label: string
  tagline: string
  description: string
  /** Mini preview blocks: col span 1-4 in a 4-col mock */
  preview: { w: 1 | 2 | 3 | 4; h: 1 | 2; tone: 'mail' | 'stats' | 'agents' | 'tools' | 'projects' | 'activity' }[]
}
