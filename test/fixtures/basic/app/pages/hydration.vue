<script setup lang="ts">
const counter = useHydrationCounter()
const account = useHydrationUser()

if (import.meta.server) {
  counter.count.value = 41
  account.user.name = 'Server User'
  account.user.authenticated = true
}
</script>

<template>
  <main>
    <output id="count">{{ counter.count }}</output>
    <output id="double">{{ counter.double }}</output>
    <output id="user-name">{{ account.user.name }}</output>
    <output id="authenticated">{{ account.user.authenticated }}</output>
    <output id="label">{{ account.label }}</output>
    <button
      id="increment"
      type="button"
      @click="counter.increment"
    >
      Increment
    </button>
    <button
      id="login"
      type="button"
      @click="account.login('Client Update')"
    >
      Update user
    </button>
  </main>
</template>
