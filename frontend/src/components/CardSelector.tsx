import { useState, useEffect } from 'react';
import { User, Task } from '../types';
import { socketService } from '../services/socketService';
import { FIBONACCI_CARDS, formatCardValue } from '../utils/cardUtils';
import './CardSelector.css';

interface CardSelectorProps {
  currentUser: User;
  currentTask: Task;
}

function CardSelector({ currentUser, currentTask }: CardSelectorProps) {
  const [selectedCard, setSelectedCard] = useState<number | null>(currentUser.currentVote || null);

  // Sync selectedCard with currentUser.currentVote when it changes (e.g., after reset voting)
  useEffect(() => {
    setSelectedCard(currentUser.currentVote || null);
  }, [currentUser.currentVote]);

  const handleCardSelect = (cardValue: number) => {
    if (currentTask.revealed) return;
    
    setSelectedCard(cardValue);
    socketService.selectCard(cardValue);
  };

  const hasVoted = currentUser.hasVoted || selectedCard !== null;

  return (
    <div className="card-selector">
      <h3>Select Your Estimate</h3>
      <p className="card-hint">Choose a card to estimate this task. One point equals a half day's work, two points equals a full day's work, and so on.</p>
      
      <div className="cards-container">
        {FIBONACCI_CARDS.map((cardValue) => {
          const isSelected = selectedCard === cardValue;
          const isDisabled = currentTask.revealed;

          return (
            <button
              key={cardValue === 999 ? 'infinity' : cardValue}
              className={`card ${isSelected ? 'selected' : ''} ${isDisabled ? 'disabled' : ''}`}
              onClick={() => handleCardSelect(cardValue)}
              disabled={isDisabled}
            >
              <div className="card-value">{formatCardValue(cardValue)}</div>
            </button>
          );
        })}
      </div>

      {hasVoted && (
        <div className="vote-confirmation">
          <span className="check-icon">✓</span> You've selected: <strong>{selectedCard !== null ? formatCardValue(selectedCard) : ''}</strong>
        </div>
      )}
    </div>
  );
}

export default CardSelector;
