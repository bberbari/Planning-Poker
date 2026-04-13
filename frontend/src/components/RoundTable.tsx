import { User, Task } from '../types';
import './RoundTable.css';

interface RoundTableProps {
  users: User[];
  currentUserId: string;
  currentTask: Task | null;
}

function RoundTable({ users, currentUserId, currentTask }: RoundTableProps) {

  const getVotingStatus = (user: User) => {
    if (!currentTask) return 'waiting';
    if (currentTask.revealed) return 'revealed';
    if (user.hasVoted) return 'voted';
    return 'not-voted';
  };

  const getAngle = (index: number, total: number) => {
    return (index * 360) / total;
  };

  const radius = Math.max(150, users.length * 20 + 100);

  return (
    <div className="roundtable-container">
      <div className="roundtable-title">Round Table</div>
      <div className="roundtable-circle" style={{ width: radius * 2, height: radius * 2 }}>
        {users.map((user, index) => {
          const angle = getAngle(index, users.length);
          const radian = (angle * Math.PI) / 180;
          const x = Math.cos(radian) * (radius - 60);
          const y = Math.sin(radian) * (radius - 60);
          const status = getVotingStatus(user);
          const isCurrentUser = user.id === currentUserId;

          return (
            <div
              key={user.id}
              className={`user-avatar ${status} ${isCurrentUser ? 'current-user' : ''}`}
              style={{
                position: 'absolute',
                left: `calc(50% + ${x}px)`,
                top: `calc(50% + ${y}px)`,
                transform: 'translate(-50%, -50%)',
              }}
              title={`${user.name} ${user.isAdmin ? '(Admin)' : ''}`}
            >
              <div className="avatar-initials">{user.emoji}</div>
              {user.isAdmin && <div className="admin-crown">👑</div>}
              {status === 'voted' && <div className="voted-indicator">✓</div>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default RoundTable;
