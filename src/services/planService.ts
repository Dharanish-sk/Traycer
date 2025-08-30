import { Plan, Task } from "../types";
import { GeminiService } from "./geminiService";
import { generateId, validateTask, extractJsonFromResponse } from "../utils/helpers";
import { ErrorHandler, ErrorType } from "../utils/errorHandler";
import { logger } from "../utils/logger";
import chalk from "chalk";

export class PlanService {
  constructor(private geminiService: GeminiService) {
    logger.info("PlanService initialized", undefined, "PlanService");
  }

  async createPlan(requirements: string, codebaseContext: string): Promise<Plan> {
    logger.info("Creating new plan", { requirementsLength: requirements.length }, "PlanService");
    console.log(chalk.yellow("📋 Creating detailed plan..."));
    
    const planningPrompt = this.buildPlanningPrompt(requirements, codebaseContext);
    
    const planResponse = await ErrorHandler.handleAsyncOperation(
      () => this.geminiService.generateContent(planningPrompt),
      ErrorType.API_ERROR,
      { operation: "createPlan" }
    );

    if (!planResponse) {
      logger.error("Failed to get plan response from Gemini", undefined, "PlanService");
      return this.createFallbackPlan(requirements);
    }
    
    const parsedPlan = this.parsePlanResponse(planResponse, requirements);
    logger.info("Plan created successfully", { taskCount: parsedPlan.tasks.length }, "PlanService");
    
    return parsedPlan;
  }

  private buildPlanningPrompt(requirements: string, codebaseContext: string): string {
    return `
You are Traycer, an expert planning agent that creates detailed implementation plans for coding projects.

CODEBASE CONTEXT:
${codebaseContext}

USER REQUIREMENTS:
${requirements}

Create a comprehensive plan that includes:
1. Project title and description
2. Detailed tasks broken down into implementable steps
3. File dependencies for each task
4. Task dependencies (what must be done before what)
5. Estimated time for each task
6. Priority levels
7. Specific implementation guidance

IMPORTANT GUIDELINES:
- Break complex features into smaller, manageable tasks (15-60 minutes each)
- Ensure tasks have clear, actionable descriptions
- Set realistic time estimates based on complexity
- Identify proper dependencies between tasks
- Include setup, implementation, testing, and documentation tasks
- Consider error handling and edge cases
- Specify exact files that need to be created or modified

Format your response as JSON with this structure:
{
  "title": "Project Title",
  "description": "Detailed project description explaining the overall goal and scope",
  "tasks": [
    {
      "id": "task-1",
      "title": "Clear, concise task title",
      "description": "Detailed description of what needs to be done, including specific implementation details",
      "files": ["file1.ts", "file2.ts"],
      "dependencies": ["task-0"],
      "estimatedTime": "30 minutes",
      "priority": "high"
    }
  ]
}

Make the plan actionable and specific. Each task should be clear enough that a coding agent can implement it without ambiguity.
Ensure proper task ordering and dependency management.
`;
  }

  private parsePlanResponse(planResponse: string, requirements: string): Plan {
    try {
      const planData = extractJsonFromResponse(planResponse);
      
      if (!planData) {
        throw new Error("Could not extract valid JSON from plan response");
      }

      const plan: Plan = {
        id: generateId("plan"),
        title: planData.title || "Generated Implementation Plan",
        description: planData.description || requirements,
        tasks: this.processTasks(planData.tasks || []),
        created: new Date(),
        updated: new Date(),
        status: 'draft'
      };
      
      // Validate the plan
      this.validatePlan(plan);
      
      return plan;
    } catch (error) {
  if (error instanceof Error) {
    logger.error("Error parsing plan response", { error: error.message }, "PlanService");
    ErrorHandler.handle(error, ErrorType.PARSING_ERROR, { planResponse });
  } else {
    logger.error("Unknown error parsing plan response", { error }, "PlanService");
    ErrorHandler.handle(new Error(String(error)), ErrorType.PARSING_ERROR, { planResponse });
  }

  return this.createFallbackPlan(requirements);
}

  }

  private processTasks(tasksData: any[]): Task[] {
    return tasksData.map((taskData, index) => {
      const task: Task = {
        id: taskData.id || generateId("task"),
        title: taskData.title || `Task ${index + 1}`,
        description: taskData.description || "No description provided",
        files: Array.isArray(taskData.files) ? taskData.files : [],
        dependencies: Array.isArray(taskData.dependencies) ? taskData.dependencies : [],
        status: 'pending',
        estimatedTime: taskData.estimatedTime || "30 minutes",
        priority: ['low', 'medium', 'high'].includes(taskData.priority) ? taskData.priority : 'medium'
      };

      // Validate each task
      const validation = validateTask(task);
      if (!validation.isValid) {
        logger.warn("Task validation issues", { taskId: task.id, errors: validation.errors }, "PlanService");
      }

      return task;
    });
  }

