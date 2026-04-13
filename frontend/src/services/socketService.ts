import { io, Socket } from 'socket.io-client';
import { GameState } from '../types';
import { SOCKET_URL } from '../utils/apiConfig';

export class SocketService {
  private socket: Socket | null = null;
  private pendingListeners: Map<string, Array<(...args: any[]) => void>> = new Map();

  connect(): Socket {
    if (!this.socket) {
      console.log('[SocketService] Creating new socket connection', { SOCKET_URL });
      console.log('[SocketService] Attempting to connect to:', SOCKET_URL);
      this.socket = io(SOCKET_URL, {
        transports: ['polling', 'websocket'], // Try polling first, then websocket
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: 5,
        timeout: 10000, // 10 second timeout
        forceNew: false,
        autoConnect: true,
        upgrade: true,
        rememberUpgrade: false,
        path: '/socket.io/', // Explicit path
      });
      
      console.log('[SocketService] Socket instance created, connecting...', {
        connected: this.socket.connected,
        id: this.socket.id,
        transport: this.socket.io?.engine?.transport?.name
      });
      
      this.socket.on('connect', () => {
        const sock = this.socket;
        if (!sock) return;
        console.log('[SocketService] ========================================');
        console.log('[SocketService] Socket connected!', { socketId: sock.id });
        console.log('[SocketService] ========================================');
        // Register any pending listeners now that socket is connected
        this.registerPendingListeners();

        const hasGameStateListener = sock.listeners('game-state').length > 0;
        console.log('[SocketService] game-state listener count:', sock.listeners('game-state').length);
        if (!hasGameStateListener) {
          console.warn('[SocketService] WARNING: No game-state listener registered!');
        }
      });
      
      this.socket.on('disconnect', (reason) => {
        console.log('[SocketService] Socket disconnected', { reason });
      });
      
      this.socket.on('connect_error', (error) => {
        const e = error as Error & {
          type?: string;
          description?: string;
          context?: unknown;
          data?: unknown;
        };
        console.error('[SocketService] Socket connection error', {
          message: e.message,
          type: e.type,
          description: e.description,
          context: e.context,
          data: e.data,
        });
        console.error('[SocketService] Full error object:', e);
      });
      
      this.socket.on('error', (error) => {
        console.error('[SocketService] Socket error event', error);
      });
      
      this.socket.on('reconnect_attempt', (attemptNumber) => {
        console.log('[SocketService] Reconnection attempt', { attemptNumber });
      });
      
      this.socket.on('reconnect_failed', () => {
        console.error('[SocketService] Reconnection failed after all attempts');
      });
    } else {
      console.log('[SocketService] Socket already exists', { socketId: this.socket.id, isConnected: this.socket.connected });
    }
    return this.socket;
  }

