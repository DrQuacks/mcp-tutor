/**
 * Shared path constants for the MCP tutor server
 */

import path from "node:path";

export const ENV_ROOT = path.join(process.cwd(), "environments");
export const NODE_ENV_ROOT = path.join(ENV_ROOT, "node");
export const REACT_ENV_ROOT = path.join(ENV_ROOT, "react", "template");
export const EXERCISES_ROOT = path.join(process.cwd(), "exercises");
export const PROGRESS_FILE = path.join(process.cwd(), "user_progress.json");
