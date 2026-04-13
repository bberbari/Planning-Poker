import { useState, useEffect } from 'react';
import './JoinSession.css';

interface JoinSessionProps {
  sessionId: string;
  onJoin: (name: string, isAdmin: boolean) => void;
  error?: string | null;
  onErrorClear?: () => void;
}

function JoinSession({ sessionId, onJoin, error: externalError, onErrorClear }: JoinSessionProps) {
  const [name, setName] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Use external error if provided, otherwise use local error
  const displayError = externalError || error;

  // Clear loading state after timeout if join doesn't complete
  useEffect(() => {
    if (loading) {
      const timeout = setTimeout(() => {
        console.log('[JoinSession] Loading timeout - clearing loading state');
        setLoading(false);
        setError('Connection timeout. Please check your connection and try again.');
      }, 10000); // 10 second timeout

      return () => clearTimeout(timeout);
    }
  }, [loading]);
  
  // Handle external errors (e.g., from socket errors)
  useEffect(() => {
    if (externalError) {
      console.log('[JoinSession] External error received', externalError);
      setLoading(false);
      // Clear error when user starts typing
    }
  }, [externalError]);
  
  // Clear external error when user types
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setName(e.target.value);
    setError('');
    if (onErrorClear) {
      onErrorClear();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const trimmedName = name.trim();
    
    console.log('[JoinSession] Form submitted', { name: trimmedName, sessionId, event: e.type });
    
    if (!trimmedName) {
      setError('Please enter your name');
      console.log('[JoinSession] Validation failed: no name');
      return;
    }

    if (trimmedName.length > 20) {
      setError('Name must be 20 characters or less');
      console.log('[JoinSession] Validation failed: name too long');
      return;
    }

    setError('');
    setLoading(true);
    console.log('[JoinSession] Validation passed, calling onJoin', { name: trimmedName, isAdmin });
    
    // Call onJoin - the loading state will be managed by the parent component
    // when the user successfully joins or an error occurs
    try {
      onJoin(trimmedName, isAdmin);
      console.log('[JoinSession] onJoin called successfully');
    } catch (err) {
      console.error('[JoinSession] Error joining session:', err);
      setError('Failed to join session. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="join-session-container">
      <div className="join-session-content">
        <h2>Join Banyan Technology Estimation Session</h2>
        <p className="session-id">Session: {sessionId}</p>
        
        <form onSubmit={handleSubmit} className="join-form">
          <div className="form-group">
            <label htmlFor="name">Your Name:</label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={handleNameChange}
              placeholder="Enter your name"
              maxLength={20}
              autoFocus
            />
          </div>

          <div className="form-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={isAdmin}
                onChange={(e) => setIsAdmin(e.target.checked)}
                className="admin-checkbox"
              />
              <span>Join as Admin</span>
            </label>
            <p className="checkbox-hint">Admins can create tasks, reveal cards, and manage the session</p>
          </div>

          {displayError && (
            <div className="error-message">
              {displayError}
              {onErrorClear && (
                <button 
                  type="button"
                  onClick={() => {
                    setError('');
                    onErrorClear();
                  }}
                  className="error-close-btn"
                  aria-label="Close error"
                >
                  ×
                </button>
              )}
            </div>
          )}

          {loading && (
            <div className="connection-status-info">
              <p>Connecting to server...</p>
              <p className="connection-hint">Make sure the backend server is running on port 3001</p>
              <p className="connection-hint">Check the browser console (F12) for connection details</p>
            </div>
          )}

          <button 
            type="submit" 
            className="join-btn"
            disabled={loading}
            onClick={() => {
              console.log('[JoinSession] Button clicked', { loading, name: name.trim() });
            }}
          >
            {loading ? (
              <>
                <span className="loading-spinner-small"></span>
                Joining...
              </>
            ) : (
              'Join Session'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

export default JoinSession;
