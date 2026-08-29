import { isReactive, isReadonly, isRef, toRaw } from 'vue'

interface RefSnapshot {
  type: 'ref'
  value: unknown
}

interface ReactiveSnapshot {
  type: 'reactive'
  value: unknown
}

type StateSnapshotEntry = RefSnapshot | ReactiveSnapshot

export type StateSnapshot = Record<string, StateSnapshotEntry>

function isObjectLike(value: unknown): value is Record<string, unknown> {
  return (typeof value === 'object' && value !== null) || typeof value === 'function'
}

function unwrapReactive(value: unknown): unknown {
  return isReactive(value) ? toRaw(value) : value
}

export function snapshotState(state: unknown): StateSnapshot {
  const snapshot: StateSnapshot = {}

  if (!isObjectLike(state)) return snapshot

  for (const [name, value] of Object.entries(state)) {
    if (isRef(value) && !isReadonly(value)) {
      snapshot[name] = {
        type: 'ref',
        value: unwrapReactive(value.value),
      }
    } else if (isReactive(value) && !isReadonly(value)) {
      snapshot[name] = {
        type: 'reactive',
        value: toRaw(value),
      }
    }
  }

  return snapshot
}

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  return Object.prototype.toString.call(value) === '[object Object]'
}

function canPatch(target: unknown, source: unknown): boolean {
  return (
    (Array.isArray(target) && Array.isArray(source)) ||
    (isPlainRecord(target) && isPlainRecord(source))
  )
}

function patchValue(target: unknown, source: unknown): void {
  if (Array.isArray(target) && Array.isArray(source)) {
    for (let index = 0; index < source.length; index++) {
      if (canPatch(target[index], source[index])) {
        patchValue(target[index], source[index])
      } else {
        target[index] = source[index]
      }
    }
    target.length = source.length
    return
  }

  if (!isPlainRecord(target) || !isPlainRecord(source)) return

  for (const key of Object.keys(target)) {
    if (!(key in source)) delete target[key]
  }

  for (const [key, value] of Object.entries(source)) {
    if (canPatch(target[key], value)) {
      patchValue(target[key], value)
    } else {
      target[key] = value
    }
  }
}

function isStateSnapshotEntry(value: unknown): value is StateSnapshotEntry {
  return (
    isPlainRecord(value) &&
    (value.type === 'ref' || value.type === 'reactive') &&
    Object.hasOwn(value, 'value')
  )
}

export function restoreState(state: unknown, snapshot: unknown): void {
  if (!isObjectLike(state) || !isPlainRecord(snapshot)) return

  for (const [name, entry] of Object.entries(snapshot)) {
    if (!isStateSnapshotEntry(entry)) continue

    const target = state[name]

    if (entry.type === 'ref' && isRef(target) && !isReadonly(target)) {
      target.value = entry.value
    } else if (entry.type === 'reactive' && isReactive(target) && !isReadonly(target)) {
      patchValue(target, entry.value)
    }
  }
}
