<script setup lang="ts">
const navigation = useNavigationState()
const once = useOnceState()

if (import.meta.server) navigation.count.value = 10
await once.initializeForNavigation()
</script>

<template>
  <main>
    <output id="navigation-count">{{ navigation.count.value }}</output>
    <output id="navigation-path">{{ navigation.path.value }}</output>
    <output id="navigation-once">{{ once.runs.value }}</output>
    <button
      id="navigation-add"
      type="button"
      @click="navigation.addTen"
    >
      Add
    </button>
    <button
      id="navigation-next"
      type="button"
      @click="navigation.go('/navigation-b')"
    >
      Next
    </button>
  </main>
</template>
