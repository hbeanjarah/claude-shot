import { execaSync } from "execa";
import { detect } from "./detect.js";
import { saveConfig, loadConfig } from "./config.js";
import type { Config } from "./config.js";

function log(symbol: string, msg: string): void {
  console.log(`  ${symbol} ${msg}`);
}

function checkDependencies(): boolean {
  const env = detect();
  let ok = true;

  console.log("\nChecking dependencies...\n");

  // Capture tools
  if (env.display === "wayland") {
    if (env.compositor === "gnome") {
      env.tools.gnomeScreenshot
        ? log("✓", "gnome-screenshot found")
        : (log(
            "✗",
            "gnome-screenshot missing → sudo apt install gnome-screenshot",
          ),
          (ok = false));
    } else {
      env.tools.grim
        ? log("✓", "grim found")
        : (log("✗", "grim missing → sudo apt install grim"), (ok = false));
      env.tools.slurp
        ? log("✓", "slurp found")
        : (log("✗", "slurp missing → sudo apt install slurp"), (ok = false));
    }
  } else {
    env.tools.gnomeScreenshot || env.tools.scrot
      ? log("✓", "screenshot tool found")
      : (log("✗", "no screenshot tool → sudo apt install gnome-screenshot"),
        (ok = false));
  }

  // Clipboard tools
  if (env.display === "wayland") {
    env.tools.wlCopy
      ? log("✓", "wl-copy found")
      : (log("✗", "wl-copy missing → sudo apt install wl-clipboard"),
        (ok = false));
  } else {
    env.tools.xclip
      ? log("✓", "xclip found")
      : (log("✗", "xclip missing → sudo apt install xclip"), (ok = false));
  }

  // Notification
  try {
    execaSync("which", ["notify-send"]);
    log("✓", "notify-send found");
  } catch {
    log("✗", "notify-send missing → sudo apt install libnotify-bin");
    ok = false;
  }

  return ok;
}

function registerShortcut(shortcut: string): boolean {
  try {
    const name = "claude-shot";
    const nodePath = process.execPath;
    const scriptPath = process.argv[1];
    const command = `${nodePath} ${scriptPath}`;

    // Find an available custom keybinding slot
    const existing = execaSync("gsettings", [
      "get",
      "org.gnome.settings-daemon.plugins.media-keys",
      "custom-keybindings",
    ]).stdout.trim();

    let bindings: string[];
    if (existing === "@as []" || existing === "[]") {
      bindings = [];
    } else {
      bindings = existing
        .replace(/^\[/, "")
        .replace(/\]$/, "")
        .split(",")
        .map((s) => s.trim().replace(/'/g, ""));
    }

    const schema =
      "org.gnome.settings-daemon.plugins.media-keys.custom-keybinding";

    // Check if claude-shot binding already exists
    for (const binding of bindings) {
      try {
        const n = execaSync("gsettings", [
          "get",
          `${schema}:${binding}`,
          "name",
        ])
          .stdout.trim()
          .replace(/'/g, "");
        if (n === name) {
          log("✓", `Shortcut already registered (${shortcut})`);
          return true;
        }
      } catch {
        continue;
      }
    }

    // Create new binding
    const index = bindings.length;
    const kbPath = `/org/gnome/settings-daemon/plugins/media-keys/custom-keybindings/custom${index}/`;

    bindings.push(kbPath);
    const bindingsArr = JSON.stringify(bindings);

    execaSync("gsettings", [
      "set",
      "org.gnome.settings-daemon.plugins.media-keys",
      "custom-keybindings",
      bindingsArr,
    ]);
    execaSync("gsettings", ["set", `${schema}:${kbPath}`, "name", name]);
    execaSync("gsettings", ["set", `${schema}:${kbPath}`, "command", command]);
    execaSync("gsettings", ["set", `${schema}:${kbPath}`, "binding", shortcut]);

    log("✓", `Keyboard shortcut registered (${shortcut})`);
    return true;
  } catch {
    log("✗", "Failed to register keyboard shortcut");
    return false;
  }
}

export function runSetup(): void {
  console.log("claude-shot setup");
  console.log("─".repeat(40));

  const depsOk = checkDependencies();

  if (!depsOk) {
    console.log("\nInstall missing dependencies and run: claude-shot setup");
    process.exit(2);
  }

  const config: Config = loadConfig();
  registerShortcut(config.shortcut);
  saveConfig(config);

  console.log("  ✓ Config saved to ~/.config/claude-shot/config.json");
  console.log(`\nReady! Press ${config.shortcut} to capture.\n`);
}
