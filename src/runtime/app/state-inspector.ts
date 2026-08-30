import { isReactive, isReadonly, isRef, isShallow, toRaw } from 'vue'
import { getStateRegistry } from './state-registry'

export interface StateInspectorMember {
  name: string
  kind: string
  value: unknown
}

export interface StateInspectorEntry {
  key: string
  name: string
  source?: string
  origin?: string
  hydration: 'Hydrated' | 'Client-only' | 'Server'
  members: StateInspectorMember[]
}

interface PreviewContext {
  seen: WeakMap<object, number>
  nodes: number
  truncated: boolean
}

const MAX_DEPTH = 4
const MAX_ITEMS = 40
const MAX_NODES = 200
const MAX_STRING = 500

export function inspectActiveStates(nuxtApp: object): StateInspectorEntry[] {
  const entries: StateInspectorEntry[] = []

  for (const [key, entry] of getStateRegistry(nuxtApp).active) {
    if (!entry.debug) continue

    const state = entry.debug.state
    const members = isObjectLike(state)
      ? Object.entries(state).map(([name, value]) => ({
          name,
          kind: classifyStateMember(value),
          value: previewValue(isRef(value) ? value.value : value),
        }))
      : [{ name: 'value', kind: classifyStateMember(state), value: previewValue(state) }]

    entries.push({
      key,
      name: entry.debug.name || `State ${key}`,
      source: entry.debug.source,
      origin: entry.debug.origin,
      hydration: entry.debug.hydration,
      members,
    })
  }

  return entries
}

export function classifyStateMember(value: unknown): string {
  if (typeof value === 'function') return 'function'
  if (isRef(value)) {
    if (isReadonly(value)) return 'readonly ref'
    return isShallow(value) ? 'shallowRef' : 'ref'
  }
  if (isReactive(value)) {
    if (isReadonly(value)) return 'readonly'
    return isShallow(value) ? 'shallowReactive' : 'reactive'
  }
  if (isReadonly(value)) return 'readonly'
  return 'other'
}

export function previewValue(value: unknown): unknown {
  const context: PreviewContext = { seen: new WeakMap(), nodes: 0, truncated: false }
  const preview = visit(value, 0, context)

  return context.truncated ? { preview, truncated: true } : preview
}

function visit(value: unknown, depth: number, context: PreviewContext): unknown {
  if (typeof value === 'string') {
    if (value.length <= MAX_STRING) return value
    context.truncated = true
    return `${value.slice(0, MAX_STRING)}…`
  }
  if (value === null || ['number', 'boolean', 'undefined'].includes(typeof value)) return value
  if (typeof value === 'bigint') return `${value}n`
  if (typeof value === 'symbol') return value.toString()
  if (typeof value === 'function') return `ƒ ${value.name || 'anonymous'}()`
  if (typeof value !== 'object') return String(value)

  const raw = isReactive(value) || isReadonly(value) ? toRaw(value) : value
  const known = context.seen.get(raw)
  if (known) return { reference: `#${known}` }

  const id = ++context.nodes
  context.seen.set(raw, id)
  if (context.nodes > MAX_NODES || depth >= MAX_DEPTH) {
    context.truncated = true
    return { id: `#${id}`, truncated: true }
  }

  if (raw instanceof Date) {
    return {
      id: `#${id}`,
      type: 'Date',
      value: Number.isNaN(raw.valueOf()) ? 'Invalid Date' : raw.toISOString(),
    }
  }
  if (raw instanceof Map) {
    const items = [...raw.entries()]
    if (items.length > MAX_ITEMS) context.truncated = true
    return {
      id: `#${id}`,
      type: 'Map',
      entries: items
        .slice(0, MAX_ITEMS)
        .map(([key, item]) => [visit(key, depth + 1, context), visit(item, depth + 1, context)]),
      ...(items.length > MAX_ITEMS ? { truncated: true, total: items.length } : {}),
    }
  }
  if (raw instanceof Set) {
    const items = [...raw]
    if (items.length > MAX_ITEMS) context.truncated = true
    return {
      id: `#${id}`,
      type: 'Set',
      values: items.slice(0, MAX_ITEMS).map((item) => visit(item, depth + 1, context)),
      ...(items.length > MAX_ITEMS ? { truncated: true, total: items.length } : {}),
    }
  }
  if (Array.isArray(raw)) {
    if (raw.length > MAX_ITEMS) context.truncated = true
    return {
      id: `#${id}`,
      type: 'Array',
      values: raw.slice(0, MAX_ITEMS).map((item) => visit(item, depth + 1, context)),
      ...(raw.length > MAX_ITEMS ? { truncated: true, total: raw.length } : {}),
    }
  }
  if (Object.getPrototypeOf(raw) !== Object.prototype && Object.getPrototypeOf(raw) !== null) {
    const constructor = (raw as { constructor?: { name?: string } }).constructor
    return { id: `#${id}`, unsupported: constructor?.name || 'Object' }
  }

  const properties = Object.entries(raw)
  if (properties.length > MAX_ITEMS) context.truncated = true
  return {
    id: `#${id}`,
    properties: Object.fromEntries(
      properties.slice(0, MAX_ITEMS).map(([key, item]) => [key, visit(item, depth + 1, context)]),
    ),
    ...(properties.length > MAX_ITEMS ? { truncated: true, total: properties.length } : {}),
  }
}

function isObjectLike(value: unknown): value is Record<string, unknown> {
  return (typeof value === 'object' && value !== null) || typeof value === 'function'
}
