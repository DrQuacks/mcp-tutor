# MCP Tutor Server Setup Guide

This guide documents the exact MCP server setup and the required Vite startup workflow.

## Prerequisites
- Node.js (v18+ recommended)
- npm (comes with Node.js)
- Git

## 1. Clone the Repository

```bash
git clone <your-repo-url> mcp-tutor
cd mcp-tutor
```

## 2. Install Dependencies

```bash
npm install
```

## 3. Install React Template Dependencies

```bash
cd environments/react/template
npm install
cd ../../../..
```

## 4. Run the MCP Server

```bash
npm start
```

Or run directly:

```bash
npx tsx src/server.ts
```

## 5. Register MCP Server in VS Code

If your VS Code MCP client uses `.vscode/mcp.json`, configure it like this (update paths for your machine):

```json
{
  "servers": {
    "ai-code-tutor": {
      "type": "stdio",
      "command": "npx",
      "args": ["tsx", "/absolute/path/to/mcp-tutor/src/server.ts"],
      "cwd": "/absolute/path/to/mcp-tutor"
    }
  }
}
```

## 6. REQUIRED: Start Vite via MCP Tool

**Always** start Vite using the MCP tool (do not use terminal commands):

- Tool: `start_vite_dev_server`
- Optional input: `{ "port": 5174 }`

This tool is idempotent and will report “already running” if the port is in use.

---
If you use a different MCP client, mirror the same stdio command and working directory.
