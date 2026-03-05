import { program } from "commander";
import { detect } from "./detect.js";
import { generatePath } from "./storage.js";
import { capture, CaptureError } from "./capture.js";
import { inject } from "./inject.js";

program
  .name("claude-shot")
  .description("Screenshot-to-Claude Code in one shortcut")
  .version("0.1.0")
  .option("-o, --output <dir>", "Output directory", "/tmp")
  .option("--dry-run", "Show what would happen without executing")
  .option(
    "--no-inject",
    "Capture and save only, do not type path into terminal",
  )
  .action(async (opts) => {
    const env = detect();

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

    const outputPath = generatePath(opts.output);

    // Capture
    try {
      await capture(env.display, outputPath, env.compositor);
    } catch (err) {
      if (err instanceof CaptureError && err.cancelled) {
        console.log("Cancelled.");
        process.exit(1);
      }
      throw err;
    }

    console.log(outputPath);

    // Inject
    if (opts.inject) {
      await inject(outputPath, env.display);
    }
  });

program.parse();
