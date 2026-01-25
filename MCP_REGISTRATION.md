# Registering the `mcp-tutor` MCP Server

This project implements an MCP server over stdio in [src/server.ts](src/server.ts). The server name is `mcp-tutor`.

Below are ready-to-use configs for popular MCP clients on macOS.

## Prerequisites
- Node.js 18+
- Project dependencies installed:

```bash
cd /Users/kellar/Develop/Projects/mcp-tutor
npm install
```

## Claude Desktop
Claude Desktop loads MCP servers from a JSON config at:
- macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`

Add or merge the following under the top-level `mcpServers` key. Using `npm run dev --prefix` ensures the working directory resolves local deps.

```json
{
  "mcpServers": {
    "mcp-tutor": {
      "command": "npm",
      "args": ["run", "dev", "--prefix", "/Users/kellar/Develop/Projects/mcp-tutor"],
      "env": {
        "NODE_ENV": "development"
      }
    }
  }
}
```

Restart Claude Desktop. In a chat, type: `Use tool tutor_echo with {"message":"hello"}` to verify.

## Continue (VS Code)
If you use the Continue extension (supports MCP), add to VS Code settings.json:

```json
{
  "continue.mcpServers": {
    "mcp-tutor": {
      "command": "npm",
      "args": ["run", "dev", "--prefix", "/Users/kellar/Develop/Projects/mcp-tutor"],
      "env": {
        "NODE_ENV": "development"
      }
    }
  }
}
```

Then in Continue, open the MCP tools list and run `tutor_echo`.

## Cursor
Cursor supports MCP via `settings.json` (File → Preferences → Settings → search "MCP Servers"). Add:

```json
{
  "mcpServers": {
    "mcp-tutor": {
      "command": "npm",
      "args": ["run", "dev", "--prefix", "/Users/kellar/Develop/Projects/mcp-tutor"],
      "env": {
        "NODE_ENV": "development"
      }
    }
  }
}
```

## Alternative: Run built JS
You can build and point clients at the built JS (avoids ts-node):

```bash
cd /Users/kellar/Develop/Projects/mcp-tutor
npm run build
```

Then use:

```json
{
  "mcpServers": {
    "mcp-tutor": {
      "command": "node",
      "args": ["/Users/kellar/Develop/Projects/mcp-tutor/dist/server.js"],
      "env": {
        "NODE_ENV": "production"
      }
    }
  }
}
```

## Notes
- Transport: stdio (`StdioServerTransport`) — clients just need to spawn the process.
- Server tools include `tutor_echo`, `tutor_js_hello_*`, `tutor_react_*`, `start_vite_dev_server`, etc.
- For React exercises, you may need to start the Vite dev server; use the `start_vite_dev_server` tool from the MCP client.
- If your client supports `cwd` in config, you can set it to `/Users/kellar/Develop/Projects/mcp-tutor` and simplify args to `npm run dev`.
