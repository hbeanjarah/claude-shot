import { execaCommandSync } from "execa";

export type DisplayServer = "wayland" | "x11";
export type Compositor = "gnome" | "wlroots" | "unknown";

export interface Environment {
  display: DisplayServer;
  compositor: Compositor;
  tools: {
    grim: boolean;
    slurp: boolean;
    gnomeScreenshot: boolean;
    scrot: boolean;
    wlCopy: boolean;
    xclip: boolean;
  };
}

function detectCompositor(): Compositor {
  if (process.env.XDG_CURRENT_DESKTOP?.includes("GNOME")) return "gnome";
  if (process.env.WAYLAND_DISPLAY && process.env.SWAYSOCK) return "wlroots";
  return "unknown";
}

function detectDisplay(): DisplayServer {
  const session = process.env.XDG_SESSION_TYPE;
  if (session === "wayland") return "wayland";

  return "x11";
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
    compositor: detectCompositor(),
    tools: {
      grim: hasCommand("grim"),
      slurp: hasCommand("slurp"),
      gnomeScreenshot: hasCommand("gnome-screenshot"),
      scrot: hasCommand("scrot"),
      wlCopy: hasCommand("wl-copy"),
      xclip: hasCommand("xclip"),
    },
  };
}
