import { useState, useEffect, useCallback } from 'react';
import { GameState, User } from '../types';
import { socketService } from '../services/socketService';

export function useGameState() {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log('[useGameState] ========================================');
    console.log('[useGameState] Setting up event listeners');
    console.log('[useGameState] ========================================');
    
    const gameStateHandler = (state: GameState) => {
      console.log('[useGameState] ========================================');
      console.log('[useGameState] game-state received!', { 
        sessionId: state.sessionId, 
        usersCount: state.users.length,
        users: state.users.map(u => ({ id: u.id, name: u.name, emoji: u.emoji, isAdmin: u.isAdmin })),
        hasCurrentTask: !!state.currentTask,
        tasksCount: state.tasks.length
      });
      console.log('[useGameState] ========================================');
      setGameState(state);
      setError(null);
    };
    
    const errorHandler = (data: { message: string }) => {
      console.error('[useGameState] Error received', data);
      setError(data.message);
    };
    
    // Set up listeners - they'll work even if socket isn't connected yet
    // Socket.io will queue events if not connected
    socketService.onGameState(gameStateHandler);
    socketService.onError(errorHandler);
    
    console.log('[useGameState] Listeners registered');

    return () => {
      console.log('[useGameState] Cleaning up event listeners');
      socketService.off('game-state', gameStateHandler);
      socketService.off('error', errorHandler);
    };
  }, []);

  const updateCurrentUser = useCallback((userId: string) => {
    if (gameState) {
      const user = gameState.users.find(u => u.id === userId);
      setCurrentUser(user || null);
    }
  }, [gameState]);

  return {
    gameState,
    currentUser,
    error,
    setError,
    updateCurrentUser,
  };
}
