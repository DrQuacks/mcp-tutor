# React Mastery Tutorial Series

A comprehensive series of 5 tutorials designed to take you from intermediate to advanced React understanding. Focus on lifecycle, hooks, and performance optimization.

## Tutorial Series Overview

### 1. **useEffect and Component Lifecycle** (`tutorial-react-useeffect-lifecycle`)
**Duration:** 5 steps | **Difficulty:** Intermediate

Master useEffect by understanding the complete component lifecycle:
- **Step 1:** Import useEffect and add mount effect
- **Step 2:** Control when effects run with dependency arrays
- **Step 3:** Add cleanup functions for unmount
- **Step 4:** Track state changes with dependencies
- **Step 5:** Handle object dependencies correctly (avoid infinite loops)

**Key Learning:**
- When effects run in the React lifecycle
- Mount vs unmount vs update phases
- Cleanup functions and why they matter
- Dependency array pitfalls with objects/arrays
- Preventing infinite loops with non-primitive values

**Prerequisites:** Comfortable with useState

---

### 2. **useRef - Refs and Mutable Values** (`tutorial-react-useref`)
**Duration:** 4 steps | **Difficulty:** Intermediate

Master useRef for DOM access and persistent mutable values:
- **Step 1:** Create refs to access DOM elements (focus management)
- **Step 2:** Store mutable values without triggering re-renders (timer IDs)
- **Step 3:** Track previous state values (before/after comparisons)
- **Step 4:** Understand useRef vs useState (when to use each)

**Key Learning:**
- Direct DOM manipulation in React
- Storing values that persist across renders
- ref.current doesn't trigger re-renders
- When to use refs vs state
- Common patterns: intervals, previous values, DOM measurements

**Prerequisites:** Comfortable with useState and useEffect

---

### 3. **Custom Hooks - Rules and Patterns** (`tutorial-react-custom-hooks`)
**Duration:** 4 steps | **Difficulty:** Intermediate to Advanced

Learn to write reusable custom hooks following React's rules:
- **Step 1:** Create your first custom hook (useCounter)
- **Step 2:** Understand the Rules of Hooks (what's allowed/forbidden)
- **Step 3:** Compose hooks together (building complex from simple)
- **Step 4:** Return values and API design (arrays vs objects)

**Key Learning:**
- Rules of Hooks and why they exist
- Extracting reusable stateful logic
- Naming convention (must start with 'use')
- Hook composition patterns
- API design for custom hooks
- When to extract logic into hooks

**Prerequisites:** Comfortable with useState, useEffect, and useRef

---

### 4. **React Render Cycle and Component Lifecycle** (`tutorial-react-render-cycle`)
**Duration:** 5 steps | **Difficulty:** Advanced

Understand React's internal rendering process and optimization:
- **Step 1:** What triggers a render (state, props, context)
- **Step 2:** Render phase vs Commit phase (when DOM updates)
- **Step 3:** Reconciliation algorithm (keys and diffing)
- **Step 4:** Batching and asynchronous updates (setState timing)
- **Step 5:** Preventing unnecessary renders (React.memo)

**Key Learning:**
- Complete mental model of React's render cycle
- When and why components re-render
- How React decides what to update in the DOM
- Why keys matter in lists
- setState is asynchronous and batched
- When to use React.memo

**Prerequisites:** Solid understanding of useState and component composition

---

### 5. **useMemo and useCallback - Performance Optimization** (`tutorial-react-usememo`)
**Duration:** 5 steps | **Difficulty:** Advanced

Master React's memoization hooks for performance:
- **Step 1:** Understand when useMemo is needed (expensive calculations)
- **Step 2:** Optimize with useMemo (dependency arrays)
- **Step 3:** useMemo with objects and arrays (stable references)
- **Step 4:** useCallback for stable function references
- **Step 5:** Dependencies in useCallback (avoiding stale closures)

**Key Learning:**
- When to optimize (profile first!)
- useMemo vs useCallback differences
- Dependency arrays with complex values
- Closure traps and stale values
- Updater form pattern: setState(prev => prev + 1)
- Premature optimization vs necessary optimization

**Prerequisites:** Comfortable with useEffect, React.memo, and render cycle concepts

---

## Recommended Learning Path

### Option 1: Linear Progression (Recommended)
Complete tutorials in order 1→2→3→4→5. Each builds on concepts from previous tutorials.

**Timeline:** ~2-3 hours total
- Tutorial 1: 30-40 minutes
- Tutorial 2: 25-30 minutes  
- Tutorial 3: 30-40 minutes
- Tutorial 4: 35-45 minutes
- Tutorial 5: 35-45 minutes

### Option 2: Topic-Based
Focus on specific areas based on your needs:

**For Lifecycle Understanding:**
1. useEffect and Component Lifecycle
2. React Render Cycle
3. useMemo and useCallback

**For Hook Mastery:**
1. useRef
2. Custom Hooks
3. useMemo and useCallback

**For Performance Optimization:**
1. React Render Cycle
2. useMemo and useCallback

---

## Getting Started

### Start a Tutorial

```typescript
// Example: Start the useEffect lifecycle tutorial
tutor_start_tutorial({
  tutorialId: "react-useeffect-lifecycle"
})
```

### Check Your Work

After completing each step:
```typescript
tutor_check_tutorial_step({
  tutorialId: "react-useeffect-lifecycle"
})
```

### Need Help?

Get progressive hints:
```typescript
tutor_tutorial_hint({
  tutorialId: "react-useeffect-lifecycle"
})
```

---

## Key Concepts Covered

### Lifecycle Concepts
- ✅ Component mount/unmount/update phases
- ✅ When effects run vs when components render
- ✅ Cleanup functions and their timing
- ✅ Render phase vs commit phase
- ✅ Reconciliation and diffing algorithm

### Hook Mastery
- ✅ useEffect dependency arrays
- ✅ useRef for DOM and mutable values
- ✅ Custom hooks and composition
- ✅ useMemo for expensive calculations
- ✅ useCallback for stable function references

### Common Pitfalls
- ✅ Infinite loops with object dependencies
- ✅ Stale closures in callbacks
- ✅ Missing cleanup functions
- ✅ Premature optimization
- ✅ Breaking the Rules of Hooks

### Best Practices
- ✅ When to use each hook
- ✅ Dependency array patterns
- ✅ Updater function pattern
- ✅ Custom hook API design
- ✅ Performance profiling before optimization

---

## After Completing This Series

You will have a deep understanding of:
1. **React's lifecycle** - when things happen and why
2. **All major hooks** - useEffect, useRef, useMemo, useCallback, custom hooks
3. **Performance optimization** - when and how to optimize
4. **Render cycle** - what triggers renders and how to prevent unnecessary ones
5. **Best practices** - patterns that prevent bugs and improve maintainability

### Next Steps
- Apply these concepts to real projects
- Build complex custom hooks
- Profile and optimize actual performance bottlenecks
- Explore advanced patterns: compound components, render props, higher-order components
- Deep dive into React Server Components and Suspense

---

## Tutorial Files

All tutorial files are validated and ready to use:
- ✅ `tutorial-react-useeffect-lifecycle.json`
- ✅ `tutorial-react-useref.json`
- ✅ `tutorial-react-custom-hooks.json`
- ✅ `tutorial-react-render-cycle.json`
- ✅ `tutorial-react-usememo.json`

Each tutorial has been validated for pedagogical best practices and contains no copy-paste solution code in task descriptions.

---

**Happy Learning! 🚀**
