import path from "node:path";
import fs from "node:fs";

const DEFAULT_DIR = "/tmp";
const PREFIX = "claude-shot";

function timestamp(): string {
  const now = new Date();
  const date = now.toISOString().slice(0, 10).replace(/-/g, "");
  const time = now.toTimeString().slice(0, 8).replace(/:/g, "");
  const ms = String(now.getMilliseconds()).padStart(3, "0");
  return `${date}-${time}-${ms}`;
}

export function generatePath(outputDir?: string): string {
  const dir = outputDir ?? DEFAULT_DIR;
  fs.mkdirSync(dir, { recursive: true });
  const filename = `${PREFIX}-${timestamp()}.png`;
  return path.join(dir, filename);
}
