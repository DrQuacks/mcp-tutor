import React, { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';

// Get exercise name from URL
const params = new URLSearchParams(window.location.search);
const exerciseName = params.get('exercise');

// Create global test progress API
window.__TEST_PROGRESS__ = {
  tests: [],
  currentIndex: -1,
  setTests: function(testNames) {
    this.tests = testNames.map(name => ({ name, status: 'pending' }));
    this.currentIndex = -1;
    this.render();
  },
  setCurrentTest: function(index) {
    this.currentIndex = index;
    this.render();
  },
  setTestResult: function(index, passed) {
    if (this.tests[index]) {
      this.tests[index].status = passed ? 'passed' : 'failed';
      this.render();
    }
  },
  render: function() {
    const container = document.getElementById('test-progress');
    if (!container) return;
    
    container.innerHTML = `
      <div style="
        position: fixed;
        top: 20px;
        right: 20px;
        background: white;
        border: 2px solid #ddd;
        border-radius: 8px;
        padding: 16px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        max-width: 350px;
        font-family: system-ui, -apple-system, sans-serif;
        z-index: 9999;
      ">
        <h3 style="margin: 0 0 12px 0; font-size: 16px; color: #333;">Test Progress</h3>
        <div style="display: flex; flex-direction: column; gap: 8px;">
          ${this.tests.map((test, i) => {
            const isRunning = i === this.currentIndex;
            const isPending = test.status === 'pending';
            const isPassed = test.status === 'passed';
            const isFailed = test.status === 'failed';
            
            return `
              <div style="
                display: flex;
                align-items: center;
                gap: 8px;
                padding: 8px;
                border-radius: 4px;
                background: ${isRunning ? '#fff3cd' : 'transparent'};
                border: 1px solid ${isRunning ? '#ffc107' : 'transparent'};
                ${isRunning ? 'font-weight: 600;' : ''}
              ">
                <span style="
                  font-size: 18px;
                  min-width: 24px;
                ">
                  ${isPending ? '⏸️' : isPassed ? '✅' : isFailed ? '❌' : ''}
                </span>
                <span style="
                  flex: 1;
                  font-size: 14px;
                  color: ${isPassed ? '#22c55e' : isFailed ? '#ef4444' : '#666'};
                  text-decoration: ${isPassed || isFailed ? 'line-through' : 'none'};
                ">
                  ${test.name}
                </span>
                ${isRunning ? '<span style="font-size: 12px; color: #f59e0b;">▶ Running</span>' : ''}
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
  }
};

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
