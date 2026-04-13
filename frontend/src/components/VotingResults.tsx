import { Task, User } from '../types';
import { formatCardValue } from '../utils/cardUtils';
import './VotingResults.css';

interface VotingResultsProps {
  task: Task;
  users: User[];
  isAdmin: boolean;
}

function VotingResults({ task, users, isAdmin }: VotingResultsProps) {
  const getVotesByUser = () => {
    return users.map(user => {
      const vote = task.votes[user.id];
      return {
        user,
        vote: vote || null,
      };
    }).filter(item => item.vote !== null);
  };

  const votesByUser = getVotesByUser();
  const votesByValue: Record<number, { users: User[]; count: number }> = {};

  votesByUser.forEach(({ user, vote }) => {
    if (vote !== null) {
      if (!votesByValue[vote]) {
        votesByValue[vote] = { users: [], count: 0 };
      }
      votesByValue[vote].users.push(user);
      votesByValue[vote].count++;
    }
  });

  const sortedValues = Object.keys(votesByValue)
    .map(Number)
    .sort((a, b) => {
      if (a === 999 && b === 999) return 0;
      if (a === 999) return 1; // Infinity (999) comes last
      if (b === 999) return -1;
      return a - b;
    });

  // Calculate average of all votes (excluding Infinity/999)
  const calculateAverage = () => {
    const allVotes = votesByUser.map(item => item.vote).filter(vote => vote !== null && vote !== 999) as number[];
    if (allVotes.length === 0) return null;
    const hasInfinity = votesByUser.some(item => item.vote === 999);
    if (hasInfinity && allVotes.length > 0) {
      return '∞'; // If any vote is Infinity, show infinity
    }
    const sum = allVotes.reduce((acc, val) => acc + val, 0);
    return (sum / allVotes.length).toFixed(1);
  };

  const averageVote = calculateAverage();

  return (
    <div className="voting-results">
      <h3>Voting Results</h3>
      
      <div className="results-grid">
        {sortedValues.map((cardValue) => {
          const data = votesByValue[cardValue];
          return (
            <div key={cardValue === 999 ? 'infinity' : cardValue} className="result-card">
              <div className="result-card-value">{formatCardValue(cardValue)}</div>
              {isAdmin && (
                <div className="result-card-users">
                  {data.users.map((user) => (
                    <div key={user.id} className="result-user">
                      <span className="result-user-initials">{user.emoji}</span>
                      <span className="result-user-name">{user.name}</span>
                    </div>
                  ))}
                </div>
              )}
              <div className="result-count">{data.count} vote{data.count !== 1 ? 's' : ''}</div>
            </div>
          );
        })}
      </div>

      {votesByUser.length === 0 && (
        <div className="no-votes">
          No votes recorded yet.
        </div>
      )}

      {averageVote && (
        <div className="average-voting-results">
          <h4>Average Voting Results</h4>
          <div className="average-value">{averageVote} points</div>
        </div>
      )}
    </div>
  );
}

export default VotingResults;
