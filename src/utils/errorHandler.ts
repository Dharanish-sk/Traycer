import chalk from "chalk";

export enum ErrorType {
  API_ERROR = "API_ERROR",
  FILE_ERROR = "FILE_ERROR",
  VALIDATION_ERROR = "VALIDATION_ERROR",
  PARSING_ERROR = "PARSING_ERROR",
  USER_INPUT_ERROR = "USER_INPUT_ERROR",
  NETWORK_ERROR = "NETWORK_ERROR"
}

export interface TracerError {
  type: ErrorType;
  message: string;
  originalError?: Error;
  context?: any;
  timestamp: Date;
}

export class ErrorHandler {
  private static errors: TracerError[] = [];

  static handle(error: Error | string, type: ErrorType, context?: any): void {
    const tracerError: TracerError = {
      type,
      message: typeof error === 'string' ? error : error.message,
      originalError: typeof error === 'string' ? undefined : error,
      context,
      timestamp: new Date()
    };

    this.errors.push(tracerError);
    this.displayError(tracerError);
  }

  private static displayError(error: TracerError): void {
    const typeColors = {
      [ErrorType.API_ERROR]: chalk.red,
      [ErrorType.FILE_ERROR]: chalk.yellow,
      [ErrorType.VALIDATION_ERROR]: chalk.blue,
      [ErrorType.PARSING_ERROR]: chalk.magenta,
      [ErrorType.USER_INPUT_ERROR]: chalk.cyan,
      [ErrorType.NETWORK_ERROR]: chalk.red
    };

    const colorFn = typeColors[error.type] || chalk.white;
    
    console.error(colorFn(`\n❌ ${error.type}: ${error.message}`));
    
    if (error.context) {
      console.error(chalk.gray(`   Context: ${JSON.stringify(error.context)}`));
    }
    
    if (process.env.NODE_ENV === 'development' && error.originalError) {
      console.error(chalk.gray(`   Stack: ${error.originalError.stack}`));
    }
  }

  static getErrors(): TracerError[] {
    return [...this.errors];
  }

  static clearErrors(): void {
    this.errors = [];
  }

  static hasErrors(): boolean {
    return this.errors.length > 0;
  }

  static getErrorsByType(type: ErrorType): TracerError[] {
    return this.errors.filter(error => error.type === type);
  }

  static async handleAsyncOperation<T>(
    operation: () => Promise<T>,
    errorType: ErrorType,
    context?: any
  ): Promise<T | null> {
    try {
      return await operation();
    } catch (error) {
      this.handle(error as Error, errorType, context);
      return null;
    }
  }

  static wrapSync<T>(
    operation: () => T,
    errorType: ErrorType,
    context?: any
  ): T | null {
    try {
      return operation();
    } catch (error) {
      this.handle(error as Error, errorType, context);
      return null;
    }
  }
}

/**
 * Decorator for automatic error handling in class methods
 */
export function handleErrors(errorType: ErrorType) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      try {
        return await originalMethod.apply(this, args);
      } catch (error) {
        ErrorHandler.handle(error as Error, errorType, {
          method: propertyKey,
          args: args.length
        });
        return null;
      }
    };

    return descriptor;
  };
}