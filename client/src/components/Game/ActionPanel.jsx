// client/src/components/Game/ActionPanel.jsx
import React from 'react';
import DeathWheel from './DeathWheel';

const ActionPanel = ({ 
  deathWheelState, 
  currentPlayer, 
  roundPhase, 
  needsToSpin, 
  onSpin, 
  onReadyNextRound 
}) => {
  return (
    <div>
      <DeathWheel 
        deathWheelState={deathWheelState}
        currentPlayer={currentPlayer || null}
      />
      
      {/* Player Actions */}
      {currentPlayer?.isAlive && roundPhase === 'spinning' && (
        <div style={{ marginTop: '20px', textAlign: 'center' }}>
          <h3 style={{ marginBottom: '15px', color: '#333' }}>Your Turn</h3>
          
          {/* Spin Button */}
          <button
            onClick={onSpin}
            disabled={needsToSpin}
            style={{
              padding: '20px 30px',
              fontSize: '20px',
              fontWeight: 'bold',
              backgroundColor: needsToSpin ? '#666' : '#4CAF50',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: needsToSpin ? 'not-allowed' : 'pointer',
              width: '100%',
              boxShadow: needsToSpin ? 'none' : '0 4px 8px rgba(76, 175, 80, 0.3)',
              transition: 'all 0.3s ease'
            }}
          >
            {needsToSpin ? '🎰 Spinning...' : '🎰 SPIN THE WHEEL'}
          </button>
          
          <p style={{ 
            marginTop: '10px', 
            fontSize: '14px', 
            color: '#666',
            fontStyle: 'italic'
          }}>
            Lives: {currentPlayer.lives} ❤️ | X2 Risk: {currentPlayer.hasX2Active ? 'ON' : 'OFF'}
          </p>
        </div>
      )}

      {/* Spectator Message */}
      {!currentPlayer?.isAlive && (
        <div style={{ 
          marginTop: '20px', 
          padding: '15px',
          backgroundColor: '#ffebee',
          border: '2px solid #f44336',
          borderRadius: '8px',
          textAlign: 'center'
        }}>
          <h3 style={{ margin: '0 0 10px 0', color: '#d32f2f' }}>
            💀 You are eliminated
          </h3>
          <p style={{ margin: 0, color: '#c62828' }}>
            Watch the remaining players battle it out!
          </p>
        </div>
      )}

      {/* Ready for Next Round */}
      {roundPhase === 'results' && currentPlayer?.isAlive && (
        <div style={{ 
          marginTop: '20px',
          padding: '15px',
          backgroundColor: '#e3f2fd',
          border: '2px solid #2196f3',
          borderRadius: '8px',
          textAlign: 'center'
        }}>
          <h3 style={{ margin: '0 0 15px 0', color: '#1976d2' }}>
            Round Complete
          </h3>
          <button
            onClick={onReadyNextRound}
            style={{
              padding: '12px 20px',
              backgroundColor: '#2196F3',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '16px',
              width: '100%'
            }}
          >
            ✅ Ready for Next Round
          </button>
        </div>
      )}
    </div>
  );
};

export default ActionPanel;