import { execa } from "execa";
import fs from "node:fs";
import type { DisplayServer } from "./detect.js";

export class CaptureError extends Error {
  constructor(
    message: string,
    public readonly cancelled: boolean = false,
  ) {
    super(message);
    this.name = "CaptureError";
  }
}

export async function capture(
  display: DisplayServer,
  outputPath: string,
  compositor?: string,
): Promise<string> {
  if (display === "wayland") {
    return captureWayland(outputPath, compositor);
  }
  return captureX11(outputPath);
}

async function captureWayland(
  outputPath: string,
  compositor?: string,
): Promise<string> {
  // Skip slurp on GNOME — it doesn't support zwlr_layer_shell_v1
  if (compositor !== "gnome") {
    try {
      const result = await execa("slurp", { timeout: 2000 });
      const geometry = result.stdout.trim();
      await execa("grim", ["-g", geometry, outputPath]);
      return outputPath;
    } catch {
      // Fall back to gnome-screenshot
    }
  }

  try {
    await execa("gnome-screenshot", ["-a", "-f", outputPath]);
  } catch {
    throw new CaptureError("Selection cancelled.", true);
  }

  if (!fs.existsSync(outputPath)) {
    throw new CaptureError("Selection cancelled.", true);
  }
  return outputPath;
}

async function captureX11(outputPath: string): Promise<string> {
  try {
    await execa("gnome-screenshot", ["-a", "-f", outputPath]);
  } catch {
    try {
      await execa("scrot", ["-s", "-f", outputPath]);
    } catch {
      throw new CaptureError(
        "Selection cancelled or no screenshot tool available.",
        true,
      );
    }
  }
  return outputPath;
}
