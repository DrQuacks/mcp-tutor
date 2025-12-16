# Exercise Requirements Validation Tool

## Purpose

This tool validates that exercise requirements are specific enough to satisfy the browser tests, preventing student confusion when tests expect behaviors that weren't explicitly stated in the requirements.

## Problem It Solves

**Example from react-form-validator:**
- ❌ **Vague requirement:** "Show an error message if email is invalid"
- ✅ **Specific requirement:** "Email error message must contain the text '@' to inform users what's required"
- ✅ **Added timing requirement:** "Error messages should appear in real-time as the user types (not just on form submission)"

Without these specific details, students don't know:
1. **WHEN** errors should appear (real-time vs on-submit)
2. **WHAT TEXT** the error messages should contain
3. **WHAT BEHAVIOR** triggers errors (typing vs clicking)

## How It Works

The tool analyzes your exercise JSON and checks:

### 1. **Exact Text Expectations**
   - If a test expects `expected: "Submit"`, requirements must specify the exact button text
   - Prevents students guessing "Submit", "Send", "Save", etc.

### 2. **Contains Text Requirements**
   - If a test checks `contains: "@"`, requirements must mention what the error message should include
   - Ensures error messages are helpful and match test expectations

### 3. **Timing Requirements (CRITICAL)**
   - If tests use `actions` (typing/clicking), requirements must specify when validation happens
   - Example: "Error messages should appear in real-time as the user types"
   - vs. "Error messages should only appear after clicking Submit"

### 4. **Conditional Behavior**
   - If tests check for errors disappearing (`exists: false`), requirements should mention this
   - Example: "Error messages should disappear when the input becomes valid"

## Usage

### Step 1: Validate (Check for Issues)

```typescript
tutor_validate_exercise_requirements({
  exerciseId: "react-form-validator-test"
})
```

**Output:**
```
❌ Requirements need enhancement - run with autoFix=true to update

Critical issues: 3
Warnings: 1

🔴 CRITICAL ISSUES (will cause student confusion):

Test: "Shows email error for invalid email"
Problem: Test expects text containing "@" but requirements don't specify what the error message should contain
Suggested requirement: "Email error message must contain the text "@" to inform users what's required"

Test: "Shows password error for short password"
Problem: Test expects text containing "8" but requirements don't specify what the error message should contain
Suggested requirement: "Password error message must contain the text "8" to inform users of the requirement"

Test: "Shows email error for invalid email"
Problem: Test expects real-time validation (errors appear while typing) but requirements don't specify when errors should appear
Suggested requirement: "Error messages should appear in real-time as the user types (not just on form submission)"

⚠️  WARNINGS (nice to specify):

Test: "No email error when valid email typed"
Problem: Test expects error to disappear when input becomes valid, but requirements don't specify this behavior
Suggested requirement: "Error messages should disappear when the input becomes valid"
```

### Step 2: Auto-Fix (Apply Enhancements)

```typescript
tutor_validate_exercise_requirements({
  exerciseId: "react-form-validator-test",
  autoFix: true
})
```

**Output:**
```
✅ Exercise requirements have been enhanced and saved to react-form-validator-test.json

Previous requirement count: 9
New requirement count: 12

Added requirements:
1. Email error message must contain the text "@" to inform users what's required
2. Password error message must contain the text "8" to inform users of the requirement
3. Error messages should appear in real-time as the user types (not just on form submission)
```

## Integration with Exercise Creation

### Recommended Workflow

```typescript
// 1. Create exercise JSON file with tests
const exerciseJson = {
  id: "my-new-exercise",
  requirements: [
    "Create a form",
    "Add validation"  // ❌ Too vague!
  ],
  browserTests: [
    {
      name: "Shows error when typing invalid email",
      actions: [{ selector: "input", action: "type", value: "bad" }],
      then: { selector: "p", contains: "@" }
    }
  ]
}

// 2. VALIDATE FIRST (before creating starter file)
await tutor_validate_exercise_requirements({
  exerciseId: "my-new-exercise"
})

// 3. AUTO-FIX if issues found
await tutor_validate_exercise_requirements({
  exerciseId: "my-new-exercise",
  autoFix: true
})

// 4. NOW create the student file
await tutor_react_exercise_prompt({
  exerciseId: "my-new-exercise"
})
```

## Validation Rules

### Critical Issues (Must Fix)
- Missing exact text for buttons/labels that tests check
- Missing error message content that tests verify
- Missing timing specification when tests use actions (type/click)

### Warnings (Nice to Have)
- Missing conditional behavior (errors appearing/disappearing)
- Missing edge case specifications

## Example: Before vs After

### BEFORE (Vague Requirements)
```json
{
  "requirements": [
    "Show an error message if email is invalid",
    "Show an error message if password is too short"
  ]
}
```

**Student Confusion:**
- When should errors show? (typing? submit?)
- What should the error say?
- How do I know if my implementation is correct?

### AFTER (Specific Requirements)
```json
{
  "requirements": [
    "Email error message must contain the text '@' to inform users what's required",
    "Password error message must contain the text '8' to inform users of the requirement",
    "Error messages should appear in real-time as the user types (not just on form submission)",
    "Error messages should disappear when the input becomes valid"
  ]
}
```

**Student Clarity:**
- ✅ Knows exactly when errors appear (real-time)
- ✅ Knows what text to include in errors (@ and 8)
- ✅ Knows errors should clear when fixed
- ✅ Can implement confidently without trial-and-error

## Files Created

1. **`src/shared/exerciseRequirementsValidator.ts`**
   - Core validation logic
   - Analyzes requirements vs tests
   - Generates enhancement suggestions

2. **`src/tools/tutorValidateExerciseRequirements.ts`**
   - MCP tool wrapper
   - Reads/writes exercise JSON
   - Formats results for display

3. **Updated `src/server.ts`**
   - Registered new tool
   - Added to MCP server

## Testing

Test file created: `exercises/react-form-validator-test.json`

This demonstrates the tool with the original vague requirements from the form validator exercise before they were manually enhanced.

Run the tool to see it catch the issues and suggest enhancements!
