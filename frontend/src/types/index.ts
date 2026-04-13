export interface User {
  id: string;
  name: string;
  emoji: string;
  isAdmin: boolean;
  currentVote?: number;
  hasVoted?: boolean;
}

export interface EstimateSummary {
  [cardValue: number]: {
    count: number;
    users: Array<{ id: string; name: string }>;
  };
}

export interface Task {
  id: string;
  description: string;
  votes: Record<string, number>;
  revealed: boolean;
  completed?: boolean;
  cancelled?: boolean;
  estimateSummary?: EstimateSummary;
  averageEstimate?: string;
  createdAt: string;
}

export interface GameState {
  sessionId: string;
  users: User[];
  currentTask: Task | null;
  tasks: Task[];
  createdAt: string;
}
