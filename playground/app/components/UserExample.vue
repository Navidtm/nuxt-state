<script setup lang="ts">
const { user, label, login } = useUser()
</script>

<template>
  <section class="card card--wide">
    <span class="eyebrow">reactive() example</span>
    <h2>{{ label }}</h2>
    <p>
      Authentication: <strong>{{ user.authenticated ? 'active' : 'anonymous' }}</strong>
    </p>
    <button
      type="button"
      :disabled="user.authenticated"
      @click="login"
    >
      {{ user.authenticated ? 'Signed in' : 'Sign in as Nuxt User' }}
    </button>
  </section>
</template>
