import { Task, VerificationResult, Plan } from "../types";
import { GeminiService } from "./geminiService";
import { UIService } from "./uiService";
import chalk from "chalk";

export class TaskExecutor {
  constructor(
    private geminiService: GeminiService,
    private uiService: UIService
  ) {}

  async executePlan(plan: Plan): Promise<void> {
    console.log(chalk.cyan(`\n🚀 Starting execution of plan: ${plan.title}`));
    plan.status = 'executing';

    for (const task of plan.tasks) {
      if (task.status === 'pending') {
        console.log(chalk.yellow(`\n- Executing task: ${task.title}`));
        const success = await this.executeTask(task);
        
        if (success) {
          console.log(chalk.green(`✅ Task "${task.title}" completed successfully.`));
        } else {
          console.log(chalk.red(`❌ Task "${task.title}" failed. Halting execution.`));
          plan.status = 'failed';
          return;
        }
      }
    }

    console.log(chalk.green(`\n🎉 Plan execution completed successfully!`));
    plan.status = 'completed';
  }

  private async executeTask(task: Task): Promise<boolean> {
    try {
      const executionPrompt = this.createExecutionPrompt(task);
      
      console.log(chalk.blue(`\n🔄 Generating code with Gemini for: ${task.title}...`));
      
      const response = await this.geminiService.generateContent(executionPrompt);
      const generatedCode = response;
      
      console.log(chalk.green('\n📝 Generated code:'));
      console.log(chalk.gray('═'.repeat(60)));
      console.log(generatedCode);
      console.log(chalk.gray('═'.repeat(60)));

      const verificationResult = await this.verifyTaskImplementation(task, generatedCode);
      
      if (verificationResult.passed) {
        console.log(chalk.green(`✅ Task verification passed! Score: ${verificationResult.score}/10`));
        task.status = 'completed';
        task.code = generatedCode;
        return true;
      } else {
        return await this.handleVerificationFailure(task, generatedCode, verificationResult);
      }
      
    } catch (error) {
      console.error(chalk.red(`❌ Error executing task: ${error}`));
      task.status = 'failed';
      return false;
    }
  }

  private createExecutionPrompt(task: Task): string {
    return `
You are an expert TypeScript developer. Implement this specific task with high-quality, production-ready code.

TASK: ${task.title}
DESCRIPTION: ${task.description}
PRIORITY: ${task.priority}
FILES TO MODIFY: ${task.files.join(', ')}

REQUIREMENTS:
- Write clean, maintainable TypeScript code
- Include proper error handling
- Add type definitions where needed
- Follow best practices
- Include comments for complex logic
- Make code production-ready

Please provide the complete implementation for this task.
`;
  }

  private async verifyTaskImplementation(task: Task, code: string): Promise<VerificationResult> {
    const verificationPrompt = `
You are a senior code reviewer. Analyze the following TypeScript implementation and provide a review in a structured JSON format.

TASK: ${task.title}
DESCRIPTION: ${task.description}

CODE TO REVIEW:
${code}

Provide your analysis as a single JSON object with the following properties:
- score (integer): A number from 1-10 rating the implementation quality.
- passed (boolean): True if the score is 8 or higher, indicating it meets requirements.
- issues (array of strings): A list of specific problems or bugs found in the code.
- suggestions (array of strings): A list of suggestions for improvement, following best practices.
- strengths (array of strings): A list of what the code does well.
- analysis (string): A comprehensive summary of your review.
`;

    const result = await this.geminiService.generateJsonContent<VerificationResult>(verificationPrompt);

    if (!result) {
      return {
        score: 0,
        passed: false,
        issues: ["Failed to parse verification result from Gemini."],
        suggestions: ["Check the Gemini API key and prompt structure."],
        analysis: "Verification failed due to an internal error."
      };
    }

    return result;
  }

  private async handleVerificationFailure(
    task: Task, 
    originalCode: string, 
    verificationResult: VerificationResult
  ): Promise<boolean> {
    console.log(chalk.red(`❌ Task verification failed! Score: ${verificationResult.score}/10`));
    console.log(chalk.yellow('\n⚠️ Issues:'));
    verificationResult.issues?.forEach(issue => {
      console.log(chalk.yellow(`   - ${issue}`));
    });
    
    console.log(chalk.blue('\n💡 Suggestions:'));
    verificationResult.suggestions?.forEach(suggestion => {
      console.log(chalk.blue(`   - ${suggestion}`));
    });

    const retryChoice = await this.uiService.getVerificationFailureAction();
    
    if (retryChoice === 'retry') {
      return await this.retryTaskExecution(task, verificationResult);
    } else if (retryChoice === 'accept') {
      console.log(chalk.yellow('⚠️ Accepting implementation despite issues...'));
      task.status = 'completed';
      task.code = originalCode;
      return true;
    } else if (retryChoice === 'skip') {
      console.log(chalk.gray('⏭️ Skipping this task...'));
      task.status = 'pending';
      return false;
    } else if (retryChoice === 'review') {
      console.log(chalk.blue('\n📝 Code Review:'));
      console.log(chalk.gray('═'.repeat(60)));
      console.log(originalCode);
      console.log(chalk.gray('═'.repeat(60)));
      return await this.handleVerificationFailure(task, originalCode, verificationResult);
    }
    
    task.status = 'failed';
    return false;
  }

  private async retryTaskExecution(task: Task, verificationResult: VerificationResult): Promise<boolean> {
    const improvedPrompt = `${this.createExecutionPrompt(task)}

PREVIOUS ATTEMPT HAD THESE ISSUES:
${verificationResult.issues?.map(issue => `- ${issue}`).join('\n')}

PLEASE ADDRESS THESE SUGGESTIONS:
${verificationResult.suggestions?.map(suggestion => `- ${suggestion}`).join('\n')}

Generate improved implementation that fixes these issues.
`;
    
    console.log(chalk.blue('\n🔄 Retrying with enhanced prompt...'));
    const retryResponse = await this.geminiService.generateContent(improvedPrompt);
    const improvedCode = retryResponse;
    
    console.log(chalk.green('\n📝 Improved implementation:'));
    console.log(chalk.gray('═'.repeat(60)));
    console.log(improvedCode);
    console.log(chalk.gray('═'.repeat(60)));
    
    const retryVerification = await this.verifyTaskImplementation(task, improvedCode);
    
    if (retryVerification.passed) {
      console.log(chalk.green(`🎉 Improved implementation passed! Score: ${retryVerification.score}/10`));
      task.status = 'completed';
      task.code = improvedCode;
      return true;
    } else {
      console.log(chalk.yellow(`⚠️ Retry still didn't pass. Score: ${retryVerification.score}/10`));
      task.status = 'failed';
      return false;
    }
  }
}