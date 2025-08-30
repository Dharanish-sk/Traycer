#!/usr/bin/env node

import {TracerLite} from "./TracerLite";

// Run the application
async function main() {
  const traycer = new TracerLite();
  await traycer.run();
}

if (require.main === module) {
  main().catch(console.error);
}

export default TracerLite;






















// import { GoogleGenerativeAI } from "@google/generative-ai";
// import readline from "readline";
// import dotenv from "dotenv";
// import fs from "fs/promises";
// import path from "path";
// import chalk from "chalk";

// dotenv.config();

// interface Task {
//   id: string;
//   title: string;
//   description: string;
//   files: string[];
//   dependencies: string[];
//   status: 'pending' | 'in-progress' | 'completed' | 'failed';
//   estimatedTime: string;
//   priority: 'low' | 'medium' | 'high';
//   code?: string;
// }

// interface VerificationResult {
//   score: number;
//   passed: boolean;
//   issues?: string[];
//   suggestions?: string[];
//   strengths?: string[];
//   analysis: string;
// }

// interface Plan {
//   id: string;
//   title: string;
//   description: string;
//   tasks: Task[];
//   created: Date;
//   updated: Date;
//   status: 'draft' | 'approved' | 'executing' | 'completed' | 'failed';
// }

// class TracerLite {
//   private genAI: GoogleGenerativeAI;
//   private model: any;
//   private rl: readline.Interface;
//   private currentPlan: Plan | null = null;
//   private projectPath: string;

//   constructor() {
//     if (!process.env.GEMINI_KEY) {
//       console.error(chalk.red("Error: GEMINI_KEY is not set in environment variables."));
//       process.exit(1);
//     }

//     this.genAI = new GoogleGenerativeAI(process.env.GEMINI_KEY);
//     this.model = this.genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
//     this.rl = readline.createInterface({
//       input: process.stdin,
//       output: process.stdout,
//     });
//     this.projectPath = process.cwd();
//   }

//   private async askGemini(prompt: string): Promise<string> {
//     try {
//       const result = await this.model.generateContent(prompt);
//       return result.response.text();
//     } catch (error) {
//       console.error(chalk.red("Error calling Gemini API:"), error);
//       return "";
//     }
//   }

//   private async askGeminiWithJson<T>(prompt: string): Promise<T | null> {
//     try {
//       const model = this.genAI.getGenerativeModel({
//         model: "gemini-1.5-flash",
//         generationConfig: {
//           responseMimeType: "application/json",
//         },
//       });
//       const result = await model.generateContent(prompt);
//       const jsonResponse = JSON.parse(result.response.text());
//       return jsonResponse as T;
//     } catch (error) {
//       console.error(chalk.red("Error generating or parsing JSON from Gemini:"), error);
//       return null;
//     }
//   }

//   private async analyzeCodebase(): Promise<string> {
//     try {
//       const files = await this.getProjectFiles();
//       let codebaseContext = "=== CODEBASE ANALYSIS ===\n";
      
//       for (const file of files.slice(0, 10)) {
//         try {
//           const content = await fs.readFile(file, 'utf-8');
//           const relativePath = path.relative(this.projectPath, file);
//           codebaseContext += `\n--- ${relativePath} ---\n`;
//           codebaseContext += content.slice(0, 1000) + (content.length > 1000 ? '\n...[truncated]' : '');
//         } catch (error) {
//           console.warn(chalk.yellow(`Could not read file: ${file}`));
//         }
//       }
      
//       return codebaseContext;
//     } catch (error) {
//       console.warn(chalk.yellow("Could not analyze codebase, proceeding without context"));
//       return "";
//     }
//   }

//   private async getProjectFiles(): Promise<string[]> {
//     const files: string[] = [];
//     const extensions = ['.ts', '.js', '.tsx', '.jsx', '.py', '.java', '.cpp', '.c', '.cs', '.go', '.rs'];
    
//     const traverseDir = async (dirPath: string): Promise<void> => {
//       const entries = await fs.readdir(dirPath, { withFileTypes: true });
      
//       for (const entry of entries) {
//         const fullPath = path.join(dirPath, entry.name);
        
//         if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
//           await traverseDir(fullPath);
//         } else if (entry.isFile() && extensions.some(ext => entry.name.endsWith(ext))) {
//           files.push(fullPath);
//         }
//       }
//     };
    
//     await traverseDir(this.projectPath);
//     return files;
//   }

//   private async gatherRequirements(): Promise<string> {
//     let requirements = "";
//     let isValid = false;

