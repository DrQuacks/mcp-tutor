import { validateExerciseRequirements, formatValidationReport } from '../shared/exerciseRequirementsValidator.js';
import * as fs from 'fs';
import * as path from 'path';
import { z } from 'zod';
import type { ToolResponse } from '../shared/types.js';

interface ValidateExerciseArgs {
  exerciseId: string;
  autoFix?: boolean;
}

/**
 * Tool: tutor_validate_exercise_requirements
 * 
 * Validates that an exercise's requirements are specific enough to satisfy its tests.
 * Can optionally auto-fix by enhancing the requirements in the JSON file.
 * 
 * This should be called BEFORE creating the exercise file for students.
 */
export const tutorValidateExerciseRequirements = {
  name: 'tutor_validate_exercise_requirements',
  description: `Validates that an exercise's requirements are specific enough to pass its tests. 
  
  Checks for common issues:
  - Missing specification of exact text that tests expect
  - Missing timing requirements (real-time vs on-submit validation)
  - Missing conditional behavior (when errors should appear/disappear)
  - Vague error message requirements when tests check for specific content
  
  Use this tool BEFORE calling tutor_react_exercise_prompt to ensure students have clear, unambiguous requirements.
  
  If autoFix=true, this will update the exercise JSON file with enhanced requirements.`,
  
  inputSchema: z.object({
    exerciseId: z
      .string()
      .describe('The ID of the exercise to validate (e.g., "react-form-validator")'),
    autoFix: z
      .boolean()
      .optional()
      .describe('If true, automatically update the exercise JSON with enhanced requirements. Default: false')
  }),

  async execute(args: ValidateExerciseArgs): Promise<ToolResponse> {
    const { exerciseId, autoFix = false } = args;

    // Load exercise JSON
    const exercisePath = path.join(process.cwd(), 'exercises', `${exerciseId}.json`);
    
    if (!fs.existsSync(exercisePath)) {
      return {
        content: [{
          type: "text",
          text: `❌ Exercise file not found: ${exercisePath}\n\nMake sure the exerciseId is correct and the JSON file exists in the exercises/ folder.`
        }]
      };
    }

    const exerciseContent = fs.readFileSync(exercisePath, 'utf-8');
    const exercise = JSON.parse(exerciseContent);

    // Validate requirements against tests
    const result = validateExerciseRequirements(
      exercise.requirements || [],
      exercise.browserTests || []
    );

    // Generate report
    const report = formatValidationReport(result);

    // Auto-fix if requested
    if (autoFix && !result.isValid) {
      exercise.requirements = result.enhancedRequirements;
      fs.writeFileSync(exercisePath, JSON.stringify(exercise, null, 2), 'utf-8');
      
      const addedRequirements = result.enhancedRequirements.filter(
        req => !(exercise.requirements?.includes(req))
      );

      let message = `✅ Exercise requirements have been enhanced and saved to ${exerciseId}.json\n\n`;
      message += `**Previous requirement count:** ${exercise.requirements?.length || 0}\n`;
      message += `**New requirement count:** ${result.enhancedRequirements.length}\n\n`;
      message += `**Added requirements:**\n`;
      addedRequirements.forEach((req, i) => {
        message += `${i + 1}. ${req}\n`;
      });
      message += `\n${report}`;

      return {
        content: [{
          type: "text",
          text: message
        }]
      };
    }

    // Return validation result without fixing
    const criticalCount = result.issues.filter(i => i.severity === 'critical').length;
    const warningCount = result.issues.filter(i => i.severity === 'warning').length;

    let message = result.isValid 
      ? '✅ Requirements are specific enough for the tests\n\n'
      : `❌ Requirements need enhancement - run with autoFix=true to update\n\n**Critical issues:** ${criticalCount}\n**Warnings:** ${warningCount}\n\n`;
    
    message += report;

    return {
      content: [{
        type: "text",
        text: message
      }]
    };
  }
};
