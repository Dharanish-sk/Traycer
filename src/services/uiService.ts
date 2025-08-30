import readline from "readline";
import chalk from "chalk";
import { Task, Plan } from "../types";

export class UIService {
  private rl: readline.Interface;

  constructor() {
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
  }

  async gatherRequirements(): Promise<string> {
    let requirements = "";
    let isValid = false;

    while (!isValid) {
      requirements = await this.collectUserInput();
      
      if (!requirements) {
        console.log(chalk.yellow("⚠️ No requirements provided. Please try again."));
        continue;
      }

      // This will be handled by the main class using GeminiService
      isValid = true;
    }

    return requirements;
  }

  private async collectUserInput(): Promise<string> {
    return new Promise((resolve) => {
      console.log(chalk.blue("\n💬 Describe your project requirements:"));
      console.log(chalk.gray("   - Be specific about what you want to build"));
      console.log(chalk.gray("   - Include technical details, features, and constraints"));
      console.log(chalk.gray("   - Type 'examples' to see good requirement examples"));
      console.log(chalk.gray("   - Type 'help' for more guidance"));
      console.log(chalk.gray("   - Type 'done' on a new line to finish\n"));
      
      let requirements = "";
      
      const handleInput = async (input: string) => {
        const trimmedInput = input.trim().toLowerCase();
        
        if (trimmedInput === "done") {
          this.rl.off('line', handleInput);
          resolve(requirements.trim());
        } else if (trimmedInput === "examples") {
          this.showExamples();
          process.stdout.write(chalk.gray("→ "));
        } else if (trimmedInput === "help") {
          this.showHelp();
          process.stdout.write(chalk.gray("→ "));
        } else {
          requirements += input + "\n";
          process.stdout.write(chalk.gray("→ "));
        }
      };
      
      this.rl.on('line', handleInput);
      process.stdout.write(chalk.gray("→ "));
    });
  }

  private showExamples(): void {
    console.log(chalk.cyan("\n📚 Examples of Good Requirements:"));
    console.log(chalk.gray("=" .repeat(50)));
    
    const examples = [
      {
        category: "Web Application",
        example: "Build a task management web app with React and TypeScript that allows users to:\n" +
                "- Create, edit, and delete tasks with due dates\n" +
                "- Organize tasks into projects and categories\n" +
                "- Mark tasks as complete with progress tracking\n" +
                "- Filter and search tasks by status, date, or project\n" +
                "- Dark/light theme toggle\n" +
                "- Data should persist in localStorage"
      },
      {
        category: "API Development",
        example: "Create a REST API with Node.js and Express for a blog system:\n" +
                "- User authentication with JWT tokens\n" +
                "- CRUD operations for blog posts (create, read, update, delete)\n" +
                "- Comment system for posts\n" +
                "- File upload for images\n" +
                "- Rate limiting and input validation\n" +
                "- MongoDB database integration\n" +
                "- API documentation with Swagger"
      },
      {
        category: "Feature Addition",
        example: "Add a real-time chat feature to my existing React e-commerce app:\n" +
                "- Live customer support chat widget\n" +
                "- Socket.io for real-time messaging\n" +
                "- Admin dashboard to manage conversations\n" +
                "- Message history and user identification\n" +
                "- Typing indicators and read receipts\n" +
                "- Integrate with existing user authentication system"
      }
    ];

    examples.forEach((ex, index) => {
      console.log(chalk.blue(`\n${index + 1}. ${ex.category}:`));
      console.log(chalk.gray(ex.example.split('\n').map(line => `   ${line}`).join('\n')));
    });

    console.log(chalk.cyan("\n💡 Notice how these requirements are:"));
    console.log(chalk.gray("   ✓ Specific about functionality"));
    console.log(chalk.gray("   ✓ Include technical stack preferences"));
    console.log(chalk.gray("   ✓ Break down into concrete features"));
    console.log(chalk.gray("   ✓ Mention integration points"));
    console.log(chalk.gray("=" .repeat(50)));
  }