//     while (!isValid) {
//       requirements = await this.collectUserInput();
      
//       if (!requirements) {
//         console.log(chalk.yellow("⚠️ No requirements provided. Please try again."));
//         continue;
//       }

//       console.log(chalk.yellow("\n🔍 Analyzing requirement clarity..."));
//       isValid = await this.validateRequirements(requirements);
      
//       if (!isValid) {
//         console.log(chalk.red("\n❌ Requirements need more clarity. Let's try again.\n"));
//       } else {
//         console.log(chalk.green("✅ Requirements are clear and actionable!"));
//       }
//     }

//     return requirements;
//   }

//   private async collectUserInput(): Promise<string> {
//     return new Promise((resolve) => {
//       console.log(chalk.blue("\n💬 Describe your project requirements:"));
//       console.log(chalk.gray("   - Be specific about what you want to build"));
//       console.log(chalk.gray("   - Include technical details, features, and constraints"));
//       console.log(chalk.gray("   - Type 'examples' to see good requirement examples"));
//       console.log(chalk.gray("   - Type 'help' for more guidance"));
//       console.log(chalk.gray("   - Type 'done' on a new line to finish\n"));
      
//       let requirements = "";
      
//       const handleInput = async (input: string) => {
//         const trimmedInput = input.trim().toLowerCase();
        
//         if (trimmedInput === "done") {
//           this.rl.off('line', handleInput);
//           resolve(requirements.trim());
//         } else if (trimmedInput === "examples") {
//           this.showExamples();
//           process.stdout.write(chalk.gray("→ "));
//         } else if (trimmedInput === "help") {
//           this.showHelp();
//           process.stdout.write(chalk.gray("→ "));
//         } else {
//           requirements += input + "\n";
//           process.stdout.write(chalk.gray("→ "));
//         }
//       };
      
//       this.rl.on('line', handleInput);
//       process.stdout.write(chalk.gray("→ "));
//     });
//   }

//   private showExamples(): void {
//     console.log(chalk.cyan("\n📚 Examples of Good Requirements:"));
//     console.log(chalk.gray("=" .repeat(50)));
    
//     const examples = [
//       {
//         category: "Web Application",
//         example: "Build a task management web app with React and TypeScript that allows users to:\n" +
//                 "- Create, edit, and delete tasks with due dates\n" +
//                 "- Organize tasks into projects and categories\n" +
//                 "- Mark tasks as complete with progress tracking\n" +
//                 "- Filter and search tasks by status, date, or project\n" +
//                 "- Dark/light theme toggle\n" +
//                 "- Data should persist in localStorage"
//       },
//       {
//         category: "API Development",
//         example: "Create a REST API with Node.js and Express for a blog system:\n" +
//                 "- User authentication with JWT tokens\n" +
//                 "- CRUD operations for blog posts (create, read, update, delete)\n" +
//                 "- Comment system for posts\n" +
//                 "- File upload for images\n" +
//                 "- Rate limiting and input validation\n" +
//                 "- MongoDB database integration\n" +
//                 "- API documentation with Swagger"
//       },
//       {
//         category: "Feature Addition",
//         example: "Add a real-time chat feature to my existing React e-commerce app:\n" +
//                 "- Live customer support chat widget\n" +
//                 "- Socket.io for real-time messaging\n" +
//                 "- Admin dashboard to manage conversations\n" +
//                 "- Message history and user identification\n" +
//                 "- Typing indicators and read receipts\n" +
//                 "- Integrate with existing user authentication system"
//       }
//     ];

//     examples.forEach((ex, index) => {
//       console.log(chalk.blue(`\n${index + 1}. ${ex.category}:`));
//       console.log(chalk.gray(ex.example.split('\n').map(line => `   ${line}`).join('\n')));
//     });

//     console.log(chalk.cyan("\n💡 Notice how these requirements are:"));
//     console.log(chalk.gray("   ✓ Specific about functionality"));
//     console.log(chalk.gray("   ✓ Include technical stack preferences"));
//     console.log(chalk.gray("   ✓ Break down into concrete features"));
//     console.log(chalk.gray("   ✓ Mention integration points"));
//     console.log(chalk.gray("=" .repeat(50)));
//   }

//   private showHelp(): void {
//     console.log(chalk.cyan("\n🔧 How to Write Better Requirements:"));
//     console.log(chalk.gray("=" .repeat(50)));
    
//     console.log(chalk.blue("\n1. Start with the big picture:"));
//     console.log(chalk.gray("   - What type of application/feature?"));
//     console.log(chalk.gray("   - Who will use it?"));
//     console.log(chalk.gray("   - What problem does it solve?"));
    
