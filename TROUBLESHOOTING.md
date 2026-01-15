# TROUBLESHOOTING.md

## Common Issues Running MCP Servers in VS Code

### 1. `npx` Not Found
- **Symptom:** Error: `The command "npx" needed to run ai-code-tutor was not found.`
- **Cause:** The environment running your MCP client or VS Code extension does not have `npx` in its PATH.
- **Fixes:**
  - Use the full path to `npx` in your config (e.g., `/Users/kellar/.nvm/versions/node/v20.19.5/bin/npx`).
  - Or, use the local `tsx` binary: `./node_modules/.bin/tsx` as the command.
  - Or, launch VS Code from a terminal (`code .`) so it inherits your shell’s PATH.

### 2. `node: No such file or directory`
- **Symptom:** Error: `env: node: No such file or directory` and `Process exited with code 127`.
- **Cause:** The process cannot find the `node` executable because PATH is not set up for GUI apps.
- **Fixes:**
  - Launch VS Code from a terminal (`code .`).
  - Or, add an `env` block to your MCP config with the correct PATH:
    ```json
    "env": {
      "PATH": "/Users/kellar/.nvm/versions/node/v20.19.5/bin:/usr/local/bin:/usr/bin:/bin"
    }
    ```
  - Or, use the absolute path to `node` in your config.

### 3. Portability Across Machines
- **Symptom:** Hardcoded paths to `npx`, `node`, or project folders break on other computers.
- **Best Practice:**
  - Use the local `tsx` binary (`./node_modules/.bin/tsx`) for the command.
  - Keep `cwd` relative if possible, or document the need to update it per machine.
  - Always run `npm install` before starting the server on a new machine.

### 4. General Advice
- If you see command-not-found errors, check your PATH and how VS Code was launched.
- For maximum portability, prefer local binaries in `node_modules/.bin`.
- Document any machine-specific config in this file for your team.

---
_Last updated: 2026-01-15_
