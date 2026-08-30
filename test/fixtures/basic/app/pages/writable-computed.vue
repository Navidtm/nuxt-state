<script setup lang="ts">
const state = useWritableName()
const setterCallsAfterMount = ref('pending')
const valuesBeforeSetter = ref('pending')

if (import.meta.server) {
  state.firstName.value = 'Server'
  state.lastName.value = 'User'
}

onMounted(() => {
  setterCallsAfterMount.value = String(state.getSetterCalls())
  valuesBeforeSetter.value = state.getValuesBeforeSetter().join(',')
})
</script>

<template>
  <main>
    <output id="writable-first">{{ state.firstName }}</output>
    <output id="writable-last">{{ state.lastName }}</output>
    <output id="writable-full">{{ state.fullName }}</output>
    <output id="writable-setter-calls">{{ setterCallsAfterMount }}</output>
    <output id="writable-before-setter">{{ valuesBeforeSetter }}</output>
  </main>
</template>