  private validatePlan(plan: Plan): void {
    const issues: string[] = [];

    // Check for circular dependencies
    const circularDeps = this.detectCircularDependencies(plan.tasks);
    if (circularDeps.length > 0) {
      issues.push(`Circular dependencies detected: ${circularDeps.join(', ')}`);
    }

    // Check for invalid dependencies
    const invalidDeps = this.findInvalidDependencies(plan.tasks);
    if (invalidDeps.length > 0) {
      issues.push(`Invalid dependencies found: ${invalidDeps.join(', ')}`);
    }

    // Check for empty plan
    if (plan.tasks.length === 0) {
      issues.push("Plan contains no tasks");
    }

    if (issues.length > 0) {
      logger.warn("Plan validation issues", { issues }, "PlanService");
      console.log(chalk.yellow("⚠️ Plan validation warnings:"));
      issues.forEach(issue => console.log(chalk.yellow(`   - ${issue}`)));
    }
  }

  private detectCircularDependencies(tasks: Task[]): string[] {
    const circularDeps: string[] = [];
    const visited = new Set<string>();
    const recursionStack = new Set<string>();

    const hasCycle = (taskId: string): boolean => {
      if (recursionStack.has(taskId)) {
        return true;
      }
      if (visited.has(taskId)) {
        return false;
      }

      visited.add(taskId);
      recursionStack.add(taskId);

      const task = tasks.find(t => t.id === taskId);
      if (task) {
        for (const depId of task.dependencies) {
          if (hasCycle(depId)) {
            circularDeps.push(`${taskId} -> ${depId}`);
            return true;
          }
        }
      }

      recursionStack.delete(taskId);
      return false;
    };

    tasks.forEach(task => {
      if (!visited.has(task.id)) {
        hasCycle(task.id);
      }
    });

    return circularDeps;
  }

  private findInvalidDependencies(tasks: Task[]): string[] {
    const taskIds = new Set(tasks.map(t => t.id));
    const invalidDeps: string[] = [];

    tasks.forEach(task => {
      task.dependencies.forEach(depId => {
        if (!taskIds.has(depId)) {
          invalidDeps.push(`${task.id} depends on non-existent task ${depId}`);
        }
      });
    });

    return invalidDeps;
  }

  private createFallbackPlan(requirements: string): Plan {
    return {
      id: generateId("plan"),
      title: "Manual Implementation Plan",
      description: requirements,
      tasks: [{
        id: generateId("task"),
        title: "Implement requirements",
        description: requirements,
        files: [],
        dependencies: [],
        status: 'pending',
        estimatedTime: "60 minutes",
        priority: 'high'
      }],
      created: new Date(),
      updated: new Date(),
      status: 'draft'
    };
  }

  async modifyTask(plan: Plan, taskIndex: number, modification: string): Promise<Plan> {
    if (taskIndex < 0 || taskIndex >= plan.tasks.length) {
      console.log(chalk.red("Invalid task number"));
      return plan;
    }

    const modificationPrompt = `
Modify the following task based on the user's request:

CURRENT TASK:
${JSON.stringify(plan.tasks[taskIndex], null, 2)}

USER REQUEST:
${modification}

Return the modified task as JSON with the same structure.
`;
    
    try {
      const response = await this.geminiService.generateContent(modificationPrompt);
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      const modifiedTask = JSON.parse(jsonMatch ? jsonMatch[0] : response);
      
      plan.tasks[taskIndex] = { 
        ...plan.tasks[taskIndex], 
        ...modifiedTask,
        id: plan.tasks[taskIndex].id // Preserve original ID
      };
      plan.updated = new Date();
      
      console.log(chalk.green("✅ Task modified successfully!"));
    } catch (error) {
  if (error instanceof Error) {
    logger.error("Error modifying task", { error: error.message }, "PlanService");
  } else {
    logger.error("Unknown error modifying task", { error }, "PlanService");
  }
  console.log(chalk.red("Error modifying task, keeping original"));
}
    
    return plan;
  }