  private showHelp(): void {
    console.log(chalk.cyan("\n🔧 How to Write Better Requirements:"));
    console.log(chalk.gray("=" .repeat(50)));
    
    console.log(chalk.blue("\n1. Start with the big picture:"));
    console.log(chalk.gray("   - What type of application/feature?"));
    console.log(chalk.gray("   - Who will use it?"));
    console.log(chalk.gray("   - What problem does it solve?"));
    
    console.log(chalk.blue("\n2. Be specific about functionality:"));
    console.log(chalk.gray("   - List main features as bullet points"));
    console.log(chalk.gray("   - Include user interactions (click, type, upload, etc.)"));
    console.log(chalk.gray("   - Mention data that needs to be stored/processed"));
    
    console.log(chalk.blue("\n3. Technical preferences (if any):"));
    console.log(chalk.gray("   - Programming language or framework"));
    console.log(chalk.gray("   - Database or storage solution"));
    console.log(chalk.gray("   - Existing code to integrate with"));
    
    console.log(chalk.blue("\n4. Constraints and requirements:"));
    console.log(chalk.gray("   - Performance needs"));
    console.log(chalk.gray("   - Security considerations"));
    console.log(chalk.gray("   - Browser/platform compatibility"));
    
    console.log(chalk.blue("\n5. Good phrases to use:"));
    console.log(chalk.green("   ✓ 'Users should be able to...'"));
    console.log(chalk.green("   ✓ 'The system needs to...'"));
    console.log(chalk.green("   ✓ 'Integration with...'"));
    console.log(chalk.green("   ✓ 'Built with [technology]...'"));
    
    console.log(chalk.red("\n❌ Avoid vague terms:"));
    console.log(chalk.gray("   × 'Make it look good'"));
    console.log(chalk.gray("   × 'Add some features'"));
    console.log(chalk.gray("   × 'Build something cool'"));
    console.log(chalk.gray("   × 'I need help with code'"));
    
    console.log(chalk.gray("=" .repeat(50)));
  }

  async confirmRequirements(requirements: string): Promise<boolean> {
    return new Promise((resolve) => {
      console.log(chalk.cyan("\n📋 Final Requirements Summary:"));
      console.log(chalk.gray("=" .repeat(60)));
      console.log(chalk.white(requirements));
      console.log(chalk.gray("=" .repeat(60)));
      
      console.log(chalk.blue("\n✓ These requirements look good and actionable!"));
      console.log(chalk.yellow("Do you want to proceed with planning? (y/n/edit)"));
      console.log(chalk.gray("   y - Yes, create the plan"));
      console.log(chalk.gray("   n - No, start over"));
      console.log(chalk.gray("   edit - Make small edits to these requirements"));
      
      this.rl.question(chalk.blue("Your choice: "), (choice) => {
        const input = choice.trim().toLowerCase();
        
        if (input === 'y' || input === 'yes') {
          resolve(true);
        } else if (input === 'edit') {
          this.editRequirements(requirements).then((editedRequirements) => {
            resolve(!!editedRequirements);
          });
        } else {
          resolve(false);
        }
      });
    });
  }

  private async editRequirements(currentRequirements: string): Promise<string | null> {
    return new Promise((resolve) => {
      console.log(chalk.blue("\n✏️ Edit your requirements:"));
      console.log(chalk.gray("Current requirements will be pre-filled. Make your changes and type 'done'.\n"));
      
      console.log(chalk.gray("Current text:"));
      console.log(chalk.white(currentRequirements));
      console.log(chalk.gray("\nAdd your changes below (or type 'cancel' to go back):"));
      
      let additions = "";
      
      const handleEdit = (input: string) => {
        if (input.trim().toLowerCase() === "done") {
          this.rl.off('line', handleEdit);
          resolve(additions ? currentRequirements + "\n" + additions : currentRequirements);
        } else if (input.trim().toLowerCase() === "cancel") {
          this.rl.off('line', handleEdit);
          resolve(null);
        } else {
          additions += input + "\n";
          process.stdout.write(chalk.gray("+ "));
        }
      };
      
      this.rl.on('line', handleEdit);
      process.stdout.write(chalk.gray("+ "));
    });
  }

  displayPlan(plan: Plan): void {
    console.log(chalk.cyan(`\n📋 PLAN: ${plan.title}`));
    console.log(chalk.gray(`${plan.description}\n`));
    
    console.log(chalk.blue("Tasks:"));
    plan.tasks.forEach((task, index) => {
      const priorityColor = task.priority === 'high' ? chalk.red : 
                           task.priority === 'medium' ? chalk.yellow : chalk.green;
      const statusIcon = task.status === 'completed' ? '✅' : 
                        task.status === 'in-progress' ? '🔄' : 
                        task.status === 'failed' ? '❌' : '⏳';
      
      console.log(`\n${index + 1}. ${statusIcon} ${chalk.bold(task.title)} ${priorityColor(`[${task.priority}]`)}`);
      console.log(`   ${chalk.gray(task.description)}`);
      console.log(`   ${chalk.gray(`Time: ${task.estimatedTime}`)}`);
      
      if (task.files.length > 0) {
        console.log(`   ${chalk.cyan(`Files: ${task.files.join(', ')}`)}`);
      }
      
      if (task.dependencies.length > 0) {
        console.log(`   ${chalk.magenta(`Depends on: ${task.dependencies.join(', ')}`)}`);
      }
    });
  }

