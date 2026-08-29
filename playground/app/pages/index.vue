<script setup lang="ts">
const { status, startSession } = useSession()
const { darkMode } = usePreferences()
const { locale } = useLocale()
</script>

<template>
  <main :class="{ dark: darkMode }">
    <div class="shell">
      <header>
        <p class="kicker">nuxt-state / experimental prototype</p>
        <h1>One factory.<br /><em>One Nuxt app.</em></h1>
        <p class="lede">
          The two counter cards call the same zero-argument composable. Their refs retain normal Vue
          semantics while sharing exact state identity.
        </p>
      </header>

      <div class="grid">
        <CounterControls />
        <CounterMirror />
        <UserExample />
      </div>

      <aside class="proofs">
        <div>
          <span class="eyebrow">Nested auto-import</span>
          <strong>Session: {{ status }}</strong>
          <button
            type="button"
            @click="startSession"
          >
            Start session
          </button>
        </div>
        <div>
          <span class="eyebrow">Two states, one file</span>
          <strong>Locale: {{ locale }}</strong>
          <button
            type="button"
            @click="locale = locale === 'en' ? 'fr' : 'en'"
          >
            Toggle locale
          </button>
        </div>
        <div>
          <span class="eyebrow">Plain ref</span>
          <strong>Theme: {{ darkMode ? 'dark' : 'light' }}</strong>
          <button
            type="button"
            @click="darkMode = !darkMode"
          >
            Toggle theme
          </button>
        </div>
      </aside>
    </div>
  </main>
</template>

<style>
:root {
  color: #18221c;
  background: #e8eee9;
  font-family: Inter, ui-sans-serif, system-ui, sans-serif;
}

* {
  box-sizing: border-box;
}
body {
  margin: 0;
}
button {
  font: inherit;
}

main {
  min-height: 100vh;
  padding: 64px 24px;
  background:
    radial-gradient(circle at 90% 10%, rgba(51, 209, 122, 0.22), transparent 30%), #edf2ee;
  transition:
    color 0.2s,
    background 0.2s;
}

main.dark {
  color: #eef8f1;
  background: #101713;
}
.shell {
  width: min(1040px, 100%);
  margin: 0 auto;
}
header {
  max-width: 760px;
  margin-bottom: 40px;
}
.kicker,
.eyebrow {
  color: #168a50;
  font-size: 0.75rem;
  font-weight: 800;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}
h1 {
  margin: 12px 0 20px;
  font-family: Georgia, serif;
  font-size: clamp(3rem, 9vw, 6.5rem);
  font-weight: 400;
  letter-spacing: -0.06em;
  line-height: 0.86;
}
h1 em {
  color: #18a65c;
  font-weight: 400;
}
.lede {
  max-width: 660px;
  color: #56635a;
  font-size: 1.15rem;
  line-height: 1.65;
}
.dark .lede {
  color: #aebbb2;
}
.grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 18px;
}
.card,
.proofs {
  border: 1px solid rgba(26, 55, 37, 0.14);
  border-radius: 22px;
  background: rgba(255, 255, 255, 0.75);
  box-shadow: 0 18px 45px rgba(27, 58, 39, 0.07);
}
.dark .card,
.dark .proofs {
  border-color: rgba(255, 255, 255, 0.1);
  background: rgba(25, 35, 29, 0.9);
}
.card {
  min-height: 270px;
  padding: 28px;
}
.card--accent {
  background: #d6f5e2;
}
.dark .card--accent {
  background: #173d28;
}
.card--wide {
  grid-column: 1 / -1;
  min-height: auto;
}
.card h2 {
  margin: 8px 0;
  font-family: Georgia, serif;
  font-size: 1.75rem;
}
.metric {
  margin: 22px 0 0;
  color: #139251;
  font-family: Georgia, serif;
  font-size: 5rem;
  line-height: 1;
}
button {
  padding: 10px 14px;
  border: 0;
  border-radius: 999px;
  color: white;
  background: #172b20;
  cursor: pointer;
}
button:hover {
  background: #168a50;
}
button:disabled {
  cursor: default;
  opacity: 0.55;
}
.proofs {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1px;
  margin-top: 18px;
  overflow: hidden;
}
.proofs > div {
  display: grid;
  gap: 14px;
  padding: 24px;
  background: inherit;
}
.proofs strong {
  font-family: Georgia, serif;
  font-size: 1.25rem;
}

@media (max-width: 700px) {
  main {
    padding: 40px 16px;
  }
  .grid,
  .proofs {
    grid-template-columns: 1fr;
  }
  .card--wide {
    grid-column: auto;
  }
}
</style>
