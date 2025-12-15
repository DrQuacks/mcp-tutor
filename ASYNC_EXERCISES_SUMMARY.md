# New Async/Data Fetching Interview Materials

## Overview
Added comprehensive async data fetching content to interview prep based on Worktrace's requirements for handling async flows with loading states, error handling, and user interactions.

## What Was Added

### 1. Tutorial: Data Fetching with useEffect and Try/Catch
**File**: `exercises/tutorial-react-fetch-trycatch.json` (already existed)
**Status**: Ready to use
**Key Concepts**:
- Setting up state for data, loading, and errors
- Using useEffect with empty dependency array for fetch-on-mount
- Async/await with try/catch/finally pattern
- Conditional rendering based on loading/error/data states
- Proper TypeScript typing with interfaces

**What Students Learn**:
- The foundational "useState + useEffect + fetch" pattern
- How to manage the three key states: loading, error, data
- Why useEffect is needed (prevents infinite loops)
- How to handle errors gracefully with try/catch
- When to use finally blocks for cleanup

### 2. Exercise: Task Dashboard with Async Data Fetching
**File**: `exercises/react-task-dashboard.json`
**Difficulty**: Intermediate
**Estimated Time**: 30 minutes
**Test Count**: 10 browser tests

**Requirements Met** (per Worktrace spec):
✅ Mock API with simulated network delay (1 second)
✅ Shows loading state during fetch
✅ Handles error state with user-friendly messages
✅ Renders results when resolved
✅ **Bonus**: Refresh button to reload data
✅ **Bonus**: Client-side filtering/sorting

**Key Features**:
- Mock `fetchTasks()` function with 1-second delay
- Random error simulation (20% failure rate) to practice error handling
- Loading state: "Loading tasks..." message
- Error state: Error message + "Retry" button
- Success state: Task list with filtering
- Refresh functionality via button click
- Status filter dropdown (All, Pending, In Progress, Completed)
- TypeScript Task interface with proper typing

**What Interviewers Look For** (addressed):
✅ Clear use of useEffect for fetch on mount
✅ Proper cleanup / basic error handling
✅ Avoiding anti-patterns (state updates after unmount handled in finally block)
✅ Separate loading state management
✅ User-friendly error messages
✅ Ability to recover from errors (retry/refresh)

### 3. Tutorial: React Query for Data Fetching
**File**: `exercises/tutorial-react-reactquery.json` (already existed)
**Status**: Ready to use
**Key Concepts**:
- Modern data fetching with React Query (TanStack Query)
- Automatic caching and background refetching
- Simplified state management (no manual loading/error states)
- Query keys for cache management
- Advanced patterns for production apps

### 4. Exercise: Async Todo List with Server Sync
**File**: `exercises/react-todo-async.json`
**Difficulty**: Advanced
**Estimated Time**: 35 minutes
**Test Count**: 8 browser tests

**Advanced Concepts**:
- **Optimistic Updates**: Update UI immediately, then sync with server
- **Rollback on Error**: Restore previous state if server fails
- **Async Mutations**: Add/delete operations with server calls
- **Error Recovery**: Save user input on failure (UX best practice)
- **Multiple Loading States**: Overall + per-operation submitting state

**Key Features**:
- Mock API with random failures (30% for add, 20% for delete)
- Optimistic add: Todo appears immediately, replaced with server response
- Optimistic delete: Todo disappears immediately, restored on error
- Error banner with dismiss functionality
- Input state preservation on failure
- Disabled states during async operations
- Form submission handling with preventDefault

**Why This Is Advanced**:
- Teaches patterns used in production apps (like Twitter's instant like/unlike)
- Handles race conditions implicitly
- Demonstrates proper UX during async operations
- Shows how to maintain consistency between UI and server state

## Interview Prep Roadmap

The interview prep now follows this progression:

### Track A: Interactive UI Components
1. ✅ **Filterable List** → `react-ticket-filter` exercise (COMPLETED)
2. ✅ **Sort & Pagination** → `react-sortable-table` exercise (COMPLETED)
3. **Form Validation** → `react-form-validator` exercise (NEXT)

### Track B: Data Fetching & Async Behavior (NEW)
4. **Basic Async** → `react-fetch-trycatch` tutorial → `react-task-dashboard` exercise
5. **Advanced Async** → `react-reactquery` tutorial → `react-todo-async` exercise

## Updated Stats
- **Tutorials**: 5 total (3 completed, 2 new)
- **Exercises**: 5 total (2 completed, 3 remaining)
- **New Content**: 2 exercises focused on async patterns

## Testing Notes

### Task Dashboard Tests
All tests use Playwright with proper wait times for async operations:
- Initial loading state verification
- Post-load content checks (2s wait for 1s API delay)
- Filter interaction tests
- Task count validation
- Proper selectors for accessibility

### Async Todo Tests
Focus on optimistic behavior:
- Immediate UI updates (100ms wait - optimistic)
- Server sync verification
- Error state handling
- Form interaction
- Delete rollback scenarios

## Recommended Order for Student

1. Complete `react-form-validator` (finish Track A)
2. Take `react-fetch-trycatch` tutorial (learn basics)
3. Do `react-task-dashboard` exercise (practice basics)
4. Take `react-reactquery` tutorial (learn modern approach)
5. Do `react-todo-async` exercise (advanced patterns)

## Why This Matches Worktrace's Needs

**From the spec**: "Worktrace is an AI agent that 'watches your work and automates tasks,' they'll care that you can handle async flows nicely."

Our exercises demonstrate:
- ✅ Professional error handling (not just try/catch, but UX considerations)
- ✅ Loading states that inform users
- ✅ Recovery mechanisms (retry, refresh, rollback)
- ✅ Optimistic updates (feels fast despite async)
- ✅ Type safety with TypeScript
- ✅ Clean separation of concerns (API layer, state management, UI)
- ✅ Production-ready patterns (not toy examples)

This prepares students for real-world scenarios where:
- Network requests fail intermittently
- Users expect immediate feedback
- State must stay consistent
- UX matters during loading/errors
- TypeScript catches bugs early
