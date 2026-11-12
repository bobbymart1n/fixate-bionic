// Every setting is described once, in SETTINGS. Defaults, validation, the
// /bionic command, its help text and the status line all derive from it.
// Adding a setting: add it to `Settings` in types/index.d.ts, add a spec
// here, and (to show it in /config) add a `userConfig` field to plugin.json.

import type { Settings } from '../types'

type NumberSpec = {
  kind: 'number'
  default: number
  min: number
  max: number
  aliases: readonly string[]
  help: string
  format?: (value: number) => string
}

type ToggleSpec = {
  kind: 'toggle'
  default: boolean
  aliases: readonly string[]
  help: string
}

type Spec = NumberSpec | ToggleSpec

/** Share of each word in bold, indexed by fixation level 1–5. */
export const FIXATION_RATIOS = [0.2, 0.3, 0.4, 0.5, 0.6] as const

/** The bold share for a fixation level, clamped to the levels that exist. */
export function fixationRatio(level: number): number {
  const index = Math.min(Math.max(Math.round(level), 1), FIXATION_RATIOS.length) - 1
  return FIXATION_RATIOS[index]!
}

export const SETTINGS = {
  fixation: {
    kind: 'number',
    default: 3,
    min: 1,
    max: FIXATION_RATIOS.length,
    aliases: ['fix'],
    help: 'how much of each word is bold (20%-60%)',
    format: level => `${level} (${Math.round(fixationRatio(level) * 100)}%)`,
  },
  saccade: {
    kind: 'number',
    default: 1,
    min: 1,
    max: 4,
    aliases: ['every'],
    help: 'bold every Nth word',
    format: n => (n === 1 ? 'every word' : `every ${ordinal(n)} word`),
  },
  minWordLength: {
    kind: 'number',
    default: 1,
    min: 1,
    max: 5,
    aliases: ['min'],
    help: 'leave words shorter than this plain',
  },
  headings: {
    kind: 'toggle',
    default: false,
    aliases: [],
    help: 'also bold word starts in headings',
  },
} as const satisfies { [K in keyof Settings]: Spec }

export type SettingKey = keyof Settings

export const SETTING_KEYS = Object.keys(SETTINGS) as SettingKey[]

export const DEFAULTS = Object.fromEntries(
  SETTING_KEYS.map(key => [key, SETTINGS[key].default]),
) as Settings

function ordinal(n: number): string {
  const suffix = n % 100 >= 11 && n % 100 <= 13 ? 'th' : ['th', 'st', 'nd', 'rd'][n % 10] ?? 'th'
  return `${n}${suffix}`
}

/**
 * Turn a raw value (a /config string, a stored value, a typed argument) into a
 * valid value for `key`, or `undefined` when it is not one.
 */
export function coerce(key: SettingKey, raw: unknown): number | boolean | undefined {
  const spec: Spec = SETTINGS[key]
  if (spec.kind === 'toggle') {
    if (typeof raw === 'boolean') return raw
    if (raw === 'on' || raw === 'true') return true
    if (raw === 'off' || raw === 'false') return false
    return undefined
  }
  const n = typeof raw === 'number' ? raw : typeof raw === 'string' && raw !== '' ? Number(raw) : NaN
  return Number.isInteger(n) && n >= spec.min && n <= spec.max ? n : undefined
}

/** What `coerce` accepts for `key`, for error and help text. */
export function valueRange(key: SettingKey): string {
  const spec: Spec = SETTINGS[key]
  return spec.kind === 'toggle' ? 'on|off' : `${spec.min}-${spec.max}`
}

/** Keep only the valid settings in `raw`; anything unknown or invalid is dropped. */
export function sanitize(raw: unknown): Partial<Settings> {
  if (raw === null || typeof raw !== 'object') return {}
  const source = raw as Record<string, unknown>
  const valid: Record<string, number | boolean> = {}
  for (const key of SETTING_KEYS) {
    const value = coerce(key, source[key])
    if (value !== undefined) valid[key] = value
  }
  return valid as Partial<Settings>
}

/** Complete settings: defaults, then each layer in order (later wins). */
export function resolve(...layers: unknown[]): Settings {
  return Object.assign({}, DEFAULTS, ...layers.map(sanitize))
}

/** One-line summary, e.g. "Bionic reading on · fixation 3 (40%) · ...". */
export function describe(settings: Settings, isOn: boolean): string {
  const parts = SETTING_KEYS.map(key => {
    const spec: Spec = SETTINGS[key]
    const value = settings[key]
    if (spec.kind === 'toggle') return `${key} ${value ? 'on' : 'off'}`
    return `${key} ${spec.format ? spec.format(value as number) : value}`
  })
  return [`Bionic reading ${isOn ? 'on' : 'off'}`, ...parts].join(' · ')
}
