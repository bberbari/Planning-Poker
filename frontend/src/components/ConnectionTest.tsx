import { useEffect, useState } from 'react';
import { socketService } from '../services/socketService';
import { getApiUrl } from '../utils/apiConfig';

export function ConnectionTest() {
  const [status, setStatus] = useState<string>('Testing...');
  const [details, setDetails] = useState<string>('');

  useEffect(() => {
    const testConnection = async () => {
      // Test 1: HTTP health check
      try {
        setStatus('Testing HTTP connection...');
        const healthRes = await fetch(getApiUrl('api/health'), {
          method: 'GET',
          signal: AbortSignal.timeout(3000),
        });
        
        if (healthRes.ok) {
          setDetails(prev => prev + '✓ HTTP connection works\n');
        } else {
          setDetails(prev => prev + `✗ HTTP failed: ${healthRes.status}\n`);
          setStatus('HTTP connection failed');
          return;
        }
      } catch (err: any) {
        setDetails(prev => prev + `✗ HTTP error: ${err.message}\n`);
        setStatus('HTTP connection failed');
        return;
      }

      // Test 2: Socket.io connection
      setStatus('Testing Socket.io connection...');
      const socket = socketService.getSocket() || socketService.connect();
      
      const timeout = setTimeout(() => {
        if (!socket.connected) {
          setDetails(prev => prev + '✗ Socket.io connection timeout\n');
          setStatus('Socket.io connection failed');
        }
      }, 10000);

      socket.on('connect', () => {
        clearTimeout(timeout);
        setDetails(prev => prev + `✓ Socket.io connected! ID: ${socket.id}\n`);
        setStatus('All connections working!');
      });

      socket.on('connect_error', (error) => {
        clearTimeout(timeout);
        setDetails(prev => prev + `✗ Socket.io error: ${error.message}\n`);
        setStatus('Socket.io connection failed');
      });
    };

    testConnection();
  }, []);

  return (
    <div style={{ 
      position: 'fixed', 
      top: '10px', 
      right: '10px', 
      background: 'white', 
      padding: '15px', 
      border: '2px solid #3b6ba5',
      borderRadius: '8px',
      zIndex: 10000,
      maxWidth: '400px',
      fontFamily: 'monospace',
      fontSize: '12px'
    }}>
      <div style={{ fontWeight: 'bold', marginBottom: '10px' }}>Connection Test</div>
      <div style={{ marginBottom: '5px' }}>Status: {status}</div>
      <pre style={{ 
        background: '#f5f5f5', 
        padding: '10px', 
        borderRadius: '4px',
        maxHeight: '200px',
        overflow: 'auto',
        whiteSpace: 'pre-wrap'
      }}>{details || 'Waiting...'}</pre>
    </div>
  );
}
