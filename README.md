# @joshuaspence/claude-hud

A thin wrapper that makes [`jarrodwatts/claude-hud`](https://github.com/jarrodwatts/claude-hud) —
a real-time statusline HUD for Claude Code — installable as a [mise](https://mise.jdx.dev/) (or
plain npm) tool.

## Why this exists

Upstream `claude-hud` is distributed as a **Claude Code plugin**, not a CLI: its `package.json`
declares `"bin": null`, so package managers have no executable to expose and it can't be installed
as a versioned tool. This package depends on a pinned upstream release and adds the missing `bin`,
which simply execs upstream's prebuilt `dist/index.js` with the stdio Claude Code hands the
statusLine command.

It is deliberately tiny — see [`bin/claude-hud.mjs`](bin/claude-hud.mjs). No upstream code is
vendored; upstream is pulled in as a pinned git dependency (its CI commits a built `dist/`, so no
build step runs on install).

## Install

With mise, via the [`vfox-npm`](https://github.com/jdx/vfox-npm) backend (installs by npm registry
name, so it sidesteps the pnpm-global quirks of mise's built-in `npm:` backend):

```toml
# ~/.config/mise/config.toml
[plugins]
vfox-npm = "https://github.com/jdx/vfox-npm"

[tools]
"vfox-npm:@joshuaspence/claude-hud" = "latest"
```

Then point Claude Code's statusLine at the installed `claude-hud` command (a mise shim on your
`PATH`). Nothing else is needed — no launcher script:

```json
{
  "statusLine": { "type": "command", "command": "claude-hud" }
}
```

The launcher already reports the right width. Claude Code sets `$COLUMNS` to the width of the
whole terminal, but draws the statusline into a pane four columns narrower, so a right-aligned row
padded to `$COLUMNS` has its tail clipped with an ellipsis. This wrapper subtracts that margin,
and falls back to reading `/dev/tty` when `$COLUMNS` is absent altogether.

## Versioning

The upstream dependency floats: `github:jarrodwatts/claude-hud#semver:*` resolves to the newest
`claude-hud` **release tag** at install time, so a fresh install always gets the latest release —
no per-release bump needed here.

Two consequences worth knowing:

- **Not auto-updating in place.** Package managers cache by *this* wrapper's version, so an
  existing install only picks up a newer upstream on a fresh (re)install. With mise:
  `mise install npm:@joshuaspence/claude-hud --force` (or uninstall + install).
- **Not reproducible over time.** The same wrapper version can deliver different upstream code
  depending on *when* it's installed — the deliberate trade for always-latest.

The wrapper's own version tracks changes to *this* launcher, not the upstream release it pulls.

## Credits & license

Upstream [`claude-hud`](https://github.com/jarrodwatts/claude-hud) is MIT © Jarrod Watts. This
wrapper is MIT © Josh Spence — see [LICENSE](LICENSE).
