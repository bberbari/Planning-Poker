import { useState } from 'react';
import { Task } from '../types';
import { formatCardValue } from '../utils/cardUtils';
import './TaskHistory.css';

interface TaskHistoryProps {
  tasks: Task[];
  currentTaskId: string | null;
}

function TaskHistory({ tasks, currentTaskId }: TaskHistoryProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Filter out current task - show all past tasks
  const pastTasks = tasks.filter(task => task.id !== currentTaskId);

  if (pastTasks.length === 0) {
    return (
      <div className="task-history">
        <div className="task-history-header">
          <h4>Task History</h4>
        </div>
        <div className="history-empty">
          <p>No task history yet. Completed tasks will appear here.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="task-history">
      <div className="task-history-header">
        <h4>Task History</h4>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="expand-toggle-btn"
          aria-label={isExpanded ? 'Collapse' : 'Expand'}
        >
          {isExpanded ? '▼' : '▶'}
        </button>
      </div>
      {isExpanded && (
        <div className="history-list">
        {pastTasks.slice().reverse().map((task) => {
          // Calculate average from estimateSummary if averageEstimate is not available
          let averageEstimate = task.averageEstimate;
          if (!averageEstimate && task.estimateSummary) {
            const allVotes: number[] = [];
            Object.entries(task.estimateSummary).forEach(([cardValue, data]) => {
              for (let i = 0; i < data.count; i++) {
                allVotes.push(Number(cardValue));
              }
            });
            if (allVotes.length > 0) {
              const sum = allVotes.reduce((acc, val) => acc + val, 0);
              averageEstimate = (sum / allVotes.length).toFixed(1);
            }
          }
          
          // Only show status if task is completed or cancelled (not revealed/pending)
          const showStatus = task.cancelled || (task.completed && !task.revealed);
          const statusClass = task.cancelled ? 'cancelled' : task.completed ? 'completed' : '';
          const statusText = task.cancelled ? '✗ Cancelled' : task.completed ? '✓ Completed' : '';
          
          return (
            <div key={task.id} className="history-item">
              <div className="history-description">{task.description}</div>
              {averageEstimate && (
                <div className="history-estimate">
                  <span className="estimate-label">Average Estimate:</span>
                  <span className="estimate-value">{averageEstimate} points</span>
                </div>
              )}
              {task.estimateSummary && (
                <div className="history-voting-details">
                  <div className="voting-details-header">Voting Details:</div>
                  <div className="voting-details-list">
                    {Object.entries(task.estimateSummary)
                      .sort(([a], [b]) => {
                        const numA = Number(a);
                        const numB = Number(b);
                        if (numA === 999 && numB === 999) return 0;
                        if (numA === 999) return 1;
                        if (numB === 999) return -1;
                        return numA - numB;
                      })
                      .map(([cardValue, data]) => {
                        const cardValueNum = Number(cardValue);
                        return (
                        <div key={cardValueNum === 999 ? 'infinity' : cardValue} className="voting-detail-item">
                          <div className="voting-card-value">
                            <span className="card-value-number">{formatCardValue(cardValueNum)}</span>
                            <span className="card-value-label">points</span>
                          </div>
                          <div className="voting-users">
                            {data.users.map((user: { id: string; name: string }) => (
                              <span key={user.id} className="voting-user-name">
                                {user.name}
                              </span>
                            ))}
                          </div>
                          <div className="voting-count">({data.count})</div>
                        </div>
                      );
                      })}
                  </div>
                </div>
              )}
              {showStatus && (
                <div className="history-meta">
                  <span className={`history-status ${statusClass}`}>
                    {statusText}
                  </span>
                </div>
              )}
            </div>
          );
        })}
        </div>
      )}
    </div>
  );
}

export default TaskHistory;
