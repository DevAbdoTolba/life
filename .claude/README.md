# .claude/ — Claude Code Configuration

This directory contains configuration for [Claude Code](https://docs.anthropic.com/en/docs/claude-code), Anthropic's AI coding assistant CLI.

## What's inside

| Folder | Purpose |
|--------|---------|
| `agents/` | Specialized sub-agent definitions used by GSD workflows |
| `commands/` | Slash commands (e.g., `/gsd:stats`, `/gsd:plan-phase`) |
| `get-shit-done/` | [GSD plugin](https://github.com/get-shit-done/gsd) — structured project management workflows |
| `hooks/` | Lifecycle hooks (context monitoring, prompt guards, status line) |
| `plugins/` | Installed plugin registry and cache |
| `settings.json` | Claude Code settings (hooks, plugins, effort level) |

## Prerequisites

1. **Claude Code** — Install from [docs.anthropic.com](https://docs.anthropic.com/en/docs/claude-code)
2. **GSD Plugin** — Already bundled. If you need to update: `/gsd:update`

## Usage

Open the project in your terminal and run:

```bash
claude
```

Claude Code will automatically pick up the settings and plugins from this directory.

### Useful commands

```
/gsd:progress       # Check project status and next steps
/gsd:stats          # Project statistics
/gsd:new-milestone  # Start a new milestone
/gsd:plan-phase     # Plan a phase
/gsd:execute-phase  # Execute a planned phase
/gsd:help           # Full command list
```

## Ignored

`.claude/worktrees/` is gitignored — these are temporary agent working copies created during execution.
