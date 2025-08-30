import dotenv from "dotenv";
import chalk from "chalk";

dotenv.config();

export interface Config {
  geminiApiKey: string;
  projectPath: string;
  supportedExtensions: string[];
  maxFilesToAnalyze: number;
  maxFileContentLength: number;
}

export class ConfigService {
  private static instance: ConfigService;
  private config: Config;

  private constructor() {
    this.config = this.loadConfig();
    this.validateConfig();
  }

  static getInstance(): ConfigService {
    if (!ConfigService.instance) {
      ConfigService.instance = new ConfigService();
    }
    return ConfigService.instance;
  }

  private loadConfig(): Config {
    return {
      geminiApiKey: process.env.GEMINI_KEY || "",
      projectPath: process.cwd(),
      supportedExtensions: ['.ts', '.js', '.tsx', '.jsx', '.py', '.java', '.cpp', '.c', '.cs', '.go', '.rs'],
      maxFilesToAnalyze: 10,
      maxFileContentLength: 1000
    };
  }

  private validateConfig(): void {
    if (!this.config.geminiApiKey) {
      console.error(chalk.red("Error: GEMINI_KEY is not set in environment variables."));
      process.exit(1);
    }
  }

  getConfig(): Config {
    return { ...this.config };
  }

  updateProjectPath(path: string): void {
    this.config.projectPath = path;
  }
}