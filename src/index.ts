import fs from "node:fs";
import path from "node:path";
import { program } from "commander";
import { detect } from "./detect.js";
import { generatePath } from "./storage.js";
import { capture, CaptureError } from "./capture.js";
import { inject } from "./inject.js";
import { isFirstRun, loadConfig } from "./config.js";
import { runSetup } from "./setup.js";

program
  .name("claude-shot")
  .description("Screenshot-to-Claude Code in one shortcut")
  .version("0.1.0")
  .option("-o, --output <dir>", "Output directory")
  .option("--dry-run", "Show what would happen without executing")
  .option("--no-inject", "Capture only, do not copy to clipboard")
  .option("--last", "Re-copy the most recent screenshot to clipboard")
  .action(async (opts) => {
    const env = detect();
    const config = loadConfig();
    const outputDir = opts.output || config.outputDir;

    if (opts.last) {
      const files = fs
        .readdirSync(outputDir)
        .filter((f) => f.startsWith("claude-shot-") && f.endsWith(".png"))
        .sort()
        .reverse();
      if (files.length === 0) {
        console.error("No screenshots found.");
        process.exit(1);
      }
      const latest = path.join(outputDir, files[0]);
      await inject(latest, env.display);
      return;
    }

    if (isFirstRun()) {
      await runSetup();
    }

    // Check required tools
    if (env.display === "wayland") {
      if (env.compositor === "gnome") {
        if (!env.tools.gnomeScreenshot) {
          console.error(
            "Missing required tools. Run:\n  sudo apt install gnome-screenshot",
          );
          process.exit(2);
        }
      } else {
        if (!env.tools.grim || !env.tools.slurp) {
          console.error(
            "Missing required tools. Run:\n  sudo apt install grim slurp",
          );
          process.exit(2);
        }
      }
    } else {
      if (!env.tools.gnomeScreenshot && !env.tools.scrot) {
        console.error(
          "Missing required tools. Run:\n  sudo apt install gnome-screenshot",
        );
        process.exit(2);
      }
    }

    if (opts.inject) {
      if (env.display === "wayland" && !env.tools.wlCopy) {
        console.error(
          "Missing wl-copy for clipboard. Run:\n  sudo apt install wl-clipboard",
        );
        process.exit(2);
      }
      if (env.display === "x11" && !env.tools.xclip) {
        console.error(
          "Missing xclip for clipboard. Run:\n  sudo apt install xclip",
        );
        process.exit(2);
      }
    }

    const outputPath = generatePath(outputDir);

    // Capture
    try {
      await capture(env.display, outputPath, env.compositor);
    } catch (err) {
      if (err instanceof CaptureError && err.cancelled) {
        process.exit(1);
      }
      throw err;
    }

    // Inject
    if (opts.inject) {
      await inject(outputPath, env.display);
    }
  });

program
  .command("setup")
  .description("Check dependencies and configure keyboard shortcut")
  .action(async () => {
    await runSetup();
  });

program.parse();
