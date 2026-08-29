import type { ComputedRef, Ref } from 'vue'
import { computed, ref } from 'vue'
import { defineState } from '../../dist/runtime/app/composables/defineState'

const useCounter = defineState(() => {
  const count = ref(0)
  const double = computed(() => count.value * 2)

  function increment(step: number): void {
    count.value += step
  }

  return { count, double, increment }
})

const counter = useCounter()
const count: Ref<number> = counter.count
const double: ComputedRef<number> = counter.double
const increment: (step: number) => void = counter.increment

void count
void double
void increment

// @ts-expect-error generated state composables take no arguments
useCounter('key')

// @ts-expect-error async state factories are unsupported
defineState(async () => ({ count: ref(0) }))

// @ts-expect-error the built declaration must not expose the compiler-only key
defineState(() => ({ count: ref(0) }), 'manual-key')
