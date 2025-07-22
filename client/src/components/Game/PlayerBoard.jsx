// client/src/components/Game/PlayerBoard.jsx - Fixed version compatible with GameScreen
import React from 'react';

const PlayerBoard = ({ player, isCurrentPlayer, currentRound, onActivateX2 }) => {
  // Safety check for player prop
  if (!player || !player._id) {
    return null;
  }

  return (
    <div style={{
      border: '2px solid #e0e0e0',
      borderRadius: '8px',
      padding: '15px',
      backgroundColor: isCurrentPlayer ? '#e3f2fd' : 
                     !player.isAlive ? '#ffebee' : '#f8f9fa',
      borderColor: isCurrentPlayer ? '#2196f3' : 
                   !player.isAlive ? '#f44336' : '#e0e0e0',
      opacity: player.isAlive ? 1 : 0.7,
      transition: 'all 0.3s ease'
    }}>
      {/* Player Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <h3 style={{ 
            margin: 0, 
            fontSize: '18px',
            color: player.isAlive ? '#333' : '#666'
          }}>
            {player.name}
          </h3>
          
          {/* Player badges */}
          {isCurrentPlayer && (
            <span style={{
              backgroundColor: '#2196f3',
              color: 'white',
              padding: '2px 8px',
              borderRadius: '12px',
              fontSize: '12px',
              fontWeight: 'bold'
            }}>
              YOU
            </span>
          )}
          
          {player.isHost && (
            <span style={{
              backgroundColor: '#ff9800',
              color: 'white',
              padding: '2px 8px',
              borderRadius: '12px',
              fontSize: '12px',
              fontWeight: 'bold'
            }}>
              👑 HOST
            </span>
          )}
          
          {!player.isAlive && (
            <span style={{
              backgroundColor: '#f44336',
              color: 'white',
              padding: '2px 8px',
              borderRadius: '12px',
              fontSize: '12px',
              fontWeight: 'bold'
            }}>
              💀 DEAD
            </span>
          )}
        </div>
        
        {/* Status indicator */}
        <div style={{
          width: '12px',
          height: '12px',
          borderRadius: '50%',
          backgroundColor: player.isAlive ? '#4caf50' : '#f44336'
        }}></div>
      </div>

      {/* Player Stats */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(80px, 1fr))',
        gap: '15px',
        marginBottom: player.hasX2Active ? '12px' : '0'
      }}>
        {/* Lives */}
        <div style={{ textAlign: 'center' }}>
          <div style={{ 
            fontSize: '12px', 
            color: '#666', 
            marginBottom: '4px',
            fontWeight: '500'
          }}>
            Lives
          </div>
          <div style={{ 
            fontSize: '20px', 
            fontWeight: 'bold',
            color: player.lives > 3 ? '#4caf50' : 
                   player.lives > 1 ? '#ff9800' : '#f44336'
          }}>
            ❤️ {player.lives || 0}
          </div>
        </div>
        
        {/* Money */}
        <div style={{ textAlign: 'center' }}>
          <div style={{ 
            fontSize: '12px', 
            color: '#666', 
            marginBottom: '4px',
            fontWeight: '500'
          }}>
            Money
          </div>
          <div style={{ 
            fontSize: '20px', 
            fontWeight: 'bold',
            color: '#ff9800'
          }}>
            💰 ${player.money || 0}
          </div>
        </div>

        {/* Spin History (if available) */}
        {player.spinHistory && player.spinHistory.length > 0 && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ 
              fontSize: '12px', 
              color: '#666', 
              marginBottom: '4px',
              fontWeight: '500'
            }}>
              Last Spin
            </div>
            <div style={{ fontSize: '16px' }}>
              {(() => {
                const lastSpin = player.spinHistory[player.spinHistory.length - 1];
                if (!lastSpin) return '—';
                
                switch (lastSpin.result) {
                  case 'death': return '💀';
                  case 'bonus': return '❤️';
                  case 'safe': return '✅';
                  default: return '—';
                }
              })()}
            </div>
          </div>
        )}
      </div>

      {/* X2 Risk Indicator */}
      {player.hasX2Active && (
        <div style={{
          backgroundColor: '#f44336',
          color: 'white',
          padding: '8px',
          borderRadius: '6px',
          textAlign: 'center',
          fontWeight: 'bold',
          fontSize: '14px',
          marginTop: '8px',
          animation: 'pulse 2s infinite'
        }}>
          ⚡ X2 RISK ACTIVE ⚡
        </div>
      )}

      {/* X2 Action Button (only for current player if alive and callback provided) */}
      {isCurrentPlayer && player.isAlive && onActivateX2 && (
        <div style={{ marginTop: '12px' }}>
          <button
            onClick={onActivateX2}
            style={{
              width: '100%',
              padding: '10px',
              fontSize: '14px',
              fontWeight: 'bold',
              backgroundColor: player.hasX2Active ? '#f44336' : '#ff9800',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              transition: 'background-color 0.3s ease'
            }}
          >
            {player.hasX2Active ? '❌ Disable X2 Risk' : '⚡ Activate X2 Risk'}
          </button>
          <p style={{ 
            fontSize: '11px', 
            color: '#666', 
            margin: '6px 0 0 0',
            textAlign: 'center',
            fontStyle: 'italic'
          }}>
            X2 Risk: Double rewards on win, double penalty on loss!
          </p>
        </div>
      )}

      <style>
        {`
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.7; }
          }
        `}
      </style>
    </div>
  );
};

export default PlayerBoard;