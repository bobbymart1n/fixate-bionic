# Bionic Reading for Claude Code

A Claude Code plugin that shows Claude's replies in a bionic-reading style: the
first part of each word is bold, so your eyes can skim from word to word.

> **Secu**rity **fi**rst **me**ans **ze**ro **th**ird-**pa**rty **depen**dencies.

Only the display changes. The stored conversation, and what Claude reads, stay
plain text. Code blocks, inline code, link targets, URLs, file names and
existing bold or italic text are left as written.

## Install

At the prompt of a Claude Code session in a terminal:

```
/plugin install bionic-reading --marketplace bobbymart1n/claude-bionic-reading
```

From a shell:

```
claude plugin install bionic-reading --marketplace bobbymart1n/claude-bionic-reading
```

In the desktop app, where `/plugin` does not run: click **+** next to the prompt
box, then **Plugins**, **Add marketplace** with `bobbymart1n/claude-bionic-reading`,
then **Add plugin**.

Answer `y` to add the marketplace, then pick a scope. It's active right away.

## Use

| Command | What it does |
| --- | --- |
| `/bionic` | Turn it on or off |
| `/bionic on` / `/bionic off` | Turn it on or off explicitly |
| `/bionic fixation 1-5` | How much of each word is bold: 20%, 30%, 40%, 50% or 60% (default 3) |
| `/bionic saccade 1-4` | Bold every word, or every 2nd, 3rd or 4th word (default 1) |
| `/bionic min 1-5` | Leave words shorter than this plain (default 1) |
| `/bionic headings on\|off` | Also bold word starts in headings (default off) |
| `/bionic status` | Show the current settings |
| `/bionic reset` | Drop `/bionic` changes and go back to the `/config` values |
| `/bionic help` | List the commands |

Settings changed with `/bionic` are saved across sessions. The same settings are
also available as pickers in `/config`; values set with `/bionic` take priority.

## Limits

- Terminals and chat surfaces have no letter spacing or variable font weight
  for replies, so those Bionic Reading options aren't offered.
- Words touching `*`, `_` or `~`, or joined to existing bold text, are left
  plain so the reply's markdown never breaks.

## Develop

```
claude --plugin-dir .          # run Claude Code with this folder loaded
claude plugin validate .       # check the manifest and hooks module
claude plugin test .           # run the tests in hooks/*.test.ts
```

Code layout:

- `hooks/transform.ts`: the markdown rewrite
- `hooks/settings.ts`: the settings table (defaults, validation, status line)
- `hooks/command.ts`: `/bionic` parsing and help
- `hooks/register.tsx`: wires them into Claude Code

To add a setting, add it to `Settings` in `types/index.d.ts`, add a spec to
`SETTINGS` in `hooks/settings.ts`, and add a `userConfig` field to
`.claude-plugin/plugin.json` to show it in `/config`.

## License

MIT
