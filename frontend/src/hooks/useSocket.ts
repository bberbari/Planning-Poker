import { useEffect, useRef } from 'react';
import { socketService } from '../services/socketService';

export function useSocket() {
  const socketRef = useRef(socketService);

  useEffect(() => {
    console.log('[useSocket] Initializing socket connection');
    const socket = socketRef.current.connect();
    console.log('[useSocket] Socket connection initiated', { socketId: socket.id, isConnected: socket.connected });
    
    return () => {
      console.log('[useSocket] Cleaning up socket connection');
      socketRef.current.disconnect();
    };
  }, []);

  return socketRef.current;
}
