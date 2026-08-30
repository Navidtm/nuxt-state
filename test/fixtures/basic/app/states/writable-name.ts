export const useWritableName = defineState(() => {
  const firstName = ref('John')
  const lastName = ref('Doe')
  let setterCalls = 0
  const valuesBeforeSetter: string[] = []

  const fullName = computed({
    get() {
      return `${firstName.value} ${lastName.value}`
    },
    set(value: string) {
      setterCalls++
      valuesBeforeSetter.push(`${firstName.value}|${lastName.value}`)

      const [first = '', last = ''] = value.split(' ')
      firstName.value = first
      lastName.value = last
    },
  })

  return {
    firstName,
    lastName,
    fullName,
    getSetterCalls: () => setterCalls,
    getValuesBeforeSetter: () => valuesBeforeSetter,
  }
})
