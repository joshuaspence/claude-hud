#!/usr/bin/env node
// claude-hud (github:jarrodwatts/claude-hud) is a Claude Code plugin and ships no `bin`, so it
// can't be installed as a mise/npm tool on its own. This launcher adds that missing entrypoint:
// it resolves the upstream statusline program from our node_modules and runs it with the exact
// stdio Claude Code hands the statusLine command (JSON on stdin, rendered line on stdout).
import { createRequire } from "node:module";
import { spawnSync } from "node:child_process";

let entry;
try {
  entry = createRequire(import.meta.url).resolve("claude-hud/dist/index.js");
} catch {
  // Upstream missing or restructured: degrade to an empty statusline rather than crash into the UI.
  process.exit(0);
}

const { status } = spawnSync(process.execPath, [entry], { stdio: "inherit" });
process.exit(status ?? 0);
