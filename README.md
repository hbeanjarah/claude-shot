# claude-shot

Screenshot-to-Claude Code in one shortcut. Capture a screen area and paste it directly into Claude Code with Ctrl+V.

## How it works

1. Press **Ctrl+Alt+S** (or your custom shortcut)
2. Select a screen area
3. Switch to Claude Code
4. **Ctrl+V** — image is pasted directly

No file paths. No drag-and-drop. No context switching.

## Install

```bash
npm i -g claude-shot
```

On first run, claude-shot automatically:
- Checks system dependencies
- Registers a keyboard shortcut
- Creates a config file

```bash
claude-shot  # first run triggers setup
```

### System requirements

- Ubuntu (GNOME Wayland or X11)
- Node.js 18+

Dependencies are installed automatically during setup, or manually:

```bash
# GNOME Wayland
sudo apt install gnome-screenshot wl-clipboard libnotify-bin

# wlroots Wayland (Sway)
sudo apt install grim slurp wl-clipboard libnotify-bin

# X11
sudo apt install gnome-screenshot xclip libnotify-bin
```

## Usage

```bash
claude-shot              # capture and copy to clipboard
claude-shot --last       # re-copy most recent screenshot
claude-shot --no-inject  # capture only, don't copy to clipboard
claude-shot --dry-run    # show what would happen
claude-shot -o ~/shots   # custom output directory
claude-shot setup        # re-run setup (reconfigure shortcut)
```

## Configuration

Config file: `~/.config/claude-shot/config.json`

```json
{
  "outputDir": "/tmp",
  "shortcut": "<Ctrl><Alt>s",
  "notify": true
}
```

## How it works (technical)

1. **Detect** — Wayland/X11, GNOME/wlroots compositor, available tools
2. **Capture** — `gnome-screenshot -a` (GNOME) or `slurp` + `grim` (wlroots) or `scrot` (X11)
3. **Save** — `/tmp/claude-shot-YYYYMMDD-HHmmss-SSS.png`
4. **Clipboard** — `wl-copy --type image/png` (Wayland) or `xclip` (X11)
5. **Notify** — desktop notification confirms screenshot is ready

## License

MIT
