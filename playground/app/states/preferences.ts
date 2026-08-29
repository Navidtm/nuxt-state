export const usePreferences = defineState(() => {
  const darkMode = ref(false)

  return { darkMode }
})

export const useLocale = defineState(() => {
  const locale = ref('en')

  return { locale }
})
