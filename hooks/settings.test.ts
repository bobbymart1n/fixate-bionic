import { test, expect } from 'claude-code/testing'

import { DEFAULTS, describe, resolve, sanitize } from './settings'

test('defaults come from the spec table', () => {
  expect(DEFAULTS).toEqual({ fixation: 3, saccade: 1, minWordLength: 1, headings: false })
})

test('/config strings are coerced, invalid ones fall back to defaults', () => {
  expect(resolve({ fixation: '5', saccade: '9', headings: true })).toEqual({
    ...DEFAULTS,
    fixation: 5,
    headings: true,
  })
})

test('invalid stored overrides are dropped, not trusted', () => {
  expect(sanitize({ fixation: 0, saccade: 'x', minWordLength: 2.5, old: 1 })).toEqual({})
  expect(sanitize(null)).toEqual({})
  expect(sanitize('junk')).toEqual({})
})

test('later layers win', () => {
  expect(resolve({ fixation: '2' }, { fixation: 4 }).fixation).toBe(4)
})

test('describe summarises every setting', () => {
  expect(describe({ ...DEFAULTS, saccade: 2 }, true)).toBe(
    'Bionic reading on · fixation 3 (40%) · saccade every 2nd word · minWordLength 1 · headings off',
  )
})
