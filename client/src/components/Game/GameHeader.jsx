// client/src/components/Game/GameHeader.jsx
import React from 'react';

const GameHeader = ({ 
  lobby, 
  alivePlayers, 
  deadPlayers, 
  isHost, 
  roundPhase, 
  onStartReflexGame, 
  onSkipToSpinning, 
  onBackToLobby 
}) => {
  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'space-between', 
      alignItems: 'center',
      marginBottom: '20px',
      padding: '15px',
      backgroundColor: '#1a1a1a',
      color: 'white',
      borderRadius: '8px'
    }}>
      <div>
        <h1 style={{ margin: 0, color: '#ff6b6b' }}>Greed Roulette</h1>
        <p style={{ margin: '5px 0 0 0', opacity: 0.8 }}>
          Lobby: {lobby.name} | Round {lobby.currentRound}
        </p>
        <p style={{ margin: '2px 0 0 0', fontSize: '14px', opacity: 0.7 }}>
          Alive: {alivePlayers.length} | Dead: {deadPlayers.length}
        </p>
      </div>
      
      {/* Game Controls */}
      <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
        {isHost && roundPhase === 'preparation' && (
          <>
            <button 
              onClick={onStartReflexGame}
              style={{
                padding: '10px 15px',
                backgroundColor: '#4CAF50',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              🎯 Start Reflex Game
            </button>
            <button 
              onClick={onSkipToSpinning}
              style={{
                padding: '10px 15px',
                backgroundColor: '#ff9800',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              ⚡ Skip to Wheel
            </button>
          </>
        )}
        
        <button 
          onClick={onBackToLobby} 
          style={{ 
            padding: '10px 15px',
            backgroundColor: '#f44336',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Leave Game
        </button>
      </div>
    </div>
  );
};

export default GameHeader;