<script setup lang="ts">
const state = useDevtoolsActiveState()
const lazyCalls = useState('nuxt-state-devtools-lazy-calls', () => 0)

if (import.meta.server) {
  state.count.value = 4
}
</script>

<template>
  <main>
    <output id="devtools-count">{{ state.count }}</output>
    <output id="devtools-lazy-calls">{{ lazyCalls }}</output>
    <button
      id="devtools-increment"
      @click="state.increment"
    >
      Increment
    </button>
    <NuxtLink
      id="devtools-navigation"
      to="/devtools-lazy"
      >Navigate</NuxtLink
    >
  </main>
</template>
