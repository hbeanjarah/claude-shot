import { execaCommandSync } from "execa";

export type DisplayServer = "wayland" | "x11";
export type Terminal = "zellij" | "generic";

export interface Environment {
  display: DisplayServer;
  terminal: Terminal;
  tools: {
    grim: boolean;
    slurp: boolean;
    gnomeScreenshot: boolean;
    scrot: boolean;
    xdotool: boolean;
    wtype: boolean;
    ydotool: boolean;
  };
}

function detectDisplay(): DisplayServer {
  const session = process.env.XDG_SESSION_TYPE;
  if (session === "wayland") return "wayland";

  return "x11";
}

function detectTerminal(): Terminal {
  if (process.env.ZELLIJ) return "zellij";
  return "generic";
}

function hasCommand(name: string): boolean {
  try {
    execaCommandSync(`which ${name}`);
    return true;
  } catch {
    return false;
  }
}

export function detect(): Environment {
  return {
    display: detectDisplay(),
    terminal: detectTerminal(),
    tools: {
      grim: hasCommand("grim"),
      slurp: hasCommand("slurp"),
      gnomeScreenshot: hasCommand("gnome-screenshot"),
      scrot: hasCommand("scrot"),
      xdotool: hasCommand("xdotool"),
      wtype: hasCommand("wtype"),
      ydotool: hasCommand("ydotool"),
    },
  };
}
