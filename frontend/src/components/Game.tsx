import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useSocket } from '../hooks/useSocket';
import { useGameState } from '../hooks/useGameState';
import { getApiUrl } from '../utils/apiConfig';
import JoinSession from './JoinSession';
import RoundTable from './RoundTable';
import CardSelector from './CardSelector';
import TaskDisplay from './TaskDisplay';
import AdminPanel from './AdminPanel';
import VotingResults from './VotingResults';
import ConnectionStatus from './ConnectionStatus';
import { ConnectionTest } from './ConnectionTest';
import './Game.css';

function Game() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const [joined, setJoined] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [joinInfo, setJoinInfo] = useState<{ name: string } | null>(null);
  const [socketReady, setSocketReady] = useState(false);
  const { gameState, error, setError } = useGameState();
  const socket = useSocket();

  // Ensure socket is connected when component mounts
  useEffect(() => {
    console.log('[Game] Component mounted, checking socket connection');
    const socketInstance = socket.getSocket();
    
    if (socketInstance) {
      if (socketInstance.connected) {
        console.log('[Game] Socket already connected');
        setSocketReady(true);
      } else {
        console.log('[Game] Socket exists but not connected, waiting...');
        const connectHandler = () => {
          console.log('[Game] Socket connected in Game component');
          setSocketReady(true);
          socketInstance.off('connect', connectHandler);
        };
        socketInstance.on('connect', connectHandler);
        
        // Also check if it connects quickly
        const checkInterval = setInterval(() => {
          if (socketInstance.connected) {
            console.log('[Game] Socket connected (polling check)');
            setSocketReady(true);
            clearInterval(checkInterval);
            socketInstance.off('connect', connectHandler);
          }
        }, 100);
        
        // Cleanup after 5 seconds
        setTimeout(() => {
          clearInterval(checkInterval);
        }, 5000);
      }
    } else {
      // Socket doesn't exist, create it
      console.log('[Game] Socket doesn\'t exist, creating...');
      const newSocket = socket.connect();
      const connectHandler = () => {
        console.log('[Game] New socket connected');
        setSocketReady(true);
        newSocket.off('connect', connectHandler);
      };
      newSocket.on('connect', connectHandler);
    }
  }, [socket]);

  useEffect(() => {
    if (!sessionId) return;

    // First, test backend connection with timeout
    const testConnection = async () => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        
        const res = await fetch(getApiUrl('api/health'), {
          signal: controller.signal
        });
        clearTimeout(timeoutId);
        
        if (!res.ok) {
          throw new Error('Backend health check failed');
        }
        console.log('[Game] Backend is reachable');
        
        // Check session
        const sessionRes = await fetch(getApiUrl(`api/session/${sessionId}`), {
          signal: AbortSignal.timeout(5000)
        });
        
        if (sessionRes.status === 404) {
          // Session doesn't exist - this is okay, user can still join and create it
          console.log('Session not found, will be created on join');
        } else if (!sessionRes.ok) {
          throw new Error('Failed to check session');
        }
      } catch (err: any) {
        console.error('Backend connection error:', err);
        if (err.name === 'AbortError') {
          setError('Backend server is not responding. Please make sure it is running on port 3001.');
        } else {
          setError(`Cannot connect to backend server: ${err.message}. Please make sure it is running on port 3001.`);
        }
      }
    };
    
    testConnection();
  }, [sessionId, setError]);

  // When gameState arrives, try to find our user ID by matching joinInfo
  useEffect(() => {
    console.log('[Game] gameState effect triggered', { 
      hasGameState: !!gameState, 
      hasCurrentUserId: !!currentUserId, 
      hasJoinInfo: !!joinInfo,
      gameStateUsers: gameState?.users?.length || 0,
      joinInfoName: joinInfo?.name
    });
    
    if (gameState && !currentUserId && joinInfo) {
      console.log('[Game] Looking for user matching joinInfo', { 
        joinInfo, 
        usersInState: gameState.users.map(u => ({ id: u.id, name: u.name }))
      });
      
      // Find user that matches the name we used to join
      const user = gameState.users.find(
        u => u.name === joinInfo.name
      );
      
      if (user) {
        console.log('[Game] Found matching user!', { userId: user.id, user });
        setCurrentUserId(user.id);
        setJoined(true);
      } else {
        console.log('[Game] No matching user found yet', { 
          searchedFor: { name: joinInfo.name },
          availableUsers: gameState.users 
        });
      }
    }
    
    if (gameState && currentUserId) {
      const user = gameState.users.find(u => u.id === currentUserId);
      if (user) {
        console.log('[Game] Current user found in gameState', { userId: currentUserId, user });
        setJoined(true);
      } else if (gameState.users.length > 0) {
        console.log('[Game] Current user not found in gameState, resetting', { 
          currentUserId, 
          usersInState: gameState.users.map(u => u.id) 
        });
        // User might have been disconnected, reset
        setJoined(false);
        setCurrentUserId(null);
        setJoinInfo(null);
      }
    }
  }, [gameState, currentUserId, joinInfo]);

  const handleJoin = (name: string, isAdmin: boolean) => {
    console.log('[Game] handleJoin called', { name, isAdmin, sessionId, hasSessionId: !!sessionId, socketReady });
    
    if (!sessionId) {
      console.error('[Game] handleJoin: No sessionId!');
      setError('Invalid session ID');
      return;
    }
    
    if (!name || name.trim().length === 0) {
      console.error('[Game] handleJoin: No name provided!');
      setError('Please enter your name');
      return;
    }
    
    // Clear any previous errors
    setError(null);
    
    // Store join info so we can identify ourselves in gameState
    console.log('[Game] Storing joinInfo', { name, isAdmin });
    setJoinInfo({ name });
    
    // Ensure socket is created and connected
    const socketInstance = socket.connect();
    console.log('[Game] Socket instance check', { 
      hasSocket: !!socketInstance, 
      isConnected: socketInstance?.connected,
      socketId: socketInstance?.id,
      socketReady 
    });
    
    // Function to actually join the session
    const doJoin = () => {
      const trimmedName = name.trim();
      console.log('[Game] Executing join-session', { sessionId, name: trimmedName, isAdmin });
      try {
        if (!sessionId || !trimmedName) {
          console.error('[Game] Missing required fields for join', { sessionId: !!sessionId, name: !!trimmedName });
          setError('Missing required information. Please try again.');
          return;
        }
        socket.joinSession(sessionId, trimmedName, isAdmin);
      } catch (err) {
        console.error('[Game] Error calling joinSession', err);
        setError('Failed to join session. Please try again.');
      }
    };
    
    // If socket is already connected, join immediately
    if (socketInstance.connected) {
      console.log('[Game] Socket connected, joining session immediately', { sessionId, name });
      doJoin();
      return;
    }
    
    // Wait for connection with timeout
    console.log('[Game] Socket not connected, waiting for connection...');
    let connectionResolved = false;
    
    const errorHandler = (error: any) => {
      if (connectionResolved) return;
      connectionResolved = true;
      console.error('[Game] Socket connection error in handleJoin', error);
      setError(`Connection failed: ${error.message || 'Unable to connect to server'}. Please make sure the backend server is running on port 3001.`);
    };
    
    const connectHandler = () => {
      if (connectionResolved) return;
      connectionResolved = true;
      console.log('[Game] Socket connected, joining session', { sessionId, name });
      clearTimeout(connectionTimeout);
      doJoin();
      socketInstance.off('connect', connectHandler);
      socketInstance.off('connect_error', errorHandler);
    };
    
    // Set up timeout for connection (10 seconds)
    const connectionTimeout = setTimeout(() => {
      if (connectionResolved) return;
      connectionResolved = true;
      console.error('[Game] Connection timeout after 10 seconds');
      setError('Connection timeout. Please check that the backend server is running on port 3001 and try again.');
      socketInstance.off('connect', connectHandler);
      socketInstance.off('connect_error', errorHandler);
    }, 10000);
    
    socketInstance.on('connect', connectHandler);
    socketInstance.on('connect_error', errorHandler);
  };

  if (error && !sessionId) {
    return (
      <div className="game-container">
        <div className="error-container">
          <h2>Error</h2>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (!joined) {
    return sessionId ? (
      <JoinSession 
        sessionId={sessionId} 
        onJoin={handleJoin}
        error={error}
        onErrorClear={() => setError(null)}
      />
    ) : (
      <div className="game-container">
        <div className="error-container">
          <h2>Invalid Session</h2>
        </div>
      </div>
    );
  }

  // Derive currentUser from gameState
  const currentUser = gameState && currentUserId 
    ? gameState.users.find(u => u.id === currentUserId) || null
    : null;

  if (!gameState || !currentUser) {
    return (
      <div className="game-container">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <div className="loading-text">Loading game state...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="game-container">
      <ConnectionTest />
      <ConnectionStatus />
      <div className="game-header">
        <h1>Banyan Technology Estimation</h1>
        <div className="session-info">
          Session: {sessionId} | {currentUser.name}
          {currentUser.isAdmin && <span className="admin-badge">Admin</span>}
        </div>
      </div>

      {error && (
        <div className="error-banner">
          <span>⚠️ {error}</span>
          <button onClick={() => setError(null)} aria-label="Close">×</button>
        </div>
      )}

      <div className="game-content">
        <RoundTable 
          users={gameState.users} 
          currentUserId={currentUserId!}
          currentTask={gameState.currentTask}
        />

        <div className="game-main">
          <TaskDisplay task={gameState.currentTask} />

          {gameState.currentTask && (
            <>
              {gameState.currentTask.revealed ? (
                <VotingResults 
                  task={gameState.currentTask}
                  users={gameState.users}
                  isAdmin={currentUser.isAdmin}
                />
              ) : (
                <CardSelector 
                  currentUser={currentUser}
                  currentTask={gameState.currentTask}
                />
              )}
            </>
          )}
        </div>
      </div>

      {currentUser.isAdmin && (
        <div className="admin-container">
          <AdminPanel 
            currentTask={gameState.currentTask}
            users={gameState.users}
            tasks={gameState.tasks}
          />
        </div>
      )}
    </div>
  );
}

export default Game;