//     console.log(chalk.blue("\n2. Be specific about functionality:"));
//     console.log(chalk.gray("   - List main features as bullet points"));
//     console.log(chalk.gray("   - Include user interactions (click, type, upload, etc.)"));
//     console.log(chalk.gray("   - Mention data that needs to be stored/processed"));
    
//     console.log(chalk.blue("\n3. Technical preferences (if any):"));
//     console.log(chalk.gray("   - Programming language or framework"));
//     console.log(chalk.gray("   - Database or storage solution"));
//     console.log(chalk.gray("   - Existing code to integrate with"));
    
//     console.log(chalk.blue("\n4. Constraints and requirements:"));
//     console.log(chalk.gray("   - Performance needs"));
//     console.log(chalk.gray("   - Security considerations"));
//     console.log(chalk.gray("   - Browser/platform compatibility"));
    
//     console.log(chalk.blue("\n5. Good phrases to use:"));
//     console.log(chalk.green("   ✓ 'Users should be able to...'"));
//     console.log(chalk.green("   ✓ 'The system needs to...'"));
//     console.log(chalk.green("   ✓ 'Integration with...'"));
//     console.log(chalk.green("   ✓ 'Built with [technology]...'"));
    
//     console.log(chalk.red("\n❌ Avoid vague terms:"));
//     console.log(chalk.gray("   × 'Make it look good'"));
//     console.log(chalk.gray("   × 'Add some features'"));
//     console.log(chalk.gray("   × 'Build something cool'"));
//     console.log(chalk.gray("   × 'I need help with code'"));
    
//     console.log(chalk.gray("=" .repeat(50)));
//   }

//   private async validateRequirements(requirements: string): Promise<boolean> {
//     const validationPrompt = `
// You are a requirements analyst. Evaluate if the following project requirements are clear and actionable enough to create a detailed implementation plan.

// REQUIREMENTS:
// ${requirements}

// Check for these criteria:
// 1. CLARITY: Is it clear what needs to be built?
// 2. SPECIFICITY: Are there specific features or functionality mentioned?
// 3. TECHNICAL SCOPE: Is the technical scope reasonably defined?
// 4. ACTIONABILITY: Can a developer understand what to implement?
// 5. COMPLETENESS: Are there enough details to break into concrete tasks?

// VALIDATION RULES:
// - Requirements should be more than just a single sentence or vague idea
// - Should include specific features, functionality, or technical details
// - Should not be just "build an app" or "create a website" without context
// - Should provide enough detail for planning concrete implementation steps
// - Should be at least 20 words and contain actionable verbs

// Respond with either:
// "VALID: [brief explanation of why it's actionable]"
// or
// "INVALID: [specific feedback on what's missing or unclear]"

// Examples of INVALID requirements:
// - "Build a website" (too vague, no features specified)
// - "Create an app" (no functionality described)
// - "Make something cool" (no technical scope)
// - "I need help with coding" (not a requirement)
// - "Fix my code" (no context about what needs fixing)

// Examples of VALID requirements:
// - "Build a todo app with React that allows users to add, edit, delete tasks and mark them complete"
// - "Create a REST API with Node.js for user authentication including login, register, and JWT tokens"
// - "Implement a dark mode toggle feature in my existing React component library with theme persistence"
// - "Add a shopping cart feature to my e-commerce site with add/remove items and checkout flow"
// `;

//     const validation = await this.askGemini(validationPrompt);
//     const isValid = validation.toLowerCase().includes("valid:");
    
//     if (!isValid) {
//       const feedbackMatch = validation.match(/INVALID:\s*(.+)/i);
//       if (feedbackMatch) {
//         console.log(chalk.yellow("\n💡 Here's what needs improvement:"));
//         console.log(chalk.yellow(`   ${feedbackMatch[1]}`));
//         this.showImprovementSuggestions(requirements);
//       }
//     } else {
//       const feedbackMatch = validation.match(/VALID:\s*(.+)/i);
//       if (feedbackMatch) {
//         console.log(chalk.green(`   ${feedbackMatch[1]}`));
//       }
//       const confirmed = await this.confirmRequirements(requirements);
//       return confirmed;
//     }
    
//     return isValid;
//   }

//   private showImprovementSuggestions(requirements: string): void {
//     console.log(chalk.blue("\n📝 Suggestions to improve your requirements:"));
    
//     const wordCount = requirements.split(/\s+/).length;
//     const hasFeatures = /feature|function|allow|enable|support/i.test(requirements);
//     const hasTech = /react|node|python|javascript|typescript|api|database/i.test(requirements);
//     const hasActions = /create|build|add|implement|develop/i.test(requirements);
    
