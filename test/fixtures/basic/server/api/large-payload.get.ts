const content = `NUXT_STATE_LARGE_PAYLOAD:${'x'.repeat(16 * 1024)}`

export default defineEventHandler(() => ({ content }))
