// Parsing for the /bionic command. Setting names, aliases and ranges come
// from SETTINGS, so a new setting is picked up here without changes.

import { SETTINGS, SETTING_KEYS, coerce, valueRange } from './settings'
import type { SettingKey } from './settings'

const ACTIONS = {
  on: 'turn bionic reading on',
  off: 'turn bionic reading off',
  status: 'show current settings',
  reset: 'drop /bionic changes, back to /config values',
  help: 'show this help',
} as const

type Action = keyof typeof ACTIONS

export type Command =
  | { kind: 'toggle' }
  | { kind: Action }
  | { kind: 'set'; key: SettingKey; value: number | boolean }
  | { kind: 'error'; message: string }

/** Setting key for a typed name or alias, case-insensitive. */
function findSetting(name: string): SettingKey | undefined {
  return SETTING_KEYS.find(
    key =>
      key.toLowerCase() === name ||
      (SETTINGS[key].aliases as readonly string[]).includes(name),
  )
}

export function parseCommand(args: string): Command {
  const [name = '', value] = args.trim().toLowerCase().split(/\s+/)
  if (name === '') return { kind: 'toggle' }
  if (name in ACTIONS) return { kind: name as Action }

  const key = findSetting(name)
  if (!key) return { kind: 'error', message: `Unknown setting "${name}".` }

  const parsed = coerce(key, value)
  if (parsed === undefined) {
    return { kind: 'error', message: `${key} takes ${valueRange(key)}.` }
  }
  return { kind: 'set', key, value: parsed }
}

function row(usage: string, help: string): string {
  return `/bionic ${usage}`.padEnd(30) + help
}

export const HELP = [
  row('', 'toggle on/off'),
  ...Object.entries(ACTIONS).map(([action, help]) => row(action, help)),
  ...SETTING_KEYS.map(key => {
    const name = SETTINGS[key].aliases[0] ?? key
    return row(`${name} ${valueRange(key)}`, SETTINGS[key].help)
  }),
].join('\n')
