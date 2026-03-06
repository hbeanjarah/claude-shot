import { spawn } from "node:child_process";
import fs from "node:fs";
import { execa } from "execa";
import type { DisplayServer } from "./detect.js";

export async function inject(
  filePath: string,
  display: DisplayServer,
): Promise<void> {
  if (display === "wayland") {
    const input = fs.readFileSync(filePath);
    const proc = spawn("wl-copy", ["--type", "image/png"], {
      stdio: ["pipe", "ignore", "ignore"],
      detached: true,
    });
    proc.stdin.write(input);
    proc.stdin.end();
    proc.unref();
  } else {
    await execa("xclip", [
      "-selection",
      "clipboard",
      "-t",
      "image/png",
      "-i",
      filePath,
    ]);
  }

  await execa("notify-send", [
    "claude-shot",
    "Screenshot copied — paste into Claude Code",
    "--expire-time=3000",
  ]);
}
