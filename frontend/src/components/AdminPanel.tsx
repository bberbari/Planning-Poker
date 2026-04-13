import { useState } from 'react';
import { User, Task } from '../types';
import { socketService } from '../services/socketService';
import { formatCardValue } from '../utils/cardUtils';
import TaskHistory from './TaskHistory';
import './AdminPanel.css';

interface AdminPanelProps {
  currentTask: Task | null;
  users: User[];
  tasks: Task[];
}

function AdminPanel({ currentTask, users, tasks }: AdminPanelProps) {
  const [taskDescription, setTaskDescription] = useState('');
  const [showVotes, setShowVotes] = useState(false);

  const handleCreateTask = () => {
    const trimmed = taskDescription.trim();
    if (!trimmed) {
      alert('Please enter a task description');
      return;
    }
    if (trimmed.length > 500) {
      alert('Task description must be 500 characters or less');
      return;
    }
    socketService.createTask(trimmed);
    setTaskDescription('');
  };

  const handleRevealCards = () => {
    if (!currentTask) return;
    socketService.revealCards();
  };

  const handleResetVoting = () => {
    socketService.resetVoting();
  };


  const getVoteCount = () => {
    if (!currentTask) return 0;
    return Object.keys(currentTask.votes).length;
  };

  const getVotesSummary = () => {
    if (!currentTask || !currentTask.revealed) return null;

    const votesByValue: Record<number, { users: User[]; count: number }> = {};
    
    Object.entries(currentTask.votes).forEach(([userId, cardValue]) => {
      const user = users.find(u => u.id === userId);
      if (user) {
        if (!votesByValue[cardValue]) {
          votesByValue[cardValue] = { users: [], count: 0 };
        }
        votesByValue[cardValue].users.push(user);
        votesByValue[cardValue].count++;
      }
    });

    return votesByValue;
  };

  const votesSummary = getVotesSummary();
  const voteCount = getVoteCount();
  const totalUsers = users.length;

  return (
    <div className="admin-panel">
      <h3>Admin Controls</h3>

      <div className="admin-panel-grid">
        <div className="admin-panel-left">
          {currentTask && (
            <div className="admin-section">
              <h4>Voting Status</h4>
              <div className="vote-status">
                <span>{voteCount} of {totalUsers} users have voted</span>
              </div>

              {!currentTask.revealed && (
                <div className="admin-actions">
                  <button
                    onClick={handleRevealCards}
                    className="admin-btn primary"
                    disabled={voteCount === 0}
                  >
                    Reveal Cards
                  </button>
                  <button
                    onClick={handleResetVoting}
                    className="admin-btn secondary"
                  >
                    Reset Voting
                  </button>
                </div>
              )}

              {!currentTask.revealed && (
                <div style={{ marginTop: '15px' }}>
                  <button
                    onClick={() => setShowVotes(!showVotes)}
                    className="admin-btn secondary"
                  >
                    {showVotes ? 'Hide' : 'Show'} Votes
                  </button>
                  {showVotes && (
                    <div className="votes-preview">
                      {users.map((user) => {
                        const vote = currentTask.votes[user.id];
                        return (
                          <div key={user.id} className="vote-item">
                            <span>{user.name}:</span>
                            <span className="vote-value">
                              {vote ? vote : 'Not voted yet'}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {currentTask.revealed && votesSummary && (
                <div style={{ marginTop: '15px' }}>
                  <h4>Voting Summary</h4>
                  <div className="votes-summary">
                    {Object.entries(votesSummary)
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
                        <div key={cardValueNum === 999 ? 'infinity' : cardValue} className="summary-item">
                          <div className="summary-card-value">{formatCardValue(cardValueNum)}</div>
                          <div className="summary-users">
                            {data.users.map((user) => (
                              <span key={user.id} className="summary-user">
                                {user.name}
                              </span>
                            ))}
                          </div>
                          <div className="summary-count">({data.count})</div>
                        </div>
                      );
                      })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="admin-panel-right">
          <div className="admin-section">
            <h4>Create New Task</h4>
            <div className="task-input-group">
              <textarea
                value={taskDescription}
                onChange={(e) => setTaskDescription(e.target.value)}
                placeholder="Enter task description..."
                rows={3}
                className="task-input"
              />
              <button onClick={handleCreateTask} className="admin-btn primary">
                Create Task
              </button>
            </div>
          </div>

          <TaskHistory tasks={tasks} currentTaskId={currentTask?.id || null} />
        </div>
      </div>
    </div>
  );
}

export default AdminPanel;
