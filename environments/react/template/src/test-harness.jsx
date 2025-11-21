import React, { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';

// Get exercise name from URL
const params = new URLSearchParams(window.location.search);
const exerciseName = params.get('exercise');

async function loadAndRenderExercise() {
  const root = document.getElementById('root');
  
  if (!exerciseName) {
    root.innerHTML = '<div style="color: red; padding: 20px;">Error: No exercise specified. Add ?exercise=ComponentName to URL</div>';
    return;
  }

  try {
    // Dynamically import the exercise component
    const module = await import(`./exercises/${exerciseName}.jsx`);
    const Component = module.default;

    if (!Component) {
      throw new Error(`Component ${exerciseName} has no default export`);
    }

    // Render the component
    const rootElement = createRoot(root);
    rootElement.render(
      <StrictMode>
        <Component />
      </StrictMode>
    );
  } catch (error) {
    console.error(error);
    root.innerHTML = `<div style="color: red; padding: 20px;">Error loading ${exerciseName}: ${error.message}</div>`;
  }
}

loadAndRenderExercise();
