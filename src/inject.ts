import { execa } from "execa";
import type { DisplayServer } from "./detect.js";

export async function inject(
  filePath: string,
  display: DisplayServer,
): Promise<void> {
  if (display === "wayland") {
    await execa("wl-copy", ["--type", "image/png"], { inputFile: filePath });
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
