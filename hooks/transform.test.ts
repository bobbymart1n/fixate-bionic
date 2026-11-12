import { test, expect } from 'claude-code/testing'

import { DEFAULTS } from './settings'
import { createCachedTransform, toBionicMarkdown } from './transform'

const with_ = (changes: object) => ({ ...DEFAULTS, ...changes })

test('bolds word starts at the default fixation', () => {
  expect(toBionicMarkdown('Security first means zero')).toBe(
    '**Secu**rity **fi**rst **me**ans **ze**ro',
  )
})

test('leaves code, links and existing emphasis alone', () => {
  const md = 'Run `npm test` and see [docs](https://x.io/a) or **done** _now_'
  expect(toBionicMarkdown(md)).toBe(
    '**R**un `npm test` **a**nd **s**ee [**do**cs](https://x.io/a) **o**r **done** _now_',
  )
})

test('leaves bare URLs, HTML and identifiers alone', () => {
  expect(toBionicMarkdown('go https://a.io/path <br> snake_case x2')).toBe(
    '**g**o https://a.io/path <br> snake_case x2',
  )
})

test('skips fenced and indented code', () => {
  expect(toBionicMarkdown('```\nconst word = 1\n```\n    indented\nHello')).toBe(
    '```\nconst word = 1\n```\n    indented\n**He**llo',
  )
})

test('handles accented and non-Latin words whole', () => {
  expect(toBionicMarkdown('café naïve Привет')).toBe('**ca**fé **na**ïve **При**вет')
})

test('fixation changes how much is bold', () => {
  expect(toBionicMarkdown('Security', with_({ fixation: 1 }))).toBe('**Se**curity')
  expect(toBionicMarkdown('Security', with_({ fixation: 5 }))).toBe('**Secur**ity')
})

test('saccade bolds every Nth eligible word across lines', () => {
  expect(toBionicMarkdown('one two\nthree four', with_({ saccade: 2 }))).toBe(
    '**o**ne two\n**th**ree four',
  )
})

test('minWordLength skips short words without counting them', () => {
  expect(toBionicMarkdown('a cat sat', with_({ minWordLength: 3, saccade: 2 }))).toBe(
    'a **c**at sat',
  )
})

test('headings skipped unless enabled', () => {
  expect(toBionicMarkdown('## Title')).toBe('## Title')
  expect(toBionicMarkdown('## Title', with_({ headings: true }))).toBe('## **Ti**tle')
})

test('cached transform matches and is keyed by settings', () => {
  const transform = createCachedTransform(2)
  expect(transform('Hello', DEFAULTS)).toBe('**He**llo')
  expect(transform('Hello', DEFAULTS)).toBe('**He**llo')
  expect(transform('Hello', with_({ fixation: 5 }))).toBe('**Hel**lo')
  expect(transform('World', DEFAULTS)).toBe('**Wo**rld')
})

test('a word continuing a protected span is left alone', () => {
  expect(toBionicMarkdown('**ca**fé and **Пр**ивет now')).toBe(
    '**ca**fé **a**nd **Пр**ивет **n**ow',
  )
})

test('words touching stray emphasis characters are left alone', () => {
  expect(toBionicMarkdown('a*b and x~y and word**')).toBe('a*b **a**nd x~y **a**nd word**')
  expect(toBionicMarkdown('pre**bold** end')).toBe('pre**bold** **e**nd')
})

test('dotted names are left alone, sentence periods are not', () => {
  expect(toBionicMarkdown('Edit transform.ts and plugin.json. Then visit example.com today.')).toBe(
    '**Ed**it transform.ts **a**nd plugin.json. **Th**en **vi**sit example.com **to**day.',
  )
  expect(toBionicMarkdown('[transform.ts](/a/transform.ts) works')).toBe(
    '[transform.ts](/a/transform.ts) **wo**rks',
  )
})