//     if (wordCount < 10) {
//       console.log(chalk.gray("   • Add more details about what you want to build"));
//     }
    
//     if (!hasFeatures) {
//       console.log(chalk.gray("   • Describe specific features or functionality"));
//       console.log(chalk.gray("     Example: 'users can login, create posts, and comment'"));
//     }
    
//     if (!hasTech) {
//       console.log(chalk.gray("   • Mention preferred technologies if you have any"));
//       console.log(chalk.gray("     Example: 'using React and Node.js'"));
//     }
    
//     if (!hasActions) {
//       console.log(chalk.gray("   • Use action words like 'create', 'build', 'implement'"));
//     }
    
//     console.log(chalk.blue("\n💭 Ask yourself:"));
//     console.log(chalk.gray("   • What exactly should users be able to do?"));
//     console.log(chalk.gray("   • What data needs to be stored or processed?"));
//     console.log(chalk.gray("   • Are there any existing systems to integrate with?"));
//     console.log(chalk.gray("   • What's the main problem this solves?"));
//   }

//   private async confirmRequirements(requirements: string): Promise<boolean> {
//     return new Promise((resolve) => {
//       console.log(chalk.cyan("\n📋 Final Requirements Summary:"));
//       console.log(chalk.gray("=" .repeat(60)));
//       console.log(chalk.white(requirements));
//       console.log(chalk.gray("=" .repeat(60)));
      
//       console.log(chalk.blue("\n✓ These requirements look good and actionable!"));
//       console.log(chalk.yellow("Do you want to proceed with planning? (y/n/edit)"));
//       console.log(chalk.gray("   y - Yes, create the plan"));
//       console.log(chalk.gray("   n - No, start over"));
//       console.log(chalk.gray("   edit - Make small edits to these requirements"));
      
//       this.rl.question(chalk.blue("Your choice: "), async (choice) => {
//         const input = choice.trim().toLowerCase();
        
//         if (input === 'y' || input === 'yes') {
//           resolve(true);
//         } else if (input === 'edit') {
//           const editedRequirements = await this.editRequirements(requirements);
//           if (editedRequirements) {
//             resolve(await this.validateRequirements(editedRequirements));
//           } else {
//             resolve(false);
//           }
//         } else {
//           resolve(false);
//         }
//       });
//     });
//   }

//   private async editRequirements(currentRequirements: string): Promise<string | null> {
//     return new Promise((resolve) => {
//       console.log(chalk.blue("\n✏️ Edit your requirements:"));
//       console.log(chalk.gray("Current requirements will be pre-filled. Make your changes and type 'done'.\n"));
      
//       let editedRequirements = currentRequirements;
//       console.log(chalk.gray("Current text:"));
//       console.log(chalk.white(currentRequirements));
//       console.log(chalk.gray("\nAdd your changes below (or type 'cancel' to go back):"));
      
//       let additions = "";
      
//       const handleEdit = (input: string) => {
//         if (input.trim().toLowerCase() === "done") {
//           this.rl.off('line', handleEdit);
//           resolve(additions ? currentRequirements + "\n" + additions : currentRequirements);
//         } else if (input.trim().toLowerCase() === "cancel") {
//           this.rl.off('line', handleEdit);
//           resolve(null);
//         } else {
//           additions += input + "\n";
//           process.stdout.write(chalk.gray("+ "));
//         }
//       };
      
//       this.rl.on('line', handleEdit);
//       process.stdout.write(chalk.gray("+ "));
//     });
//   }

//   private async createPlan(requirements: string): Promise<Plan> {
//     console.log(chalk.yellow("\n🔍 Analyzing codebase..."));
//     const codebaseContext = await this.analyzeCodebase();
    
//     console.log(chalk.yellow("📋 Creating detailed plan..."));
    
//     const planningPrompt = `
// You are Traycer, an expert planning agent that creates detailed implementation plans for coding projects.

// CODEBASE CONTEXT:
// ${codebaseContext}

// USER REQUIREMENTS:
// ${requirements}

// Create a comprehensive plan that includes:
// 1. Project title and description
// 2. Detailed tasks broken down into implementable steps
// 3. File dependencies for each task
// 4. Task dependencies (what must be done before what)
// 5. Estimated time for each task
// 6. Priority levels
// 7. Specific implementation guidance

