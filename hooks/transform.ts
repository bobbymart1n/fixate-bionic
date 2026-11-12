// Bionic reading for markdown: bold the leading part of each word.
//
// Works line by line. Code blocks (fenced or indented) and, unless enabled,
// headings are left as written. Within a line, PROTECTED spans (code, URLs,
// HTML, existing emphasis) are copied through untouched; the text between
// them has its words emphasised.

import type { Settings } from '../types'
import { DEFAULTS, fixationRatio } from './settings'

/** Spans copied through untouched, each a regex source. */
const PROTECTED_PARTS = [
  /(`+)[\s\S]*?\1/, //                          inline code: `x`, ``x``
  /\]\([^)]*\)/, //                             a link's target: ](https://…)
  /<[^>\n]+>/, //                               HTML tags and <autolinks>
  /https?:\/\/\S+/, //                          bare URLs
  /\*\*[^*\n]+\*\*/, //                         **bold**
  /__[^_\n]+__/, //                             __bold__
  /(?<![\w*])\*[^*\s][^*\n]*\*(?!\*)/, //       *italic*
  /(?<!\w)_[^_\s][^_\n]*_(?!\w)/, //            _italic_
  /[\p{L}\p{N}_-]+(?:\.[\p{L}\p{N}_-]+)+/u, //  dotted names: transform.ts, example.com
].map(part => part.source)

const PROTECTED = new RegExp(PROTECTED_PARTS.join('|'), 'gu')

/**
 * A run of letters (any script) not joined to other letters, digits, or to a
 * markdown emphasis character. A word touching `*`, `_` or `~` is skipped:
 * adding "**" next to one makes a run like "***" or "****" that can break the
 * emphasis of the whole reply.
 */
const WORD = /(?<![\p{L}\p{M}\p{N}_*~])\p{L}[\p{L}\p{M}]*(?![\p{L}\p{M}\p{N}_*~])/gu

const EMPHASIS_MARKER = /[*_~]/

const FENCE = /^\s*(`{3,}|~{3,})/
const INDENTED_CODE = /^( {4}|\t)/
const HEADING = /^\s{0,3}#{1,6}\s/

/** How many characters of a word of `length` to bold. Short words get one. */
export function boldLength(length: number, fixation: number): number {
  if (length <= 3) return 1
  return Math.min(length, Math.ceil(length * fixationRatio(fixation)))
}

export function toBionicMarkdown(text: string, settings: Settings = DEFAULTS): string {
  const { fixation, saccade, minWordLength, headings } = settings
  let eligibleWords = 0 // counted across the whole text, so saccade spans lines

  // A chunk sits between protected spans. A word touching a span's emphasis
  // marker ("**ca**fé", "pre**bold**") is skipped: bolding it would put "****"
  // in the text, which can break the emphasis of the whole reply.
  const emphasiseWords = (chunk: string, afterSpan: boolean, beforeSpan: boolean) =>
    chunk.replace(WORD, (word, offset: number) => {
      if (afterSpan && offset === 0) return word
      if (beforeSpan && offset + word.length === chunk.length) return word
      const chars = Array.from(word) // code points, so astral letters stay whole
      if (chars.length < minWordLength) return word
      if (eligibleWords++ % saccade !== 0) return word
      const n = boldLength(chars.length, fixation)
      return `**${chars.slice(0, n).join('')}**${chars.slice(n).join('')}`
    })

  const emphasiseLine = (line: string) => {
    let out = ''
    let last = 0
    let afterMarker = false // the previous span ended with an emphasis marker
    for (const match of line.matchAll(PROTECTED)) {
      const beforeMarker = EMPHASIS_MARKER.test(match[0][0]!)
      out += emphasiseWords(line.slice(last, match.index), afterMarker, beforeMarker) + match[0]
      last = match.index! + match[0].length
      afterMarker = EMPHASIS_MARKER.test(match[0].at(-1)!)
    }
    return out + emphasiseWords(line.slice(last), afterMarker, false)
  }

  let openFence: string | null = null
  return text
    .split('\n')
    .map(line => {
      const fence = FENCE.exec(line)?.[1]
      if (openFence) {
        const closes = fence && fence[0] === openFence[0] && fence.length >= openFence.length
        if (closes) openFence = null
        return line
      }
      if (fence) {
        openFence = fence
        return line
      }
      if (INDENTED_CODE.test(line)) return line
      if (!headings && HEADING.test(line)) return line
      return emphasiseLine(line)
    })
    .join('\n')
}

/**
 * `toBionicMarkdown` with a small cache: a message is drawn many times (each
 * streamed flush, each scroll), and its text rarely changes between draws.
 */
export function createCachedTransform(limit = 200) {
  const cache = new Map<string, string>()
  return (text: string, settings: Settings): string => {
    const key = `${JSON.stringify(settings)}\u0000${text}`
    const hit = cache.get(key)
    if (hit !== undefined) {
      cache.delete(key) // re-insert to mark as most recently used
      cache.set(key, hit)
      return hit
    }
    const result = toBionicMarkdown(text, settings)
    cache.set(key, result)
    if (cache.size > limit) cache.delete(cache.keys().next().value!)
    return result
  }
}
