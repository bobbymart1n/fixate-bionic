// Wiring: the /bionic command, persisted settings, and the AssistantMessage
// render hook. The logic lives in transform.ts, settings.ts and command.ts.

import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register } from 'claude-code'

import type { Settings } from '../types'
import { HELP, parseCommand } from './command'
import { describe, resolve, sanitize } from './settings'
import { createCachedTransform } from './transform'

const STORE_IS_ON = 'isOn'
const STORE_OVERRIDES = 'overrides'

const isOn = atom({ plugin: 'bionic-reading', key: 'isOn' } as const, true)
// Settings changed with /bionic, layered over the /config values.
const overrides = atom({ plugin: 'bionic-reading', key: 'overrides' } as const, {}, {
  shape: 'overrides-1',
})

/** /config values, then /bionic overrides on top. */
async function currentSettings($: EngineInterface, configured: Settings): Promise<Settings> {
  return resolve(configured, await read($, overrides))
}

export const register: Register = (on, options) => {
  const configured = resolve(options)
  const transform = createCachedTransform()

  on('session.start', async ($, e, next) => {
    const savedIsOn = await $.store.get(STORE_IS_ON)
    if (typeof savedIsOn === 'boolean') await update($, isOn, () => savedIsOn)
    // Stored values may come from an older version: keep only valid ones.
    const savedOverrides = sanitize(await $.store.get(STORE_OVERRIDES))
    await update($, overrides, () => savedOverrides)

    await $.command.register({
      name: 'bionic',
      description: 'Bionic reading: toggle, or tune fixation / saccade / min / headings',
      argumentHint: '[on|off|status|reset|help|<setting> <value>]',
    })
    return next(e)
  })

  on('command.run', { command: 'bionic' }, async ($, e) => {
    const command = parseCommand(e.args)
    switch (command.kind) {
      case 'error':
        return { text: `${command.message}\n\n${HELP}` }
      case 'help':
        return { text: HELP }
      case 'toggle':
      case 'on':
      case 'off': {
        const now = command.kind === 'toggle' ? !(await read($, isOn)) : command.kind === 'on'
        await update($, isOn, () => now)
        await $.store.set(STORE_IS_ON, now)
        break
      }
      case 'reset':
        await update($, overrides, () => ({}))
        await $.store.delete(STORE_OVERRIDES)
        break
      case 'set': {
        const saved = await update($, overrides, o => ({ ...o, [command.key]: command.value }))
        await $.store.set(STORE_OVERRIDES, saved)
        break
      }
      case 'status':
        break
    }
    return { text: describe(await currentSettings($, configured), await read($, isOn)) }
  })

  on('ui.render', { component: 'AssistantMessage' }, async ($, e, next) => {
    if (!(await read($, isOn))) return next(e)
    const text = transform(e.props.text, await currentSettings($, configured))
    return next({ ...e, props: { ...e.props, text } })
  })
}
