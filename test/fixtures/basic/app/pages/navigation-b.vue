<script setup lang="ts">
const navigation = useNavigationState()
const lazy = useLazyNavigationState()
const once = useOnceState()
const remote = useRemoteData()
const showConsumer = ref(true)

await once.initializeForNavigation()
</script>

<template>
  <main>
    <output id="navigation-count">{{ navigation.count.value }}</output>
    <output id="navigation-path">{{ navigation.path.value }}</output>
    <output id="navigation-once">{{ once.runs.value }}</output>
    <output id="lazy-id">{{ lazy.creationId.value }}</output>
    <output id="lazy-count">{{ lazy.sharedCount.value }}</output>
    <output id="remote-navigation-request">{{ remote.data.value?.requestId }}</output>
    <button
      id="lazy-increment"
      type="button"
      @click="lazy.increment"
    >
      Increment lazy
    </button>
    <button
      id="toggle-consumer"
      type="button"
      @click="showConsumer = !showConsumer"
    >
      Toggle
    </button>
    <button
      id="navigation-back"
      type="button"
      @click="navigation.go('/navigation-a')"
    >
      Back
    </button>
    <StateMountConsumer v-if="showConsumer" />
  </main>
</template>