  async getPlanReviewChoice(): Promise<string> {
    return new Promise((resolve) => {
      console.log(chalk.blue("\n🔄 Plan Review Options:"));
      console.log("1. Approve plan and proceed");
      console.log("2. Modify a specific task");
      console.log("3. Add a new task");
      console.log("4. Remove a task");
      console.log("5. Regenerate entire plan");
      console.log("6. Export plan to JSON file");
      
      this.rl.question(chalk.blue("Choose an option (1-6): "), (choice) => {
        resolve(choice.trim());
      });
    });
  }

  async getTaskToModify(plan: Plan): Promise<number> {
    return new Promise((resolve) => {
      console.log(chalk.blue("\nWhich task would you like to modify?"));
      plan.tasks.forEach((task, index) => {
        console.log(`${index + 1}. ${task.title}`);
      });
      
      this.rl.question("Task number: ", (taskNum) => {
        const taskIndex = parseInt(taskNum) - 1;
        resolve(taskIndex);
      });
    });
  }

  async getModificationRequest(): Promise<string> {
    return new Promise((resolve) => {
      this.rl.question("Modification request: ", (modification) => {
        resolve(modification);
      });
    });
  }

  async getNewTaskDescription(): Promise<string> {
    return new Promise((resolve) => {
      this.rl.question("Describe the new task: ", (taskDescription) => {
        resolve(taskDescription);
      });
    });
  }

  async getTaskToRemove(plan: Plan): Promise<number> {
    return new Promise((resolve) => {
      console.log(chalk.blue("\nWhich task would you like to remove?"));
      plan.tasks.forEach((task, index) => {
        console.log(`${index + 1}. ${task.title}`);
      });
      
      this.rl.question("Task number: ", (taskNum) => {
        const taskIndex = parseInt(taskNum) - 1;
        resolve(taskIndex);
      });
    });
  }

  async getVerificationFailureAction(): Promise<string> {
    return new Promise((resolve) => {
      console.log(chalk.cyan('\n🔄 Verification failed. What would you like to do?'));
      console.log('1. Retry with improved prompt');
      console.log('2. Accept the code anyway');
      console.log('3. Skip this task');
      console.log('4. Manual review (show code again)');
      
      this.rl.question(chalk.cyan('Choose action (1-4): '), (answer) => {
        switch (answer.trim()) {
          case '1':
            resolve('retry');
            break;
          case '2':
            resolve('accept');
            break;
          case '3':
            resolve('skip');
            break;
          case '4':
            resolve('review');
            break;
          default:
            console.log(chalk.red('Invalid choice, defaulting to retry...'));
            resolve('retry');
        }
      });
    });
  }

  showImprovementSuggestions(requirements: string): void {
    console.log(chalk.blue("\n📝 Suggestions to improve your requirements:"));
    
    const wordCount = requirements.split(/\s+/).length;
    const hasFeatures = /feature|function|allow|enable|support/i.test(requirements);
    const hasTech = /react|node|python|javascript|typescript|api|database/i.test(requirements);
    const hasActions = /create|build|add|implement|develop/i.test(requirements);
    
    if (wordCount < 10) {
      console.log(chalk.gray("   • Add more details about what you want to build"));
    }
    
    if (!hasFeatures) {
      console.log(chalk.gray("   • Describe specific features or functionality"));
      console.log(chalk.gray("     Example: 'users can login, create posts, and comment'"));
    }
    
    if (!hasTech) {
      console.log(chalk.gray("   • Mention preferred technologies if you have any"));
      console.log(chalk.gray("     Example: 'using React and Node.js'"));
    }
    
    if (!hasActions) {
      console.log(chalk.gray("   • Use action words like 'create', 'build', 'implement'"));
    }
    
    console.log(chalk.blue("\n💭 Ask yourself:"));
    console.log(chalk.gray("   • What exactly should users be able to do?"));
    console.log(chalk.gray("   • What data needs to be stored or processed?"));
    console.log(chalk.gray("   • Are there any existing systems to integrate with?"));
    console.log(chalk.gray("   • What's the main problem this solves?"));
  }

  close(): void {
    this.rl.close();
  }
}