  private registerPendingListeners(): void {
    if (!this.socket || !this.socket.connected) {
      console.log('[SocketService] Cannot register pending listeners - socket not connected');
      return;
    }
    
    console.log('[SocketService] Registering pending listeners', { 
      count: this.pendingListeners.size,
      events: Array.from(this.pendingListeners.keys())
    });
    
    this.pendingListeners.forEach((callbacks, event) => {
      callbacks.forEach(callback => {
        console.log('[SocketService] Registering pending listener', { event, socketId: this.socket?.id });
        this.socket?.on(event, callback);
      });
    });
    
    const registeredCount = Array.from(this.pendingListeners.values()).reduce((sum, arr) => sum + arr.length, 0);
    console.log('[SocketService] Registered', registeredCount, 'pending listeners');
    
    // Verify game-state listener
    const gameStateListeners = this.socket.listeners('game-state').length;
    console.log('[SocketService] game-state listeners after registration:', gameStateListeners);
    
    this.pendingListeners.clear();
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  getSocket(): Socket | null {
    return this.socket;
  }

  // Client -> Server events
  joinSession(sessionId: string, name: string, isAdmin: boolean = false): void {
    console.log('[SocketService] joinSession called', { sessionId, name, isAdmin, hasSocket: !!this.socket, isConnected: this.socket?.connected });
    
    // Validate inputs
    if (!sessionId || !name) {
      console.error('[SocketService] joinSession: Missing required parameters', { sessionId: !!sessionId, name: !!name });
      return;
    }
    
    if (!this.socket) {
      console.error('[SocketService] joinSession: Socket is null!');
      return;
    }
    if (!this.socket.connected) {
      console.warn('[SocketService] joinSession: Socket not connected!', { socketId: this.socket.id });
    }
    
    const payload = { sessionId, name, isAdmin: !!isAdmin };
    console.log('[SocketService] Emitting join-session event', payload);
    this.socket.emit('join-session', payload);
    console.log('[SocketService] join-session event emitted');
  }

  selectCard(cardValue: number): void {
    this.socket?.emit('select-card', { cardValue });
  }

  createTask(description: string): void {
    this.socket?.emit('create-task', { description });
  }

  revealCards(): void {
    this.socket?.emit('reveal-cards');
  }

  resetVoting(): void {
    this.socket?.emit('reset-voting');
  }

  // Server -> Client event listeners
  onGameState(callback: (state: GameState) => void): void {
    console.log('[SocketService] Registering game-state listener', { hasSocket: !!this.socket, isConnected: this.socket?.connected });
    
    const handler = (state: GameState) => {
      console.log('[SocketService] ========================================');
      console.log('[SocketService] game-state event received!', { 
        sessionId: state.sessionId,
        usersCount: state.users.length,
        users: state.users.map(u => ({ id: u.id, name: u.name }))
      });
      console.log('[SocketService] ========================================');
      callback(state);
    };
    
    if (this.socket && this.socket.connected) {
      // Socket is connected, register immediately
      console.log('[SocketService] Socket connected, registering game-state listener immediately');
      this.socket.on('game-state', handler);
      console.log('[SocketService] game-state listener registered on connected socket');
    } else {
      // Socket not connected yet, store for later
      console.log('[SocketService] Socket not connected, storing game-state listener for later');
      if (!this.pendingListeners.has('game-state')) {
        this.pendingListeners.set('game-state', []);
      }
      this.pendingListeners.get('game-state')!.push(handler);
    }
  }

  onUserJoined(callback: (data: { user: { id: string; name: string; emoji: string; isAdmin: boolean } }) => void): void {
    console.log('[SocketService] Registering user-joined listener');
    this.socket?.on('user-joined', (data) => {
      console.log('[SocketService] user-joined event received', data);
      callback(data);
    });
  }

  onUserLeft(callback: (data: { userId: string; userName: string; userEmoji: string }) => void): void {
    this.socket?.on('user-left', callback);
  }

  onTaskCreated(callback: (data: { task: any }) => void): void {
    this.socket?.on('task-created', callback);
  }

  onVoteReceived(callback: (data: { userId: string; userName: string; userEmoji: string; cardValue: number }) => void): void {
    this.socket?.on('vote-received', callback);
  }

  onCardsRevealed(callback: (data: { task: any }) => void): void {
    this.socket?.on('cards-revealed', callback);
  }

  onError(callback: (data: { message: string }) => void): void {
    console.log('[SocketService] Registering error listener', { hasSocket: !!this.socket, isConnected: this.socket?.connected });
    
    const handler = (data: { message: string }) => {
      console.log('[SocketService] error event received', data);
      callback(data);
    };
    
    if (this.socket && this.socket.connected) {
      this.socket.on('error', handler);
    } else {
      if (!this.pendingListeners.has('error')) {
        this.pendingListeners.set('error', []);
      }
      this.pendingListeners.get('error')!.push(handler);
      
      if (this.socket) {
        this.socket.on('connect', () => {
          this.socket?.on('error', handler);
        });
      }
    }
  }

  // Remove listeners
  off(event: string, callback?: (...args: any[]) => void): void {
    this.socket?.off(event, callback);
  }
}

export const socketService = new SocketService();
