import fs from "fs/promises";
import path from "path";
import chalk from "chalk";
import { Plan } from "../types";

export class FileService {
  private projectPath: string;

  constructor(projectPath: string = process.cwd()) {
    this.projectPath = projectPath;
  }

  async getProjectFiles(): Promise<string[]> {
    const files: string[] = [];
    const extensions = ['.ts', '.js', '.tsx', '.jsx', '.py', '.java', '.cpp', '.c', '.cs', '.go', '.rs'];
    
    const traverseDir = async (dirPath: string): Promise<void> => {
      try {
        const entries = await fs.readdir(dirPath, { withFileTypes: true });
        
        for (const entry of entries) {
          const fullPath = path.join(dirPath, entry.name);
          
          if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
            await traverseDir(fullPath);
          } else if (entry.isFile() && extensions.some(ext => entry.name.endsWith(ext))) {
            files.push(fullPath);
          }
        }
      } catch (error) {
        console.warn(chalk.yellow(`Could not read directory: ${dirPath}`));
      }
    };
    
    await traverseDir(this.projectPath);
    return files;
  }

  async analyzeCodebase(): Promise<string> {
    try {
      const files = await this.getProjectFiles();
      let codebaseContext = "=== CODEBASE ANALYSIS ===\n";
      
      for (const file of files.slice(0, 10)) {
        try {
          const content = await fs.readFile(file, 'utf-8');
          const relativePath = path.relative(this.projectPath, file);
          codebaseContext += `\n--- ${relativePath} ---\n`;
          codebaseContext += content.slice(0, 1000) + (content.length > 1000 ? '\n...[truncated]' : '');
        } catch (error) {
          console.warn(chalk.yellow(`Could not read file: ${file}`));
        }
      }
      
      return codebaseContext;
    } catch (error) {
      console.warn(chalk.yellow("Could not analyze codebase, proceeding without context"));
      return "";
    }
  }

  async savePlanToFile(plan: Plan): Promise<void> {
    try {
      const fileName = `traycer-plan-${plan.id}.json`;
      const filePath = path.join(this.projectPath, fileName);
      await fs.writeFile(filePath, JSON.stringify(plan, null, 2));
      console.log(chalk.green(`✅ Plan exported to ${fileName}`));
    } catch (error) {
      console.error(chalk.red("Error exporting plan:"), error);
    }
  }

  async saveExecutionOutput(plan: Plan): Promise<void> {
    try {
      const outputFileName = `traycer-output-${plan.id}.txt`;
      const outputPath = path.join(this.projectPath, outputFileName);

      let content = `
========================================
    Traycer AI Execution Summary
========================================

Project: ${plan.title}
Status: ${plan.status}
Date: ${new Date().toLocaleString()}

----------------------------------------
Tasks Executed:
----------------------------------------
`;
      
      plan.tasks.forEach((task, index) => {
        content += `
  [${index + 1}] Task: ${task.title}
  Status: ${task.status}
  Description: ${task.description}
  ----------------------------------------
`;
      });
      
      await fs.writeFile(outputPath, content);
      console.log(chalk.green(`\n✅ Program output saved to: ${outputPath}`));
    } catch (error) {
      console.error(chalk.red(`\n❌ Failed to save output file: ${error}`));
    }
  }
}