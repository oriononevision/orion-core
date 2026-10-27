import { HUB_LAYOUT_KEY, saveHubLayout } from '../hub/layoutStore'
import { buildLayoutFromDesign } from './designModes'
import type { DesignModeId, OnboardingGoalId, OnboardingProfile } from './types'

export const ONBOARDING_KEY = 'orion.onboarding.v1'

export function emptyOnboardingProfile(): OnboardingProfile {
  return {
    version: 1,
    completed: false,
    goals: [],
    toolIds: [],
    designMode: null,
  }
}

export function loadOnboardingProfile(): OnboardingProfile {
  if (typeof window === 'undefined') return emptyOnboardingProfile()

  try {
    const raw = localStorage.getItem(ONBOARDING_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as OnboardingProfile
      if (parsed?.version === 1) {
        return {
          ...emptyOnboardingProfile(),
          ...parsed,
          goals: Array.isArray(parsed.goals) ? parsed.goals : [],
          toolIds: Array.isArray(parsed.toolIds) ? parsed.toolIds : [],
        }
      }
    }
  } catch {
    /* ignore */
  }

  return emptyOnboardingProfile()
}

export function saveOnboardingProfile(profile: OnboardingProfile): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(ONBOARDING_KEY, JSON.stringify(profile))
}

export function isOnboardingComplete(): boolean {
  return loadOnboardingProfile().completed
}

export function completeOnboarding(input: {
  goals: OnboardingGoalId[]
  toolIds: string[]
  designMode: DesignModeId
}): OnboardingProfile {
  const profile: OnboardingProfile = {
    version: 1,
    completed: true,
    completedAt: new Date().toISOString(),
    goals: input.goals,
    toolIds: input.toolIds,
    designMode: input.designMode,
  }
  saveOnboardingProfile(profile)
  saveHubLayout(buildLayoutFromDesign(input.designMode, input.toolIds))
  return profile
}

export function resetOnboarding(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(ONBOARDING_KEY)
  localStorage.removeItem(HUB_LAYOUT_KEY)
}
