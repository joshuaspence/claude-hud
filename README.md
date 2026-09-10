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
`PATH`). A small launcher is still useful to hand the HUD the real terminal width, since Claude
runs statusLine without a TTY:

```bash
#!/bin/bash
cols=$({ stty size </dev/tty | awk '{print $2}'; } 2>/dev/null || true)
: "${cols:=${COLUMNS:-120}}"
export COLUMNS=$((cols > 4 ? cols - 4 : 1))
exec claude-hud
```

## Versioning

The wrapper version mirrors the upstream `claude-hud` release it pins (currently **0.8.0**). To
track a new upstream release, bump `dependencies.claude-hud` to the matching `#vX.Y.Z` tag and
publish the wrapper at the same version.

## Credits & license

Upstream [`claude-hud`](https://github.com/jarrodwatts/claude-hud) is MIT © Jarrod Watts. This
wrapper is MIT © Josh Spence — see [LICENSE](LICENSE).