// Format your response as JSON with this structure:
// {
//   "title": "Project Title",
//   "description": "Detailed project description",
//   "tasks": [
//     {
//       "id": "task-1",
//       "title": "Task Title",
//       "description": "Detailed description of what needs to be done",
//       "files": ["file1.ts", "file2.ts"],
//       "dependencies": ["task-0"],
//       "estimatedTime": "30 minutes",
//       "priority": "high"
//     }
//   ]
// }

// Make the plan actionable and specific. Each task should be clear enough that a coding agent can implement it without ambiguity.
// `;

//     const planResponse = await this.askGemini(planningPrompt);
    
//     try {
//       const jsonMatch = planResponse.match(/\{[\s\S]*\}/);
//       const planData = JSON.parse(jsonMatch ? jsonMatch[0] : planResponse);
      
//       const plan: Plan = {
//         id: `plan-${Date.now()}`,
//         title: planData.title,
//         description: planData.description,
//         tasks: planData.tasks.map((task: any, index: number) => ({
//           id: task.id || `task-${index}`,
//           title: task.title,
//           description: task.description,
//           files: task.files || [],
//           dependencies: task.dependencies || [],
//           status: 'pending' as const,
//           estimatedTime: task.estimatedTime || "30 minutes",
//           priority: task.priority || 'medium' as const
//         })),
//         created: new Date(),
//         updated: new Date(),
//         status: 'draft'
//       };
      
//       return plan;
//     } catch (error) {
//       console.error(chalk.red("Error parsing plan response"), error);
//       return {
//         id: `plan-${Date.now()}`,
//         title: "Manual Implementation Plan",
//         description: requirements,
//         tasks: [{
//           id: "task-1",
//           title: "Implement requirements",
//           description: requirements,
//           files: [],
//           dependencies: [],
//           status: 'pending',
//           estimatedTime: "60 minutes",
//           priority: 'high'
//         }],
//         created: new Date(),
//         updated: new Date(),
//         status: 'draft'
//       };
//     }
//   }

//   private displayPlan(plan: Plan): void {
//     console.log(chalk.cyan(`\n📋 PLAN: ${plan.title}`));
//     console.log(chalk.gray(`${plan.description}\n`));
    
//     console.log(chalk.blue("Tasks:"));
//     plan.tasks.forEach((task, index) => {
//       const priorityColor = task.priority === 'high' ? chalk.red : 
//                            task.priority === 'medium' ? chalk.yellow : chalk.green;
//       const statusIcon = task.status === 'completed' ? '✅' : 
//                         task.status === 'in-progress' ? '🔄' : 
//                         task.status === 'failed' ? '❌' : '⏳';
      
//       console.log(`\n${index + 1}. ${statusIcon} ${chalk.bold(task.title)} ${priorityColor(`[${task.priority}]`)}`);
//       console.log(`   ${chalk.gray(task.description)}`);
//       console.log(`   ${chalk.gray(`Time: ${task.estimatedTime}`)}`);
      
//       if (task.files.length > 0) {
//         console.log(`   ${chalk.cyan(`Files: ${task.files.join(', ')}`)}`);
//       }
      
//       if (task.dependencies.length > 0) {
//         console.log(`   ${chalk.magenta(`Depends on: ${task.dependencies.join(', ')}`)}`);
//       }
//     });
//   }

//   private async reviewAndIteratePlan(plan: Plan): Promise<Plan> {
//     this.displayPlan(plan);
    
//     return new Promise((resolve) => {
//       console.log(chalk.blue("\n🔄 Plan Review Options:"));
//       console.log("1. Approve plan and proceed");
//       console.log("2. Modify a specific task");
//       console.log("3. Add a new task");
//       console.log("4. Remove a task");
//       console.log("5. Regenerate entire plan");
//       console.log("6. Export plan to JSON file");
      
//       const handleChoice = async (choice: string) => {
//         this.rl.off('line', handleChoice);
        
//         switch (choice.trim()) {
//           case '1':
//             plan.status = 'approved';
//             await this.executePlan(plan);
//             resolve(plan);
//             break;
//           case '2':
//             const modifiedPlan = await this.modifyTask(plan);
//             resolve(await this.reviewAndIteratePlan(modifiedPlan));
//             break;
//           case '3':
//             const planWithNewTask = await this.addTask(plan);
//             resolve(await this.reviewAndIteratePlan(planWithNewTask));
//             break;
//           case '4':
//             const planWithRemovedTask = await this.removeTask(plan);
//             resolve(await this.reviewAndIteratePlan(planWithRemovedTask));
//             break;
//           case '5':
//             console.log(chalk.yellow("Regenerating plan..."));
//             const requirements = await this.gatherRequirements();
//             const newPlan = await this.createPlan(requirements);
//             resolve(await this.reviewAndIteratePlan(newPlan));
//             break;
//           case '6':
//             await this.exportPlan(plan);
//             resolve(await this.reviewAndIteratePlan(plan));
//             break;
//           default:
//             console.log(chalk.red("Invalid choice. Please try again."));
//             this.rl.question(chalk.blue("Choose an option (1-6): "), handleChoice);
//         }
//       };
      