  async addTask(plan: Plan, taskDescription: string): Promise<Plan> {
    const newTaskPrompt = `
Create a new task for the project plan based on this description: ${taskDescription}

Existing tasks in the plan:
${plan.tasks.map(t => `- ${t.id}: ${t.title}`).join('\n')}

Return a JSON object with this structure:
{
  "title": "Task Title",
  "description": "Detailed description",
  "files": ["relevant files"],
  "dependencies": ["dependent task IDs from existing tasks if needed"],
  "estimatedTime": "time estimate",
  "priority": "low/medium/high"
}
`;
    
    try {
      const response = await this.geminiService.generateContent(newTaskPrompt);
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      const newTaskData = JSON.parse(jsonMatch ? jsonMatch[0] : response);
      
      const newTask: Task = {
        id: generateId("task"),
        title: newTaskData.title || "New Task",
        description: newTaskData.description || taskDescription,
        files: Array.isArray(newTaskData.files) ? newTaskData.files : [],
        dependencies: Array.isArray(newTaskData.dependencies) ? newTaskData.dependencies : [],
        status: 'pending',
        estimatedTime: newTaskData.estimatedTime || "30 minutes",
        priority: ['low', 'medium', 'high'].includes(newTaskData.priority) ? newTaskData.priority : 'medium'
      };
      
      plan.tasks.push(newTask);
      plan.updated = new Date();
      
      console.log(chalk.green("✅ Task added successfully!"));
    }catch (error) {
  if (error instanceof Error) {
    logger.error("Error modifying task", { error: error.message }, "PlanService");
  } else {
    logger.error("Unknown error Adding  task", { error }, "PlanService");
  }
  console.log(chalk.red("Error Adding task, keeping original"));
}
    return plan;
  }

  removeTask(plan: Plan, taskIndex: number): Plan {
    if (taskIndex >= 0 && taskIndex < plan.tasks.length) {
      const removedTask = plan.tasks[taskIndex];
      plan.tasks.splice(taskIndex, 1);
      
      // Remove dependencies on the deleted task from other tasks
      plan.tasks.forEach(task => {
        task.dependencies = task.dependencies.filter(depId => depId !== removedTask.id);
      });
      
      plan.updated = new Date();
      console.log(chalk.green("✅ Task removed successfully!"));
    } else {
      console.log(chalk.red("Invalid task number"));
    }
    
    return plan;
  }

  updateTaskStatus(plan: Plan, taskId: string, status: Task['status']): Plan {
    const task = plan.tasks.find(t => t.id === taskId);
    if (task) {
      task.status = status;
      plan.updated = new Date();
      logger.info("Task status updated", { taskId, status }, "PlanService");
      console.log(chalk.green(`✅ Task ${taskId} status updated to ${status}`));
    } else {
      logger.warn("Task not found for status update", { taskId }, "PlanService");
      console.log(chalk.red("Task not found"));
    }
    
    return plan;
  }

  getTasksByStatus(plan: Plan, status: Task['status']): Task[] {
    return plan.tasks.filter(task => task.status === status);
  }

  getExecutableTaskIds(plan: Plan): string[] {
    const pendingTasks = plan.tasks.filter(task => task.status === 'pending');
    const completedTaskIds = new Set(
      plan.tasks.filter(task => task.status === 'completed').map(task => task.id)
    );

    return pendingTasks
      .filter(task => 
        task.dependencies.every(depId => completedTaskIds.has(depId))
      )
      .map(task => task.id);
  }

  getPlanProgress(plan: Plan): { completed: number; total: number; percentage: number } {
    const total = plan.tasks.length;
    const completed = plan.tasks.filter(task => task.status === 'completed').length;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

    return { completed, total, percentage };
  }

  exportPlan(plan: Plan): string {
    return JSON.stringify(plan, null, 2);
  }

async importPlan(planJson: string): Promise<Plan> {
  try {
    const planData = JSON.parse(planJson);

    const plan: Plan = {
      id: planData.id || generateId("plan"),
      title: planData.title || "Imported Plan",
      description: planData.description || "Imported plan",
      tasks: this.processTasks(planData.tasks || []),
      created: planData.created ? new Date(planData.created) : new Date(),
      updated: new Date(),
      status: planData.status || "draft",
    };

    this.validatePlan(plan);
    logger.info("Plan imported successfully", { taskCount: plan.tasks.length }, "PlanService");

    return plan;
  } catch (error) {
    if (error instanceof Error) {
      logger.error("Error importing plan", { error: error.message }, "PlanService");
    } else {
      logger.error("Unknown error importing plan", { error }, "PlanService");
    }
    console.log(chalk.red("Failed to import plan: Invalid JSON format"));

    throw new Error("Failed to import plan"); // ✅ ensure function never ends without return
  }
}
 
  }
