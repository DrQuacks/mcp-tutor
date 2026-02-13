/**
 * Tests React solutions using Playwright browser automation
 */

import fs from "node:fs/promises";
import path from "node:path";
import { chromium, Browser } from "playwright";
import { EXERCISES_ROOT, NODE_ENV_ROOT, REACT_ENV_ROOT } from "../shared/constants.js";
import { getOrStartViteServer } from "../shared/vite.js";
import { formatExerciseResultsAndRecord } from "../shared/exerciseResults.js";
import type { ToolResponse } from "../shared/types.js";

export async function tutorReactCheckSolution({
  exerciseId,
  headless = false,
}: {
  exerciseId: string;
  headless?: boolean;
}): Promise<ToolResponse> {
  const exercisePath = path.join(EXERCISES_ROOT, `${exerciseId}.json`);

  let exerciseData: any;
  try {
    const content = await fs.readFile(exercisePath, "utf8");
    exerciseData = JSON.parse(content);
  } catch (err: any) {
    const tutorialPath = path.join(EXERCISES_ROOT, `tutorial-${exerciseId}.json`);
    try {
      await fs.access(tutorialPath);
      return {
        content: [
          {
            type: "text",
            text:
              `❌ '${exerciseId}' is a tutorial, not an exercise. ` +
              `Use tutor_check_tutorial_step with tutorialId '${exerciseId}'.`,
          },
        ],
      };
    } catch {
      // fall through to generic error
    }
    return {
      content: [
        {
          type: "text",
          text: `❌ Exercise '${exerciseId}' not found or invalid.`,
        },
      ],
    };
  }

  // Verify solution file exists
  const envRoot = exerciseData.environment === "node" ? NODE_ENV_ROOT : REACT_ENV_ROOT;
  const solutionPath = path.join(envRoot, exerciseData.filePath);

  try {
    await fs.access(solutionPath);
  } catch (err: any) {
    return {
      content: [
        {
          type: "text",
          text: `❌ Solution file not found at ${exerciseData.filePath}. Did you create the file?`,
        },
      ],
    };
  }

  let browser: Browser | undefined;
  
  try {
    // Start Vite server (reuses existing if already running)
    const { url } = await getOrStartViteServer();
    
    // Launch browser
    browser = await chromium.launch({ 
      headless,
      slowMo: headless ? 0 : 100, // Slow down actions in headed mode for visibility
    });
    
    // Create two separate contexts so they open as separate windows
    const progressContext = await browser.newContext({
      viewport: { width: 400, height: 600 }
    });
    const testContext = await browser.newContext({
      viewport: { width: 1200, height: 800 }
    });
    
    // Create progress window - a separate window for test progress UI
    const progressPage = await progressContext.newPage();
    
    const testNames = exerciseData.browserTests.map((t: any) => t.name);
    
    // Initialize progress window with HTML
    await progressPage.setContent(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Test Progress</title>
        <style>
          body {
            margin: 0;
            padding: 20px;
            font-family: system-ui, -apple-system, sans-serif;
            background: #f5f5f5;
          }
          h1 {
            margin: 0 0 20px 0;
            font-size: 20px;
            color: #333;
          }
          .test-list {
            display: flex;
            flex-direction: column;
            gap: 10px;
          }
          .test-item {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 12px;
            border-radius: 8px;
            background: white;
            border: 2px solid transparent;
            transition: all 0.2s;
          }
          .test-item.running {
            background: #fff3cd;
            border-color: #ffc107;
            font-weight: 600;
          }
          .test-icon {
            font-size: 24px;
            min-width: 30px;
            text-align: center;
          }
          .test-name {
            flex: 1;
            font-size: 14px;
            color: #666;
          }
          .test-name.passed {
            color: #22c55e;
            text-decoration: line-through;
          }
          .test-name.failed {
            color: #ef4444;
            text-decoration: line-through;
          }
          .test-status {
            font-size: 12px;
            color: #f59e0b;
            font-weight: 600;
          }
        </style>
      </head>
      <body>
        <h1>Test Progress</h1>
        <div class="test-list" id="test-list"></div>
        <script>
          window.updateProgress = function(currentIndex, results) {
            const testList = document.getElementById('test-list');
            const tests = ${JSON.stringify(testNames)};
            
            testList.innerHTML = tests.map((name, i) => {
              const isRunning = i === currentIndex;
              const isPending = i > currentIndex;
              const result = results[i];
              const isPassed = result?.passed === true;
              const isFailed = result?.passed === false;
              
              let icon = '⏸️';
              let statusClass = '';
              if (isPassed) {
                icon = '✅';
                statusClass = 'passed';
              } else if (isFailed) {
                icon = '❌';
                statusClass = 'failed';
              }
              
              return \`
                <div class="test-item \${isRunning ? 'running' : ''}">
                  <div class="test-icon">\${icon}</div>
                  <div class="test-name \${statusClass}">\${name}</div>
                  \${isRunning ? '<div class="test-status">▶ Running</div>' : ''}
                </div>
              \`;
            }).join('');
          };
          
          // Initialize with all pending
          window.updateProgress(-1, []);
        </script>
      </body>
      </html>
    `);
    
    const updateProgress = async (currentIndex: number, results: Array<{passed: boolean}>) => {
      await progressPage.evaluate(
        ({ index, testResults }) => {
          (window as any).updateProgress(index, testResults);
        },
        { index: currentIndex, testResults: results }
      );
    };
    
    // Create test execution page in separate window
    const page = await testContext.newPage();
    
    // Set shorter timeout for faster test failures (5 seconds instead of 30)
    page.setDefaultTimeout(5000);

    // Navigate to test harness with exercise component
    // Extract component name: 'react-counter' -> 'Counter'
    const componentName = exerciseId
      .replace('react-', '')
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join('');
    
    const testUrl = `${url}/test-harness.html?exercise=${componentName}`;
    await page.goto(testUrl, { waitUntil: 'networkidle' });

    // Wait for component to render
    await page.waitForTimeout(500);

    // Check for error message in test harness
    const errorDiv = await page.locator('#error.show');
    if (await errorDiv.count() > 0) {
      const errorText = await errorDiv.textContent();
      return {
        content: [
          {
            type: "text",
            text: `❌ Failed to load component:\n${errorText}`,
          },
        ],
      };
    }

    // Run browser tests
    const testResults: Array<{ name: string; passed: boolean; error?: string }> = [];
    
    for (let i = 0; i < exerciseData.browserTests.length; i++) {
      const test = exerciseData.browserTests[i];
      
      try {
        // Update progress window before starting test
        await updateProgress(i, testResults);
        
        // Reload page before each test for isolation
        // CRITICAL: Each test runs with a fresh component - no state persists between tests
        // When writing browserTests in exercise JSON, each test must be self-contained
        await page.reload({ waitUntil: 'networkidle' });
        await page.waitForTimeout(300);

        // Handle different test formats
        if (test.actions) {
          // Multiple actions test
          for (const action of test.actions) {
            if (action.action === 'click') {
              await page.locator(action.selector).click();
              await page.waitForTimeout(100);
            } else if (action.action === 'type') {
              await page.locator(action.selector).type(action.value);
              await page.waitForTimeout(100);
            }
          }
        } else if (test.action === 'click') {
          // Single click action
          await page.locator(test.selector).click();
          await page.waitForTimeout(100);
        } else if (test.action === 'type') {
          // Single type action
          await page.locator(test.selector).type(test.value);
          await page.waitForTimeout(100);
        }

        // Check assertion
        if (test.then) {
          const element = page.locator(test.then.selector).first();
          
          // Check if we're testing for element existence/non-existence
          if (test.then.exists !== undefined) {
            const count = await page.locator(test.then.selector).count();
            const exists = count > 0;
            if (exists !== test.then.exists) {
              throw new Error(`Expected element to ${test.then.exists ? 'exist' : 'not exist'}, but it ${exists ? 'exists' : 'does not exist'}`);
            }
          } else {
            const text = await element.textContent();
            
            if (test.then.contains) {
              if (!text?.includes(test.then.contains)) {
                throw new Error(`Expected text to contain "${test.then.contains}", but got "${text}"`);
              }
            } else if (test.then.expected) {
              if (text?.trim() !== test.then.expected) {
                throw new Error(`Expected "${test.then.expected}", but got "${text}"`);
              }
            }
          }
        } else if (test.expected) {
          // Direct assertion without action
          const element = page.locator(test.selector).first();
          const text = await element.textContent();
          
          if (!text?.includes(test.expected)) {
            throw new Error(`Expected text to contain "${test.expected}", but got "${text}"`);
          }
        } else if (test.exists !== undefined) {
          // Check if element exists or not (for conditionally rendered elements)
          const count = await page.locator(test.selector).count();
          const exists = count > 0;
          if (exists !== test.exists) {
            throw new Error(`Expected element to ${test.exists ? 'exist' : 'not exist'}, but it ${exists ? 'exists' : 'does not exist'}`);
          }
        }

        testResults.push({ name: test.name, passed: true });
        
        // Update progress window with success
        await updateProgress(i, testResults);
        
        // Pause to see the result
        await page.waitForTimeout(headless ? 0 : 800);
        
      } catch (err: any) {
        testResults.push({ 
          name: test.name, 
          passed: false, 
          error: err.message 
        });
        
        // Update progress window with failure
        await updateProgress(i, testResults);
        
        // Pause to see the error
        await page.waitForTimeout(headless ? 0 : 800);
      }
    }

    // Final update to show all tests complete
    await updateProgress(testResults.length - 1, testResults);
    
    // Keep browser open briefly to see final results
    if (!headless) {
      await page.waitForTimeout(2000);
    }

    await browser.close();

    return await formatExerciseResultsAndRecord({
      exerciseId,
      exerciseTitle: exerciseData.title,
      environment: exerciseData.environment,
      testResults,
      showSolutionToolName: "tutor_react_show_solution",
    });

  } catch (err: any) {
    if (browser) {
      await browser.close();
    }
    
    return {
      content: [
        {
          type: "text",
          text: `❌ Error running tests: ${err.message}`,
        },
      ],
    };
  }
}
