import { execa } from "execa";
import type { Terminal, DisplayServer } from "./detect.js";

export async function inject(
  filePath: string,
  terminal: Terminal,
  display: DisplayServer,
): Promise<void> {
  if (terminal === "zellij") {
    await injectZellij(filePath);
    return;
  }

  await injectClipboard(filePath, display);
}

async function injectZellij(filePath: string): Promise<void> {
  await execa("zellij", ["action", "write-chars", filePath]);
}

async function injectClipboard(
  filePath: string,
  display: DisplayServer,
): Promise<void> {
  if (display === "wayland") {
    await execa("wl-copy", [filePath]);
  } else {
    await execa("xclip", ["-selection", "clipboard"], { input: filePath });
  }

  await execa("notify-send", [
    "claude-shot",
    `Path copied — paste into Claude Code\n${filePath}`,
    "--expire-time=3000",
  ]);
}
