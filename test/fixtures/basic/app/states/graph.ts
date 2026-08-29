interface Cycle {
  value: string
  self?: Cycle
}

export const useGraphState = defineState(() => {
  const shared = { value: 1 }
  const cycle: Cycle = { value: 'client' }
  cycle.self = cycle

  const graph = reactive({
    a: shared,
    b: shared,
    cycle,
    createdAt: new Date('2000-01-01T00:00:00.000Z'),
    tags: new Set(['client']),
    values: new Map([['client', 0]]),
    items: [1, 2, 3],
    obsolete: true as boolean | undefined,
  })

  return { graph }
})
