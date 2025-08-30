import chalk from "chalk";
import fs from "fs/promises";
import path from "path";

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3
}

export interface LogEntry {
  timestamp: Date;
  level: LogLevel;
  message: string;
  context?: any;
  source?: string;
}

export class Logger {
  private static instance: Logger;
  private logs: LogEntry[] = [];
  private logLevel: LogLevel = LogLevel.INFO;
  private logToFile: boolean = false;
  private logFilePath: string = '';

  private constructor() {
    this.logFilePath = path.join(process.cwd(), 'tracer-lite.log');
  }

  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  setLogLevel(level: LogLevel): void {
    this.logLevel = level;
  }

  enableFileLogging(enabled: boolean = true): void {
    this.logToFile = enabled;
  }

  debug(message: string, context?: any, source?: string): void {
    this.log(LogLevel.DEBUG, message, context, source);
  }

  info(message: string, context?: any, source?: string): void {
    this.log(LogLevel.INFO, message, context, source);
  }

  warn(message: string, context?: any, source?: string): void {
    this.log(LogLevel.WARN, message, context, source);
  }

  error(message: string, context?: any, source?: string): void {
    this.log(LogLevel.ERROR, message, context, source);
  }

  private log(level: LogLevel, message: string, context?: any, source?: string): void {
    if (level < this.logLevel) {
      return;
    }

    const logEntry: LogEntry = {
      timestamp: new Date(),
      level,
      message,
      context,
      source
    };

    this.logs.push(logEntry);
    this.displayLog(logEntry);

    if (this.logToFile) {
      this.writeToFile(logEntry).catch(err => {
        console.error(chalk.red("Failed to write to log file:"), err);
      });
    }
  }

  private displayLog(entry: LogEntry): void {
    const timestamp = entry.timestamp.toLocaleTimeString();
    const levelColors = {
      [LogLevel.DEBUG]: chalk.gray,
      [LogLevel.INFO]: chalk.blue,
      [LogLevel.WARN]: chalk.yellow,
      [LogLevel.ERROR]: chalk.red
    };

    const levelNames = {
      [LogLevel.DEBUG]: 'DEBUG',
      [LogLevel.INFO]: 'INFO',
      [LogLevel.WARN]: 'WARN',
      [LogLevel.ERROR]: 'ERROR'
    };

    const colorFn = levelColors[entry.level];
    const levelName = levelNames[entry.level];
    const sourcePrefix = entry.source ? `[${entry.source}] ` : '';

    console.log(colorFn(`[${timestamp}] ${levelName}: ${sourcePrefix}${entry.message}`));

    if (entry.context && this.logLevel === LogLevel.DEBUG) {
      console.log(chalk.gray(`   Context: ${JSON.stringify(entry.context, null, 2)}`));
    }
  }

  private async writeToFile(entry: LogEntry): Promise<void> {
    const logLine = `[${entry.timestamp.toISOString()}] ${LogLevel[entry.level]}: ${entry.source ? `[${entry.source}] ` : ''}${entry.message}`;
    const contextLine = entry.context ? `\n   Context: ${JSON.stringify(entry.context)}` : '';
    const fullLogLine = logLine + contextLine + '\n';

    try {
      await fs.appendFile(this.logFilePath, fullLogLine);
    } catch (error) {
      // Silently fail to avoid infinite logging loops
    }
  }

  getLogs(): LogEntry[] {
    return [...this.logs];
  }

  getLogsByLevel(level: LogLevel): LogEntry[] {
    return this.logs.filter(log => log.level === level);
  }

  clearLogs(): void {
    this.logs = [];
  }

  async exportLogs(filePath?: string): Promise<void> {
    const exportPath = filePath || path.join(process.cwd(), `tracer-logs-${Date.now()}.json`);
    
    try {
      await fs.writeFile(exportPath, JSON.stringify(this.logs, null, 2));
      console.log(chalk.green(`✅ Logs exported to ${exportPath}`));
    } catch (error) {
      console.error(chalk.red("Failed to export logs:"), error);
    }
  }
}

// Convenience functions for global logging
export const logger = Logger.getInstance();

export function debug(message: string, context?: any, source?: string): void {
  logger.debug(message, context, source);
}

export function info(message: string, context?: any, source?: string): void {
  logger.info(message, context, source);
}

export function warn(message: string, context?: any, source?: string): void {
  logger.warn(message, context, source);
}

export function error(message: string, context?: any, source?: string): void {
  logger.error(message, context, source);
}