//       this.rl.question(chalk.blue("Choose an option (1-6): "), handleChoice);
//     });
//   }

//   private async modifyTask(plan: Plan): Promise<Plan> {
//     return new Promise((resolve) => {
//       console.log(chalk.blue("\nWhich task would you like to modify?"));
//       plan.tasks.forEach((task, index) => {
//         console.log(`${index + 1}. ${task.title}`);
//       });
      
//       this.rl.question("Task number: ", async (taskNum) => {
//         const taskIndex = parseInt(taskNum) - 1;
//         if (taskIndex >= 0 && taskIndex < plan.tasks.length) {
//           console.log(chalk.blue("What changes would you like to make to this task?"));
          
//           this.rl.question("Modification request: ", async (modification) => {
//             const modificationPrompt = `
// Modify the following task based on the user's request:

// CURRENT TASK:
// ${JSON.stringify(plan.tasks[taskIndex], null, 2)}

// USER REQUEST:
// ${modification}

// Return the modified task as JSON with the same structure.
// `;
            
//             const response = await this.askGemini(modificationPrompt);
//             try {
//               const jsonMatch = response.match(/\{[\s\S]*\}/);
//               const modifiedTask = JSON.parse(jsonMatch ? jsonMatch[0] : response);
//               plan.tasks[taskIndex] = { ...plan.tasks[taskIndex], ...modifiedTask };
//               plan.updated = new Date();
//               console.log(chalk.green("✅ Task modified successfully!"));
//             } catch (error) {
//               console.log(chalk.red("Error modifying task, keeping original"));
//             }
            
//             resolve(plan);
//           });
//         } else {
//           console.log(chalk.red("Invalid task number"));
//           resolve(plan);
//         }
//       });
//     });
//   }

//   private async addTask(plan: Plan): Promise<Plan> {
//     return new Promise((resolve) => {
//       this.rl.question("Describe the new task: ", async (taskDescription) => {
//         const newTaskPrompt = `
// Create a new task for the project plan based on this description: ${taskDescription}

// Return a JSON object with this structure:
// {
//   "title": "Task Title",
//   "description": "Detailed description",
//   "files": ["relevant files"],
//   "dependencies": ["dependent task IDs"],
//   "estimatedTime": "time estimate",
//   "priority": "low/medium/high"
// }
// `;
        
//         const response = await this.askGemini(newTaskPrompt);
//         try {
//           const jsonMatch = response.match(/\{[\s\S]*\}/);
//           const newTaskData = JSON.parse(jsonMatch ? jsonMatch[0] : response);
//           const newTask: Task = {
//             id: `task-${Date.now()}`,
//             ...newTaskData,
//             status: 'pending'
//           };
          
//           plan.tasks.push(newTask);
//           plan.updated = new Date();
//           console.log(chalk.green("✅ Task added successfully!"));
//         } catch (error) {
//           console.log(chalk.red("Error adding task"));
//         }
        
//         resolve(plan);
//       });
//     });
//   }

//   private async removeTask(plan: Plan): Promise<Plan> {
//     return new Promise((resolve) => {
//       console.log(chalk.blue("\nWhich task would you like to remove?"));
//       plan.tasks.forEach((task, index) => {
//         console.log(`${index + 1}. ${task.title}`);
//       });
      
//       this.rl.question("Task number: ", (taskNum) => {
//         const taskIndex = parseInt(taskNum) - 1;
//         if (taskIndex >= 0 && taskIndex < plan.tasks.length) {
//           plan.tasks.splice(taskIndex, 1);
//           plan.updated = new Date();
//           console.log(chalk.green("✅ Task removed successfully!"));
//         } else {
//           console.log(chalk.red("Invalid task number"));
//         }
        
//         resolve(plan);
//       });
//     });
//   }

//   private async exportPlan(plan: Plan): Promise<void> {
//     try {
//       const fileName = `traycer-plan-${plan.id}.json`;
//       await fs.writeFile(fileName, JSON.stringify(plan, null, 2));
//       console.log(chalk.green(`✅ Plan exported to ${fileName}`));
//     } catch (error) {
//       console.error(chalk.red("Error exporting plan:"), error);
//     }
//   }

