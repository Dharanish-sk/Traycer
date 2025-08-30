export interface Task {
  id: string;
  title: string;
  description: string;
  files: string[];
  dependencies: string[];
  status: 'pending' | 'in-progress' | 'completed' | 'failed';
  estimatedTime: string;
  priority: 'low' | 'medium' | 'high';
  code?: string;
}

export interface VerificationResult {
  score: number;
  passed: boolean;
  issues?: string[];
  suggestions?: string[];
  strengths?: string[];
  analysis: string;
}

export interface Plan {
  id: string;
  title: string;
  description: string;
  tasks: Task[];
  created: Date;
  updated: Date;
  status: 'draft' | 'approved' | 'executing' | 'completed' | 'failed';
}

export interface PlanModificationOptions {
  action: 'modify' | 'add' | 'remove' | 'regenerate' | 'export';
  taskIndex?: number;
  description?: string;
}