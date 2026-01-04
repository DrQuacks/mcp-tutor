# Senior Dev Mode: Tool Suite Specification

## Overview

**Goal:**
Transform a set of code changes (from a commit diff, working directory, or specific files) into a step-by-step, skills-focused tutorial. The user writes the code, but the AI guides, explains, and checks each step.

---

## Tool Suite

### 1. seniorDev_start_mode
- **Purpose:** Initialize a Senior Dev Mode session by capturing the code change context.
- **Inputs:**
  - `files` (optional): Array of file paths to include (default: all changed files).
  - `fromCommit` (optional): Git commit hash or ref for the starting point (default: last commit).
  - `toCommit` (optional): Git commit hash or ref for the ending point (default: working directory).
  - `mode` (optional): `"diff"` (default, use git diff), `"file"` (use file contents).
- **Outputs:**
  - Session ID (for tracking).
  - List of files and their before/after content.
  - Summary of detected changes (diffs).

---

### 2. seniorDev_analyze_skills
- **Purpose:** Analyze the code changes and extract a list of relevant skills, concepts, and patterns.
- **Inputs:**
  - `sessionId`: The session to analyze.
- **Outputs:**
  - List of skills/concepts (e.g., “useState”, “Array.map”, “d3.data”, “async/await”).
  - For each skill: short description, code region(s) where it appears, and why it’s relevant.
  - Optionally, a “focus” prompt for the user to select which skills to emphasize.

---

### 3. seniorDev_select_skills
- **Purpose:** Allow the user to select which skills/concepts to focus on in the tutorial.
- **Inputs:**
  - `sessionId`
  - `selectedSkills`: Array of skill/concept IDs or names.
- **Outputs:**
  - Confirmation of selected skills.
  - Optionally, a suggested grouping/step order.

---

### 4. seniorDev_generate_tutorial
- **Purpose:** Break down the code changes into a step-by-step tutorial, grouped by the selected skills.
- **Inputs:**
  - `sessionId`
  - `selectedSkills` (optional, if not already set)
- **Outputs:**
  - Array of tutorial steps, each with:
    - Step number and title
    - Skill/concept focus
    - Explanation (what/why/how)
    - Plain-language task (what to change, not code)
    - File(s) and region(s) to edit
    - (Optional) Generic code pattern/example
  - Optionally, a summary of the full tutorial plan.

---

### 5. seniorDev_present_step
- **Purpose:** Present the current tutorial step to the user, including context and instructions.
- **Inputs:**
  - `sessionId`
  - `stepNumber`
- **Outputs:**
  - Step details (as above)
  - Option to request a hint, see a generic example, or skip

---

### 6. seniorDev_check_step
- **Purpose:** Validate the user’s code for the current step.
- **Inputs:**
  - `sessionId`
  - `stepNumber`
  - (Optional) `files` (if user wants to check only certain files)
- **Outputs:**
  - Pass/fail status
  - Feedback or hints if not passed
  - If passed, advance to next step

---

### 7. seniorDev_finalize_tutorial
- **Purpose:** Summarize the session, review all changes, and reinforce the skills learned.
- **Inputs:**
  - `sessionId`
- **Outputs:**
  - Summary of all steps and skills covered
  - Optionally, a full diff review
  - Suggestions for further learning or related concepts

---

### 8. seniorDev_abort_session (optional)
- **Purpose:** Allow the user to abort or reset the session.
- **Inputs:**
  - `sessionId`
- **Outputs:**
  - Confirmation of session termination

---

## Data Model
- **Session State:**
  - Session ID
  - Files, before/after content
  - Diffs
  - Skills/concepts detected
  - Selected skills
  - Tutorial steps
  - Current step
  - User progress (per step)

---

## Example Flow
1. User: “Enter senior dev mode for foobar.js, from commit X to working dir.”
2. Tool: `seniorDev_start_mode` → captures diff.
3. Tool: `seniorDev_analyze_skills` → lists skills: useState, d3.data, Array.map.
4. User: “Focus on d3.data.”
5. Tool: `seniorDev_select_skills` → confirms.
6. Tool: `seniorDev_generate_tutorial` → breaks down changes into steps.
7. Tool: `seniorDev_present_step` → shows step 1.
8. User: Implements step, asks for check.
9. Tool: `seniorDev_check_step` → validates, advances.
10. Repeat until done.
11. Tool: `seniorDev_finalize_tutorial` → summarizes.
