import { Task } from '../types';
import './TaskDisplay.css';

interface TaskDisplayProps {
  task: Task | null;
}

function TaskDisplay({ task }: TaskDisplayProps) {
  if (!task) {
    return (
      <div className="task-display">
        <div className="no-task">
          <p>No task selected. Waiting for admin to create a task...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="task-display">
      <h3>Current Task</h3>
      <div className="task-description">
        {task.description}
      </div>
      {task.revealed && (
        <div className="task-status revealed">
          Cards Revealed
        </div>
      )}
      {!task.revealed && (
        <div className="task-status voting">
          Voting in progress...
        </div>
      )}
    </div>
  );
}

export default TaskDisplay;
