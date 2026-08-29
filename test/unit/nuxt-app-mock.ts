let currentNuxtApp: object = {}

export function setCurrentNuxtApp(nuxtApp: object): void {
  currentNuxtApp = nuxtApp
}

export function useNuxtApp(): object {
  return currentNuxtApp
}
