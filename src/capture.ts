import { execa } from "execa";
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
): Promise<string> {
  if (display === "wayland") {
    return captureWayland(outputPath);
  }
  return captureX11(outputPath);
}

async function captureWayland(outputPath: string): Promise<string> {
  let geometry: string;

  try {
    const result = await execa("slurp");
    geometry = result.stdout.trim();
  } catch {
    throw new CaptureError("Selection cancelled.", true);
  }

  await execa("grim", ["-g", geometry, outputPath]);
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
