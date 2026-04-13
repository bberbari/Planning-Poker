import { useEffect, useState } from 'react';
import { socketService } from '../services/socketService';
import './ConnectionStatus.css';

function ConnectionStatus() {
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const socket = socketService.getSocket();
    if (socket) {
      setIsConnected(socket.connected);

      const onConnect = () => setIsConnected(true);
      const onDisconnect = () => setIsConnected(false);

      socket.on('connect', onConnect);
      socket.on('disconnect', onDisconnect);

      return () => {
        socket.off('connect', onConnect);
        socket.off('disconnect', onDisconnect);
      };
    }
  }, []);

  if (isConnected) {
    return null;
  }

  return (
    <div className="connection-status disconnected">
      <span className="status-indicator"></span>
      <span>Reconnecting...</span>
    </div>
  );
}

export default ConnectionStatus;
