import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getApiUrl } from '../utils/apiConfig';
import './Home.css';

function Home() {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const createSession = async () => {
    setLoading(true);
    try {
      const response = await fetch(getApiUrl('api/create-session'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to create session');
      }
      
      const data = await response.json();
      if (data.sessionId) {
        navigate(`/game/${data.sessionId}`);
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (error) {
      console.error('Failed to create session:', error);
      alert('Failed to create session. Please make sure the backend server is running and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="home-container">
      <div className="home-content">
        <h1>Banyan Technology Estimation</h1>
        <button 
          onClick={createSession} 
          disabled={loading}
          className="create-session-btn"
        >
          {loading ? 'Creating...' : 'Create New Session'}
        </button>
        <div className="info-section">
          <ol>
            <li>Create a session and share the link with your team.</li>
            <li>Team members join the session.</li>
            <li>The task will be presented.</li>
            <li>Questions are answered.</li>
            <li>The task is estimated using the Fibonacci sequence.</li>
            <li>The admin will review estimates.</li>
            <li>The admin will inquire for feedback, if necessary.</li>
            <li>The admin will average estimates and apply it to the task.</li>
            <li>The ticket is moved to Ready for Development.</li>
          </ol>
        </div>
      </div>
    </div>
  );
}

export default Home;