//   private async executePlan(plan: Plan): Promise<void> {
//     console.log(chalk.cyan(`\n🚀 Starting execution of plan: ${plan.title}`));
//     plan.status = 'executing';

//     for (const task of plan.tasks) {
//         if (task.status === 'pending') {
//             console.log(chalk.yellow(`\n- Executing task: ${task.title}`));
//             const success = await this.executeTaskWithGemini(task);
//             if (success) {
//                 console.log(chalk.green(`✅ Task "${task.title}" completed successfully.`));
//             } else {
//                 console.log(chalk.red(`❌ Task "${task.title}" failed. Halting execution.`));
//                 plan.status = 'failed';
//                 return;
//             }
//         }
//     }

//     console.log(chalk.green(`\n🎉 Plan execution completed successfully!`));
//     plan.status = 'completed';
//     await this.saveOutputToFile(plan);
//   }

//   private async executeTaskWithGemini(task: Task): Promise<boolean> {
//     try {
//       const executionPrompt = `
// You are an expert TypeScript developer. Implement this specific task with high-quality, production-ready code.

// TASK: ${task.title}
// DESCRIPTION: ${task.description}
// PRIORITY: ${task.priority}
// FILES TO MODIFY: ${task.files.join(', ')}

// REQUIREMENTS:
// - Write clean, maintainable TypeScript code
// - Include proper error handling
// - Add type definitions where needed
// - Follow best practices
// - Include comments for complex logic
// - Make code production-ready

// Please provide the complete implementation for this task.
// `;
//       console.log(chalk.blue(`\n🔄 Generating code with Gemini for: ${task.title}...`));
      
//       const response = await this.askGemini(executionPrompt);
//       const generatedCode = response;
      
//       console.log(chalk.green('\n📝 Generated code:'));
//       console.log(chalk.gray('═'.repeat(60)));
//       console.log(generatedCode);
//       console.log(chalk.gray('═'.repeat(60)));

//       const verificationResult = await this.verifyTaskImplementation(task, generatedCode);
      
//       if (verificationResult.passed) {
//         console.log(chalk.green(`✅ Task verification passed! Score: ${verificationResult.score}/10`));
//         task.status = 'completed';
//         return true;
//       } else {
//         console.log(chalk.red(`❌ Task verification failed! Score: ${verificationResult.score}/10`));
//         console.log(chalk.yellow('\n⚠️ Issues:'));
//         verificationResult.issues?.forEach(issue => {
//           console.log(chalk.yellow(`   - ${issue}`));
//         });
        
//         console.log(chalk.blue('\n💡 Suggestions:'));
//         verificationResult.suggestions?.forEach(suggestion => {
//           console.log(chalk.blue(`   - ${suggestion}`));
//         });

//         const retryChoice = await this.handleVerificationFailure();
        
//         if (retryChoice === 'retry') {
//           const improvedPrompt = `${executionPrompt}

// PREVIOUS ATTEMPT HAD THESE ISSUES:
// ${verificationResult.issues?.map(issue => `- ${issue}`).join('\n')}

// PLEASE ADDRESS THESE SUGGESTIONS:
// ${verificationResult.suggestions?.map(suggestion => `- ${suggestion}`).join('\n')}

// Generate improved implementation that fixes these issues.
// `;
//           console.log(chalk.blue('\n🔄 Retrying with enhanced prompt...'));
//           const retryResponse = await this.askGemini(improvedPrompt);
//           const improvedCode = retryResponse;
          
//           console.log(chalk.green('\n📝 Improved implementation:'));
//           console.log(chalk.gray('═'.repeat(60)));
//           console.log(improvedCode);
//           console.log(chalk.gray('═'.repeat(60)));
          
//           const retryVerification = await this.verifyTaskImplementation(task, improvedCode);
          
//           if (retryVerification.passed) {
//             console.log(chalk.green(`🎉 Improved implementation passed! Score: ${retryVerification.score}/10`));
//             task.status = 'completed';
//             return true;
//           } else {
//             console.log(chalk.yellow(`⚠️ Retry still didn't pass. Score: ${retryVerification.score}/10`));
//           }
//         } else if (retryChoice === 'accept') {
//           console.log(chalk.yellow('⚠️ Accepting implementation despite issues...'));
//           task.status = 'completed';
//           return true;
//         } else if (retryChoice === 'skip') {
//           console.log(chalk.gray('⏭️ Skipping this task...'));
//           task.status = 'pending';
//           return false;
//         }
        
