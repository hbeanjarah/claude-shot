import { execaSync } from "execa";
import { detect } from "./detect.js";
import { saveConfig, loadConfig } from "./config.js";
import type { Config } from "./config.js";
import readline from "node:readline";

function log(symbol: string, msg: string): void {
  console.log(`  ${symbol} ${msg}`);
}

function getMissingPackages(): string[] {
  const env = detect();
  const missing: string[] = [];

  if (env.display === "wayland") {
    if (env.compositor === "gnome") {
      if (!env.tools.gnomeScreenshot) missing.push("gnome-screenshot");
    } else {
      if (!env.tools.grim) missing.push("grim");
      if (!env.tools.slurp) missing.push("slurp");
    }
    if (!env.tools.wlCopy) missing.push("wl-clipboard");
  } else {
    if (!env.tools.gnomeScreenshot && !env.tools.scrot)
      missing.push("gnome-screenshot");
    if (!env.tools.xclip) missing.push("xclip");
  }

  try {
    execaSync("which", ["notify-send"]);
  } catch {
    missing.push("libnotify-bin");
  }

  return missing;
}

function checkDependencies(): string[] {
  const env = detect();
  const missing = getMissingPackages();

  console.log("\nChecking dependencies...\n");

  // Capture tools
  if (env.display === "wayland") {
    if (env.compositor === "gnome") {
      env.tools.gnomeScreenshot
        ? log("✓", "gnome-screenshot found")
        : log("✗", "gnome-screenshot missing");
    } else {
      env.tools.grim ? log("✓", "grim found") : log("✗", "grim missing");
      env.tools.slurp ? log("✓", "slurp found") : log("✗", "slurp missing");
    }
  } else {
    env.tools.gnomeScreenshot || env.tools.scrot
      ? log("✓", "screenshot tool found")
      : log("✗", "no screenshot tool found");
  }

  // Clipboard tools
  if (env.display === "wayland") {
    env.tools.wlCopy ? log("✓", "wl-copy found") : log("✗", "wl-copy missing");
  } else {
    env.tools.xclip ? log("✓", "xclip found") : log("✗", "xclip missing");
  }

  // Notification
  try {
    execaSync("which", ["notify-send"]);
    log("✓", "notify-send found");
  } catch {
    log("✗", "notify-send missing");
  }

  return missing;
}

function askYesNo(question: string): Promise<boolean> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.toLowerCase() !== "n");
    });
  });
}

async function installPackages(packages: string[]): Promise<boolean> {
  const cmd = `sudo apt install -y ${packages.join(" ")}`;
  console.log(`\n  Running: ${cmd}\n`);
  try {
    execaSync("sudo", ["apt", "install", "-y", ...packages], {
      stdio: "inherit",
    });
    return true;
  } catch {
    return false;
  }
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

export async function runSetup(): Promise<void> {
  console.log("claude-shot setup");
  console.log("─".repeat(40));

  const missing = checkDependencies();

  if (missing.length > 0) {
    console.log(`\n  Missing: ${missing.join(", ")}`);
    const install = await askYesNo(
      "\n  Install missing dependencies? (requires sudo) [Y/n] ",
    );

    if (install) {
      const ok = await installPackages(missing);
      if (!ok) {
        console.error("\n  Failed to install dependencies.");
        process.exit(2);
      }
      log("✓", "Dependencies installed");
    } else {
      console.log("\n  Skipped. Install manually and run: claude-shot setup");
      process.exit(2);
    }
  }

  const config: Config = loadConfig();
  registerShortcut(config.shortcut);
  saveConfig(config);

  log("✓", "Config saved to ~/.config/claude-shot/config.json");
  console.log(`\nReady! Press ${config.shortcut} to capture.\n`);
}
