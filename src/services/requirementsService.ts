import { GeminiService } from "./geminiService";
import { UIService } from "./uiService";
import chalk from "chalk";

export class RequirementsService {
  constructor(
    private geminiService: GeminiService,
    private uiService: UIService
  ) {}

  async gatherAndValidateRequirements(): Promise<string> {
    let requirements = "";
    let isValid = false;

    while (!isValid) {
      requirements = await this.uiService.gatherRequirements();
      
      if (!requirements) {
        console.log(chalk.yellow("⚠️ No requirements provided. Please try again."));
        continue;
      }

      console.log(chalk.yellow("\n🔍 Analyzing requirement clarity..."));
      isValid = await this.validateRequirements(requirements);
      
      if (!isValid) {
        console.log(chalk.red("\n❌ Requirements need more clarity. Let's try again.\n"));
      } else {
        console.log(chalk.green("✅ Requirements are clear and actionable!"));
      }
    }

    return requirements;
  }

  private async validateRequirements(requirements: string): Promise<boolean> {
    const { isValid, feedback } = await this.geminiService.validateRequirements(requirements);
    
    if (!isValid) {
      const feedbackMatch = feedback.match(/INVALID:\s*(.+)/i);
      if (feedbackMatch) {
        console.log(chalk.yellow("\n💡 Here's what needs improvement:"));
        console.log(chalk.yellow(`   ${feedbackMatch[1]}`));
        this.uiService.showImprovementSuggestions(requirements);
      }
    } else {
      const feedbackMatch = feedback.match(/VALID:\s*(.+)/i);
      if (feedbackMatch) {
        console.log(chalk.green(`   ${feedbackMatch[1]}`));
      }
      const confirmed = await this.uiService.confirmRequirements(requirements);
      return confirmed;
    }
    
    return isValid;
  }
}