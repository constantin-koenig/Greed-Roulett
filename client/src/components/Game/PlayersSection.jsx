// client/src/components/Game/PlayersSection.jsx
import React from 'react';
import PlayerBoard from './PlayerBoard';

const PlayersSection = ({ 
  alivePlayers, 
  deadPlayers, 
  playerId, 
  currentRound, 
  onActivateX2 
}) => {
  return (
    <div>
      <h2 style={{ color: '#333', marginBottom: '15px' }}>
        Players ({alivePlayers.length + deadPlayers.length})
      </h2>
      
      {/* Alive Players */}
      {alivePlayers.length > 0 && (
        <div style={{ marginBottom: '20px' }}>
          <h3 style={{ color: '#4CAF50', marginBottom: '10px' }}>
            ❤️ Alive ({alivePlayers.length})
          </h3>
          <div style={{ display: 'grid', gap: '10px' }}>
            {alivePlayers.map(player => player && player._id ? (
              <PlayerBoard 
                key={player._id}
                player={player}
                isCurrentPlayer={player._id === playerId}
                currentRound={currentRound}
                onActivateX2={player._id === playerId ? onActivateX2 : null}
              />
            ) : null)}
          </div>
        </div>
      )}

      {/* Dead Players */}
      {deadPlayers.length > 0 && (
        <div>
          <h3 style={{ color: '#f44336', marginBottom: '10px' }}>
            💀 Eliminated ({deadPlayers.length})
          </h3>
          <div style={{ display: 'grid', gap: '10px' }}>
            {deadPlayers.map(player => player && player._id ? (
              <PlayerBoard 
                key={player._id}
                player={player}
                isCurrentPlayer={player._id === playerId}
                currentRound={currentRound}
                onActivateX2={null}
              />
            ) : null)}
          </div>
        </div>
      )}
    </div>
  );
};

export default PlayersSection;