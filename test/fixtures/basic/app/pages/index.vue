<script setup lang="ts">
const counter = useFixtureCounter()
counter.increment()

const session = useFixtureSession()
const first = useFixtureFirst()
const second = useFixtureSecond()
</script>

<template>
  <div id="auto-imports">
    {{ counter.count }}:{{ counter.double }}:{{ session.source }}:{{ first.name }}:{{ second.name }}
  </div>
</template>
