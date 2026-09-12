#!/usr/bin/env node

/**
 * [`claude-hud`](https://github.com/jarrodwatts/claude-hud) is a Claude Code plugin and ships no `bin`, so it can't be
 * installed as a tool on its own. This launcher adds that missing entrypoint: it resolves the upstream statusline
 * program from our `node_modules` and runs it with the exact stdio Claude Code hands the statusLine command (JSON on
 * stdin, rendered line on stdout).
 *
 * It also reports the *usable* width. Claude Code runs the statusLine command with no TTY on stdio, so upstream's
 * `process.stdout.columns` comes up empty and it falls back to `$COLUMNS` — which Claude Code does set, but to the
 * width of the whole terminal rather than the narrower pane it draws the statusline into. We subtract that margin,
 * falling back to reading the controlling terminal (`/dev/tty`) when `$COLUMNS` is absent. With neither, we leave the
 * environment untouched and upstream degrades to its fixed "wide" layout (10-block bar, no width-aware line combining
 * or truncation) exactly as before.
 */

import { createRequire } from "node:module";
import { spawnSync } from "node:child_process";
import { closeSync, openSync } from "node:fs";
import { WriteStream } from "node:tty";

// Claude Code draws the statusline in a pane four columns narrower than the width it reports. Measured: at
// `COLUMNS=140`, a right-aligned row padded to 140 came back clipped, `Last reply: 27s ago` rendering as
// `Last reply: 27…` — five columns lost, one of them to the ellipsis that replaced them.
const WIDTH_MARGIN = 4;

function parsePositiveInt(value) {
  const n = Number.parseInt(value ?? "", 10);
  return Number.isFinite(n) && n > 0 ? n : null;
}

// Read the width of the controlling terminal, bypassing the (non-TTY) stdio Claude hands us. Returns null when there
// is no controlling terminal (openSync throws ENXIO/ENOENT) or the fd isn't a recognisable TTY.
function detectControllingTerminalWidth() {
  let fd;
  try {
    fd = openSync("/dev/tty", "r+");
  } catch {
    return null;
  }
  let stream;
  try {
    stream = new WriteStream(fd);
    const cols = stream.columns;
    return Number.isInteger(cols) && cols > 0 ? cols : null;
  } catch {
    return null;
  } finally {
    if (stream) {
      stream.destroy(); // Owns and closes fd.
    } else {
      try {
        closeSync(fd);
      } catch {
        // Nothing to do: the fd is already gone or was never valid.
      }
    }
  }
}

// Prefer the width Claude passes in, fall back to the controlling terminal, and apply the margin to whichever we got:
// both of them measure the terminal, and upstream needs the pane.
const cols = parsePositiveInt(process.env.COLUMNS) ?? detectControllingTerminalWidth();
if (cols) {
  process.env.COLUMNS = String(Math.max(1, cols - WIDTH_MARGIN));
}

let entry;

try {
  entry = createRequire(import.meta.url).resolve("claude-hud/dist/index.js");
} catch {
  // Upstream missing or restructured: degrade to an empty statusline rather than crash into the UI.
  process.exit(0);
}

const { status } = spawnSync(process.execPath, [entry], { stdio: "inherit" });
process.exit(status ?? 0);
