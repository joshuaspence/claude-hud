#!/usr/bin/env node

/**
 * [`claude-hud`](https://github.com/jarrodwatts/claude-hud) is a Claude Code plugin and ships no `bin`, so it can't be
 * installed as a tool on its own. This launcher adds that missing entrypoint: it resolves the upstream statusline
 * program from our `node_modules` and runs it with the exact stdio Claude Code hands the statusLine command (JSON on
 * stdin, rendered line on stdout).
 *
 * It also recovers the terminal width. Claude Code runs the statusLine command with no TTY on stdio, so upstream's
 * width detection (`process.stdout.columns` -> `$COLUMNS`) comes up empty and the HUD falls back to its fixed "wide"
 * layout (10-block bar, no width-aware line combining or truncation). We read the real width from the controlling
 * terminal (`/dev/tty`) and pass it down as `$COLUMNS`, which upstream already honours. If there is no controlling
 * terminal (a detached or CI invocation), we leave the environment untouched and upstream degrades exactly as before.
 */

import { createRequire } from "node:module";
import { spawnSync } from "node:child_process";
import { closeSync, openSync } from "node:fs";
import { WriteStream } from "node:tty";

// Report slightly less than the raw terminal width: Claude renders the statusline in a marginally inset area, and
// under-reporting keeps right-aligned/combined content from spilling past the edge and wrapping.
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

// Only fill in COLUMNS when Claude (or the surrounding shell) hasn't already provided a usable one.
if (!parsePositiveInt(process.env.COLUMNS)) {
  const cols = detectControllingTerminalWidth();
  if (cols) {
    process.env.COLUMNS = String(Math.max(1, cols - WIDTH_MARGIN));
  }
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
