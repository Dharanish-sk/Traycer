import { Task, Plan } from "../types";

/**
 * Utility functions for TracerLite
 */

/**
 * Generate a unique ID for plans and tasks
 */
export function generateId(prefix: string = "item"): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Check if a task can be executed based on its dependencies
 */
export function canExecuteTask(task: Task, plan: Plan): boolean {
  if (task.dependencies.length === 0) {
    return true;
  }

  return task.dependencies.every(depId => {
    const dependentTask = plan.tasks.find(t => t.id === depId);
    return dependentTask?.status === 'completed';
  });
}

/**
 * Get tasks that are ready to be executed (dependencies met)
 */
export function getExecutableTasks(plan: Plan): Task[] {
  return plan.tasks.filter(task => 
    task.status === 'pending' && canExecuteTask(task, plan)
  );
}

/**
 * Calculate total estimated time for a plan
 */
export function calculateTotalTime(plan: Plan): string {
  const totalMinutes = plan.tasks.reduce((total, task) => {
    const timeMatch = task.estimatedTime.match(/(\d+)\s*(minutes?|mins?|hours?|hrs?)/i);
    if (timeMatch) {
      const value = parseInt(timeMatch[1]);
      const unit = timeMatch[2].toLowerCase();
      
      if (unit.startsWith('hour') || unit.startsWith('hr')) {
        return total + (value * 60);
      } else {
        return total + value;
      }
    }
    return total + 30; // Default 30 minutes if can't parse
  }, 0);

  if (totalMinutes >= 60) {
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
  }
  
  return `${totalMinutes}m`;
}

/**
 * Get plan completion percentage
 */
export function getPlanProgress(plan: Plan): number {
  const completedTasks = plan.tasks.filter(task => task.status === 'completed').length;
  return plan.tasks.length > 0 ? Math.round((completedTasks / plan.tasks.length) * 100) : 0;
}

/**
 * Sort tasks by priority and dependencies
 */
export function sortTasksByPriority(tasks: Task[]): Task[] {
  const priorityOrder = { 'high': 3, 'medium': 2, 'low': 1 };
  
  return [...tasks].sort((a, b) => {
    // First sort by priority
    const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
    if (priorityDiff !== 0) {
      return priorityDiff;
    }
    
    // Then by dependency count (fewer dependencies first)
    return a.dependencies.length - b.dependencies.length;
  });
}

/**
 * Validate task structure
 */
export function validateTask(task: Partial<Task>): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!task.title || task.title.trim().length === 0) {
    errors.push("Task title is required");
  }
  
  if (!task.description || task.description.trim().length === 0) {
    errors.push("Task description is required");
  }
  
  if (!task.priority || !['low', 'medium', 'high'].includes(task.priority)) {
    errors.push("Task priority must be 'low', 'medium', or 'high'");
  }
  
  if (!task.estimatedTime || task.estimatedTime.trim().length === 0) {
    errors.push("Task estimated time is required");
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Format task status for display
 */
export function getTaskStatusIcon(status: Task['status']): string {
  switch (status) {
    case 'completed':
      return '✅';
    case 'in-progress':
      return '🔄';
    case 'failed':
      return '❌';
    default:
      return '⏳';
  }
}

/**
 * Extract JSON from a mixed text response
 */
export function extractJsonFromResponse(response: string): any | null {
  try {
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    return JSON.parse(response);
  } catch (error) {
    return null;
  }
}

/**
 * Sanitize file paths
 */
export function sanitizeFilePath(filePath: string): string {
  return filePath.replace(/[<>:"|?*]/g, '').replace(/\.\./g, '');
}