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

  if (display === "wayland") {
    await injectWayland(filePath);
    return;
  }

  await injectX11(filePath);
}

async function injectZellij(filePath: string): Promise<void> {
  await execa("zellij", ["action", "write-chars", filePath]);
}

async function injectWayland(filePath: string): Promise<void> {
  await execa("wtype", [filePath]);
}

async function injectX11(filePath: string): Promise<void> {
  await execa("xdotool", ["type", "--delay", "12", filePath]);
}
