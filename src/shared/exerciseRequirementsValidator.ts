/**
 * Exercise Requirements Validator
 * 
 * Analyzes browserTests and requirements to ensure requirements are specific enough
 * to guide students toward passing the tests without ambiguity.
 */

interface BrowserTest {
  name: string;
  selector?: string;
  exists?: boolean;
  expected?: string;
  contains?: string;
  action?: string;
  value?: string;
  actions?: Array<{ selector: string; action: string; value?: string }>;
  then?: {
    selector: string;
    exists?: boolean;
    expected?: string;
    contains?: string;
  };
}

interface ValidationIssue {
  testName: string;
  issue: string;
  suggestedRequirement: string;
  severity: 'critical' | 'warning';
}

interface ValidationResult {
  isValid: boolean;
  issues: ValidationIssue[];
  enhancedRequirements: string[];
}

/**
 * Validates that requirements are specific enough to satisfy tests
 */
export function validateExerciseRequirements(
  requirements: string[],
  browserTests: BrowserTest[]
): ValidationResult {
  const issues: ValidationIssue[] = [];
  const enhancedRequirements = [...requirements];

  for (const test of browserTests) {
    // Check for exact text expectations
    if (test.expected && !testHasMatchingRequirement(requirements, test.expected)) {
      issues.push({
        testName: test.name,
        issue: `Test expects exact text "${test.expected}" but requirements don't specify this`,
        suggestedRequirement: generateTextRequirement(test),
        severity: 'critical'
      });
    }

    // Check for text contains expectations
    if (test.then?.contains && !testHasContainsRequirement(requirements, test.then.contains)) {
      issues.push({
        testName: test.name,
        issue: `Test expects text containing "${test.then.contains}" but requirements don't specify what the error message should contain`,
        suggestedRequirement: generateContainsRequirement(test),
        severity: 'critical'
      });
    }

    // Check for real-time validation (typing triggers errors)
    if (test.actions && test.then && !testHasTimingRequirement(requirements)) {
      issues.push({
        testName: test.name,
        issue: `Test expects real-time validation (errors appear while typing) but requirements don't specify when errors should appear`,
        suggestedRequirement: 'Error messages should appear in real-time as the user types (not just on form submission)',
        severity: 'critical'
      });
    }

    // Check for conditional rendering expectations
    if (test.then?.exists === false && !testHasConditionalRequirement(requirements)) {
      issues.push({
        testName: test.name,
        issue: `Test expects error to disappear when input becomes valid, but requirements don't specify this behavior`,
        suggestedRequirement: 'Error messages should disappear when the input becomes valid',
        severity: 'warning'
      });
    }
  }

  // Add enhanced requirements based on issues
  for (const issue of issues) {
    if (issue.severity === 'critical' && !enhancedRequirements.includes(issue.suggestedRequirement)) {
      enhancedRequirements.push(issue.suggestedRequirement);
    }
  }

  return {
    isValid: issues.filter(i => i.severity === 'critical').length === 0,
    issues,
    enhancedRequirements
  };
}

function testHasMatchingRequirement(requirements: string[], expectedText: string): boolean {
  return requirements.some(req => 
    req.toLowerCase().includes(expectedText.toLowerCase()) ||
    req.includes(`text '${expectedText}'`) ||
    req.includes(`text "${expectedText}"`)
  );
}

function testHasContainsRequirement(requirements: string[], containsText: string): boolean {
  return requirements.some(req => 
    req.toLowerCase().includes(containsText.toLowerCase()) &&
    (req.toLowerCase().includes('error') || req.toLowerCase().includes('message'))
  );
}

function testHasTimingRequirement(requirements: string[]): boolean {
  const timingKeywords = ['real-time', 'as the user types', 'immediately', 'while typing', 'on change'];
  return requirements.some(req => 
    timingKeywords.some(keyword => req.toLowerCase().includes(keyword))
  );
}

function testHasConditionalRequirement(requirements: string[]): boolean {
  const conditionalKeywords = ['disappear', 'hide', 'remove', 'clear', 'when valid'];
  return requirements.some(req => 
    conditionalKeywords.some(keyword => req.toLowerCase().includes(keyword))
  );
}

function generateTextRequirement(test: BrowserTest): string {
  if (test.selector?.includes('button') && test.expected) {
    return `Render a ${test.selector} with text '${test.expected}'`;
  }
  return `Element matching '${test.selector}' should display text '${test.expected}'`;
}

function generateContainsRequirement(test: BrowserTest): string {
  const contains = test.then?.contains || '';
  
  // Detect what the test is validating
  if (test.actions) {
    const action = test.actions[0];
    if (action.selector.includes('email')) {
      return `Email error message must contain the text "${contains}" to inform users what's required`;
    }
    if (action.selector.includes('password')) {
      return `Password error message must contain the text "${contains}" to inform users of the requirement`;
    }
  }
  
  return `Error message should contain "${contains}" to clearly indicate the requirement`;
}

/**
 * Generates a formatted report of validation issues
 */
export function formatValidationReport(result: ValidationResult): string {
  if (result.isValid) {
    return '✅ All requirements are specific enough to satisfy tests';
  }

  let report = '❌ Requirements need enhancement:\n\n';
  
  const criticalIssues = result.issues.filter(i => i.severity === 'critical');
  const warnings = result.issues.filter(i => i.severity === 'warning');

  if (criticalIssues.length > 0) {
    report += '🔴 CRITICAL ISSUES (will cause student confusion):\n';
    for (const issue of criticalIssues) {
      report += `\nTest: "${issue.testName}"\n`;
      report += `Problem: ${issue.issue}\n`;
      report += `Suggested requirement: "${issue.suggestedRequirement}"\n`;
    }
  }

  if (warnings.length > 0) {
    report += '\n⚠️  WARNINGS (nice to specify):\n';
    for (const issue of warnings) {
      report += `\nTest: "${issue.testName}"\n`;
      report += `Problem: ${issue.issue}\n`;
      report += `Suggested requirement: "${issue.suggestedRequirement}"\n`;
    }
  }

  report += '\n📝 ENHANCED REQUIREMENTS:\n';
  result.enhancedRequirements.forEach((req, i) => {
    report += `${i + 1}. ${req}\n`;
  });

  return report;
}
