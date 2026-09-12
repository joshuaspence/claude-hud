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

With mise, via its built-in `npm:` backend:

```toml
# ~/.config/mise/config.toml
[tools]
"npm:@joshuaspence/claude-hud" = "latest"
```

Two prerequisites, both of which apply only if you have mise install npm tools with pnpm
(`npm.package_manager = "pnpm"`). Neither is a pnpm restriction you can work around from the
package side, and mise's default npm package manager needs neither:

- **mise ≥ 2026.9.4.** Older versions pass `--global-bin-dir`, a flag pnpm 12 removed.
- **`blockExoticSubdeps: false`** in the `pnpm-workspace.yaml` at your `PNPM_HOME` (default
  `~/.local/share/pnpm`). This package depends on upstream as a git dependency, and pnpm 12
  refuses git *sub*dependencies with `ERR_PNPM_EXOTIC_SUBDEP`. pnpm reads that resolution-policy
  setting only from the workspace-root manifest — not `.npmrc`, not `~/.config/pnpm/config.yaml` —
  and for a `--global` install the workspace root is `PNPM_HOME`.

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
- **A just-published version can be invisible.** mise ≥ 2026.9.4 applies a supply-chain cooldown
  by default, so installing a release minutes after it lands fails with "no versions found ...
  matching date filter". Bypass once with `MISE_MINIMUM_RELEASE_AGE=0 mise install …`, or exempt
  the tool with `minimum_release_age_excludes = ["npm:@joshuaspence/claude-hud"]`.
- **Not reproducible over time.** The same wrapper version can deliver different upstream code
  depending on *when* it's installed — the deliberate trade for always-latest.

The wrapper's own version tracks changes to *this* launcher, not the upstream release it pulls.

## Credits & license

Upstream [`claude-hud`](https://github.com/jarrodwatts/claude-hud) is MIT © Jarrod Watts. This
wrapper is MIT © Josh Spence — see [LICENSE](LICENSE).
