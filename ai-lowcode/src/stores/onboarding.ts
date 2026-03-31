import { defineStore } from 'pinia'
import { ref } from 'vue'

const STORAGE_KEY = 'ai-lowcode-onboarding'

interface OnboardingState {
  completed: boolean
  dismissed: boolean
}

const defaultState = (): OnboardingState => ({
  completed: false,
  dismissed: false
})

const readState = (): OnboardingState => {
  if (typeof window === 'undefined') {
    return defaultState()
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      return defaultState()
    }

    return {
      ...defaultState(),
      ...JSON.parse(raw)
    }
  } catch (error) {
    console.warn('Failed to read onboarding state:', error)
    return defaultState()
  }
}

const writeState = (state: OnboardingState) => {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

export const useOnboardingStore = defineStore('onboarding', () => {
  const visible = ref(false)
  const currentStep = ref(0)
  const completed = ref(false)
  const dismissed = ref(false)

  const syncState = () => {
    writeState({
      completed: completed.value,
      dismissed: dismissed.value
    })
  }

  const initialize = () => {
    const state = readState()
    completed.value = state.completed
    dismissed.value = state.dismissed

    if (!completed.value && !dismissed.value) {
      open()
    }
  }

  const open = (step = 0) => {
    currentStep.value = step
    visible.value = true
  }

  const close = () => {
    visible.value = false
  }

  const dismiss = () => {
    dismissed.value = true
    syncState()
    close()
  }

  const complete = () => {
    completed.value = true
    dismissed.value = false
    syncState()
    close()
  }

  const goToStep = (step: number) => {
    currentStep.value = Math.max(0, step)
  }

  return {
    visible,
    currentStep,
    completed,
    dismissed,
    initialize,
    open,
    close,
    dismiss,
    complete,
    goToStep
  }
})
