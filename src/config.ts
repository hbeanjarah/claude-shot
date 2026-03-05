import fs from "node:fs";
import path from "node:path";
import os from "node:os";

export interface Config {
  outputDir: string;
  shortcut: string;
  notify: boolean;
}

const DEFAULT_CONFIG: Config = {
  outputDir: "/tmp",
  shortcut: "<Ctrl><Alt>s",
  notify: true,
};

function getConfigPath(): string {
  return path.join(os.homedir(), ".config", "claude-shot", "config.json");
}

export function isFirstRun(): boolean {
  return !fs.existsSync(getConfigPath());
}

export function loadConfig(): Config {
  const configPath = getConfigPath();
  if (!fs.existsSync(configPath)) return { ...DEFAULT_CONFIG };

  const raw = fs.readFileSync(configPath, "utf-8");
  const user = JSON.parse(raw);
  return { ...DEFAULT_CONFIG, ...user };
}

export function saveConfig(config: Config): void {
  const configPath = getConfigPath();
  fs.mkdirSync(path.dirname(configPath), { recursive: true });
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2) + "\n");
}
