import { Plan } from "./types";
import { ConfigService } from "./config/config";
import { GeminiService } from "./services/geminiService";
import { FileService } from "./services/fileService";
import { UIService } from "./services/uiService";
import { PlanService } from "./services/planService";
import { TaskExecutor } from "./services/taskExecutor";
import { PlanManager } from "./services/planManager";
import { RequirementsService } from "./services/requirementsService";
import chalk from "chalk";

export class TracerLite {
  private currentPlan: Plan | null = null;
  private config = ConfigService.getInstance().getConfig();
  
  // Services
  private geminiService!: GeminiService;
  private fileService!: FileService;
  private uiService!: UIService;
  private planService!: PlanService;
  private taskExecutor!: TaskExecutor;
  private planManager!: PlanManager;
  private requirementsService!: RequirementsService;

  constructor() {
    this.initializeServices();
  }

  private initializeServices(): void {
    // Initialize core services
    this.geminiService = new GeminiService(this.config.geminiApiKey);
    this.fileService = new FileService(this.config.projectPath);
    this.uiService = new UIService();
    
    // Initialize dependent services
    this.planService = new PlanService(this.geminiService);
    this.taskExecutor = new TaskExecutor(this.geminiService, this.uiService);
    this.requirementsService = new RequirementsService(this.geminiService, this.uiService);
    this.planManager = new PlanManager(
      this.planService,
      this.uiService,
      this.fileService,
      this.taskExecutor
    );
  }

  async run(): Promise<void> {
    try {
      console.log(chalk.blue("--- 🤖 Traycer AI Software Agent ---"));
      console.log(chalk.blue("A generative AI tool for code project planning and execution."));
      
      // Gather and validate requirements
      const requirements = await this.requirementsService.gatherAndValidateRequirements();
      
      // Analyze codebase
      console.log(chalk.yellow("\n🔍 Analyzing codebase..."));
      const codebaseContext = await this.fileService.analyzeCodebase();
      
      // Create plan
      console.log(chalk.blue("\n🧠 Creating comprehensive plan..."));
      const plan = await this.planService.createPlan(requirements, codebaseContext);
      this.currentPlan = plan;
      
      // Review and execute plan
      await this.planManager.reviewAndIteratePlan(plan);
      
    } catch (error) {
      console.error(chalk.red("An error occurred:"), error);
    } finally {
      this.uiService.close();
    }
  }

  getCurrentPlan(): Plan | null {
    return this.currentPlan;
  }

  setCurrentPlan(plan: Plan): void {
    this.currentPlan = plan;
  }
}