//         task.status = 'failed';
//         return false;
//       }
      
//     } catch (error) {
//       console.error(chalk.red(`❌ Error executing task: ${error}`));
//       task.status = 'failed';
//       return false;
//     }
//   }

//   private async handleVerificationFailure(): Promise<string> {
//     return new Promise((resolve) => {
//       console.log(chalk.cyan('\n🔄 Verification failed. What would you like to do?'));
//       console.log('1. Retry with improved prompt');
//       console.log('2. Accept the code anyway');
//       console.log('3. Skip this task');
//       console.log('4. Manual review (show code again)');
      
//       const rl = readline.createInterface({
//         input: process.stdin,
//         output: process.stdout
//       });
      
//       rl.question(chalk.cyan('Choose action (1-4): '), (answer) => {
//         rl.close();
//         switch (answer.trim()) {
//           case '1':
//             resolve('retry');
//             break;
//           case '2':
//             resolve('accept');
//             break;
//           case '3':
//             resolve('skip');
//             break;
//           case '4':
//             resolve('review');
//             break;
//           default:
//             console.log(chalk.red('Invalid choice, defaulting to retry...'));
//             resolve('retry');
//         }
//       });
//     });
//   }

//   private async verifyTaskImplementation(task: Task, code: string): Promise<VerificationResult> {
//     const verificationPrompt = `
// You are a senior code reviewer. Analyze the following TypeScript implementation and provide a review in a structured JSON format.

// TASK: ${task.title}
// DESCRIPTION: ${task.description}

// CODE TO REVIEW:
// ${code}

// Provide your analysis as a single JSON object with the following properties:
// - score (integer): A number from 1-10 rating the implementation quality.
// - passed (boolean): True if the score is 8 or higher, indicating it meets requirements.
// - issues (array of strings): A list of specific problems or bugs found in the code.
// - suggestions (array of strings): A list of suggestions for improvement, following best practices.
// - strengths (array of strings): A list of what the code does well.
// - analysis (string): A comprehensive summary of your review.
// `;

//     const result = await this.askGeminiWithJson<VerificationResult>(verificationPrompt);

//     if (!result) {
//         return {
//             score: 0,
//             passed: false,
//             issues: ["Failed to parse verification result from Gemini."],
//             suggestions: ["Check the Gemini API key and prompt structure."],
//             analysis: "Verification failed due to an internal error."
//         };
//     }

//     return result;
//   }
  
//   // New method to save the plan's output to a file
//   private async saveOutputToFile(plan: Plan): Promise<void> {
//     try {
//       // Get the current working directory from which the script was executed
//       const currentWorkingDirectory = process.cwd();
//       const outputFileName = `traycer-output-${plan.id}.txt`;
//       const outputPath = path.join(currentWorkingDirectory, outputFileName);

//       let content = `
// ========================================
//     Traycer AI Execution Summary
// ========================================

// Project: ${plan.title}
// Status: ${plan.status}
// Date: ${new Date().toLocaleString()}

// ----------------------------------------
// Tasks Executed:
// ----------------------------------------
// `;
      
//       plan.tasks.forEach((task, index) => {
//         content += `
//   [${index + 1}] Task: ${task.title}
//   Status: ${task.status}
//   Description: ${task.description}
//   ----------------------------------------
// `;
//       });
      
//       // Use fs.promises.writeFile to write the string content to the file
//       await fs.writeFile(outputPath, content);
      
//       console.log(chalk.green(`\n✅ Program output saved to: ${outputPath}`));
//     } catch (error) {
//       console.error(chalk.red(`\n❌ Failed to save output file: ${error}`));
//     }
//   }

//   public async run(): Promise<void> {
//     try {
//       console.log(chalk.blue("--- 🤖 Traycer AI Software Agent ---"));
//       console.log(chalk.blue("A generative AI tool for code project planning and execution."));
      
//       const requirements = await this.gatherRequirements();
      
//       console.log(chalk.blue("\n🧠 Creating comprehensive plan..."));
//       const plan = await this.createPlan(requirements);
//       this.currentPlan = plan;
      
//       const approvedPlan = await this.reviewAndIteratePlan(plan);
//       // Execution is now handled within the reviewAndIteratePlan method
      
//     } catch (error) {
//       console.error(chalk.red("An error occurred:"), error);
//     } finally {
//       this.rl.close();
//     }
//   }
// }

// // Run the application
// if (require.main === module) {
//   const traycer = new TracerLite();
//   traycer.run().catch(console.error);
// }

// export default TracerLite;

