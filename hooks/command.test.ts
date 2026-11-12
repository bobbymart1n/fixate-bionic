import { test, expect } from 'claude-code/testing'

import { HELP, parseCommand } from './command'

test('no args toggles; actions are recognised', () => {
  expect(parseCommand('')).toEqual({ kind: 'toggle' })
  expect(parseCommand(' Status ')).toEqual({ kind: 'status' })
  expect(parseCommand('reset')).toEqual({ kind: 'reset' })
})

test('settings by name or alias', () => {
  expect(parseCommand('fixation 4')).toEqual({ kind: 'set', key: 'fixation', value: 4 })
  expect(parseCommand('min 3')).toEqual({ kind: 'set', key: 'minWordLength', value: 3 })
  expect(parseCommand('headings on')).toEqual({ kind: 'set', key: 'headings', value: true })
})

test('bad input is an error naming the valid range', () => {
  expect(parseCommand('saccade 7')).toEqual({ kind: 'error', message: 'saccade takes 1-4.' })
  expect(parseCommand('fixation')).toEqual({ kind: 'error', message: 'fixation takes 1-5.' })
  expect(parseCommand('bogus 1').kind).toBe('error')
})

test('help lists every setting', () => {
  for (const name of ['fix 1-5', 'every 1-4', 'min 1-5', 'headings on|off']) {
    expect(HELP).toContain(name)
  }
})
