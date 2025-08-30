import { Plan } from "../types";
import { PlanService } from "./planService";
import { UIService } from "./uiService";
import { FileService } from "./fileService";
import { TaskExecutor } from "./taskExecutor";
import chalk from "chalk";

export class PlanManager {
  constructor(
    private planService: PlanService,
    private uiService: UIService,
    private fileService: FileService,
    private taskExecutor: TaskExecutor
  ) {}

  async reviewAndIteratePlan(plan: Plan): Promise<Plan> {
    this.uiService.displayPlan(plan);
    
    return new Promise(async (resolve) => {
      const choice = await this.uiService.getPlanReviewChoice();
      
      switch (choice) {
        case '1':
          plan.status = 'approved';
          await this.taskExecutor.executePlan(plan);
          await this.fileService.saveExecutionOutput(plan);
          resolve(plan);
          break;
          
        case '2':
          const modifiedPlan = await this.modifyTask(plan);
          resolve(await this.reviewAndIteratePlan(modifiedPlan));
          break;
          
        case '3':
          const planWithNewTask = await this.addTask(plan);
          resolve(await this.reviewAndIteratePlan(planWithNewTask));
          break;
          
        case '4':
          const planWithRemovedTask = await this.removeTask(plan);
          resolve(await this.reviewAndIteratePlan(planWithRemovedTask));
          break;
          
        case '5':
          console.log(chalk.yellow("Regenerating plan requires new requirements..."));
          resolve(plan); // This will be handled by the main TracerLite class
          break;
          
        case '6':
          await this.fileService.savePlanToFile(plan);
          resolve(await this.reviewAndIteratePlan(plan));
          break;
          
        default:
          console.log(chalk.red("Invalid choice. Please try again."));
          resolve(await this.reviewAndIteratePlan(plan));
      }
    });
  }

  private async modifyTask(plan: Plan): Promise<Plan> {
    const taskIndex = await this.uiService.getTaskToModify(plan);
    
    if (taskIndex >= 0 && taskIndex < plan.tasks.length) {
      console.log(chalk.blue("What changes would you like to make to this task?"));
      const modification = await this.uiService.getModificationRequest();
      return await this.planService.modifyTask(plan, taskIndex, modification);
    } else {
      console.log(chalk.red("Invalid task number"));
      return plan;
    }
  }

  private async addTask(plan: Plan): Promise<Plan> {
    const taskDescription = await this.uiService.getNewTaskDescription();
    return await this.planService.addTask(plan, taskDescription);
  }

  private async removeTask(plan: Plan): Promise<Plan> {
    const taskIndex = await this.uiService.getTaskToRemove(plan);
    return this.planService.removeTask(plan, taskIndex);
  }
}