export type Settings = {
  /** 1–5: share of each word that is bold, 20% to 60% */
  fixation: number
  /** Bold every Nth word, 1–4 */
  saccade: number
  /** Words shorter than this stay plain */
  minWordLength: number
  /** Also process markdown headings */
  headings: boolean
}

declare module 'claude-code' {
  interface PluginState {
    'fixate-bionic': { isOn: boolean; overrides: Shaped<Partial<Settings>> }
  }
}
