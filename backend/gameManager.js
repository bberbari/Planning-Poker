const { v4: uuidv4 } = require('uuid');

class GameManager {
  constructor() {
    this.sessions = new Map();
  }

  createSession(sessionId = null) {
    const id = sessionId || this.generateSessionId();
    const session = {
      id: id,
      users: new Map(),
      currentTask: null,
      tasks: [],
      createdAt: new Date()
    };
    this.sessions.set(id, session);
    console.log('[GameManager] Session created', { sessionId: id, totalSessions: this.sessions.size });
    return id;
  }

  generateSessionId() {
    // Generate a short, readable session ID
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  }

  getSession(sessionId) {
    return this.sessions.get(sessionId);
  }

  deleteSession(sessionId) {
    this.sessions.delete(sessionId);
  }

  addUserToSession(sessionId, socketId, userData) {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }

    const userId = uuidv4();
    // Generate initials from name for display
    const initials = userData.name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) || '?';

    const user = {
      id: userId,
      socketId: socketId,
      name: userData.name,
      emoji: initials, // Use initials instead of emoji
      isAdmin: userData.isAdmin || session.users.size === 0,
      currentVote: null
    };

    session.users.set(userId, user);
    return user;
  }

  removeUserFromSession(sessionId, userId) {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return;
    }

    session.users.delete(userId);

    // If user had voted, remove their vote
    if (session.currentTask && session.currentTask.votes.has(userId)) {
      session.currentTask.votes.delete(userId);
    }
  }

  findUserBySocketId(sessionId, socketId) {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return null;
    }

    for (const [userId, user] of session.users.entries()) {
      if (user.socketId === socketId) {
        return { userId, user };
      }
    }
    return null;
  }

  createTask(sessionId, description) {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }

    // If there's a current task, save estimate details and mark it as completed before replacing
    if (session.currentTask) {
      // If task was revealed, calculate and save estimate details
      if (session.currentTask.revealed && session.currentTask.votes.size > 0) {
        // Calculate estimate summary (votes by value)
        const estimateSummary = {};
        session.currentTask.votes.forEach((cardValue, userId) => {
          if (!estimateSummary[cardValue]) {
            estimateSummary[cardValue] = { count: 0, users: [] };
          }
          estimateSummary[cardValue].count++;
          const user = session.users.get(userId);
          if (user) {
            estimateSummary[cardValue].users.push({
              id: user.id,
              name: user.name
            });
          }
        });

        // Calculate average estimate
        const voteValues = Array.from(session.currentTask.votes.values());
        // Filter out infinity (999) from average calculation
        const numericVotes = voteValues.filter(val => val !== 999);
        const hasInfinity = voteValues.some(val => val === 999);
        let averageEstimate = null;
        if (hasInfinity && numericVotes.length > 0) {
          averageEstimate = '∞';
        } else if (numericVotes.length > 0) {
          averageEstimate = (numericVotes.reduce((sum, val) => sum + val, 0) / numericVotes.length).toFixed(1);
        }

        // Save estimate details to the task
        session.currentTask.estimateSummary = estimateSummary;
        session.currentTask.averageEstimate = averageEstimate;
        
        console.log('[GameManager] Previous task saved with estimates', { 
          taskId: session.currentTask.id,
          averageEstimate,
          voteCount: voteValues.length
        });
      }
      
      session.currentTask.completed = true;
      session.currentTask.revealed = true;
      console.log('[GameManager] Previous task marked as completed', { taskId: session.currentTask.id });
    }

    const task = {
      id: uuidv4(),
      description: description.trim(),
      votes: new Map(),
      revealed: false,
      createdAt: new Date()
    };

    // Add task to history
    session.tasks.push(task);

    // Reset all user votes
    session.users.forEach(user => {
      user.currentVote = null;
    });

    // Set as current task (replaces any existing current task)
    session.currentTask = task;
    console.log('[GameManager] Task set as current task', { taskId: task.id });

    return task;
  }

  vote(sessionId, userId, cardValue) {
    const session = this.sessions.get(sessionId);
    if (!session || !session.currentTask) {
      throw new Error('No active task');
    }

    const user = session.users.get(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Validate card value (Fibonacci sequence: 1, 2, 3, 5, 8, Infinity as 999)
    // Use 999 to represent Infinity for JSON serialization
    const validCards = [1, 2, 3, 5, 8, 999];
    if (!validCards.includes(cardValue)) {
      throw new Error('Invalid card value');
    }
    
    // Normalize Infinity to 999 for storage (in case frontend sends Infinity)
    const normalizedValue = cardValue === Infinity ? 999 : cardValue;

    session.currentTask.votes.set(userId, normalizedValue);
    user.currentVote = normalizedValue;
  }

  revealCards(sessionId) {
    const session = this.sessions.get(sessionId);
    if (!session || !session.currentTask) {
      throw new Error('No active task');
    }

    session.currentTask.revealed = true;
  }

  resetVoting(sessionId) {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }

    // If there's a current task that's been revealed, save estimate details and mark as completed
    if (session.currentTask && session.currentTask.revealed) {
      // Calculate estimate summary (votes by value)
      const estimateSummary = {};
      session.currentTask.votes.forEach((cardValue, userId) => {
        if (!estimateSummary[cardValue]) {
          estimateSummary[cardValue] = { count: 0, users: [] };
        }
        estimateSummary[cardValue].count++;
        const user = session.users.get(userId);
        if (user) {
          estimateSummary[cardValue].users.push({
            id: user.id,
            name: user.name
          });
        }
      });

      // Calculate average estimate
      const voteValues = Array.from(session.currentTask.votes.values());
      const averageEstimate = voteValues.length > 0
        ? (voteValues.reduce((sum, val) => sum + val, 0) / voteValues.length).toFixed(1)
        : null;

      // Save estimate details to the task
      session.currentTask.estimateSummary = estimateSummary;
      session.currentTask.averageEstimate = averageEstimate;
      session.currentTask.completed = true;
      
      console.log('[GameManager] Task completed with estimates', { 
        taskId: session.currentTask.id,
        averageEstimate,
        voteCount: voteValues.length
      });
    }

    // Reset all user votes
    session.users.forEach(user => {
      user.currentVote = null;
    });

    // Clear current task votes but keep the task (or clear it if it was completed)
    if (session.currentTask) {
      if (session.currentTask.completed) {
        // Task is completed, clear it so a new task can be created
        session.currentTask = null;
      } else {
        // Task not completed yet, just reset votes
        session.currentTask.votes.clear();
        session.currentTask.revealed = false;
      }
    }
  }


  getGameState(sessionId) {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return null;
    }

    // Convert Maps to arrays for JSON serialization
    const users = Array.from(session.users.values()).map(user => ({
      id: user.id,
      name: user.name,
      emoji: user.emoji,
      isAdmin: user.isAdmin,
      currentVote: user.currentVote,
      hasVoted: session.currentTask ? session.currentTask.votes.has(user.id) : false
    }));

    let currentTask = null;
    if (session.currentTask) {
      const votes = {};
      session.currentTask.votes.forEach((value, userId) => {
        votes[userId] = value;
      });

      currentTask = {
        id: session.currentTask.id,
        description: session.currentTask.description,
        votes: votes,
        revealed: session.currentTask.revealed,
        createdAt: session.currentTask.createdAt
      };
    }

    // Include all tasks except the current one (for history)
    const currentTaskId = session.currentTask ? session.currentTask.id : null;
    
    const tasks = session.tasks
      .filter(task => task.id !== currentTaskId)
      .map(task => {
        const taskData = {
          id: task.id,
          description: task.description,
          revealed: task.revealed || false,
          completed: task.completed || false,
          cancelled: task.cancelled || false,
          createdAt: task.createdAt
        };
        
        // Include estimate details if available
        if (task.estimateSummary) {
          taskData.estimateSummary = task.estimateSummary;
        }
        if (task.averageEstimate) {
          taskData.averageEstimate = task.averageEstimate;
        }
        
        return taskData;
      });

    return {
      sessionId: session.id,
      users,
      currentTask,
      tasks,
      createdAt: session.createdAt
    };
  }
}

module.exports = GameManager;
