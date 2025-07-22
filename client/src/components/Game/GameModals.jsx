// client/src/components/Game/GameModals.jsx
import React from 'react';

const GameModals = ({ 
  showLeaveModal, 
  onConfirmLeave, 
  onCancelLeave, 
  gameState, 
  onBackToMenu 
}) => {
  return (
    <>
      {/* Leave Game Confirmation Modal */}
      {showLeaveModal && (
        <div style={{ 
          position: 'fixed', 
          top: 0, 
          left: 0, 
          right: 0, 
          bottom: 0, 
          backgroundColor: 'rgba(0,0,0,0.7)', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          zIndex: 1001
        }}>
          <div style={{ 
            backgroundColor: 'white', 
            padding: '30px', 
            borderRadius: '12px', 
            textAlign: 'center',
            minWidth: '350px',
            boxShadow: '0 10px 25px rgba(0,0,0,0.3)'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '15px' }}>⚠️</div>
            <h3 style={{ color: '#1a1a1a', marginBottom: '15px' }}>
              Leave Game?
            </h3>
            <p style={{ fontSize: '16px', color: '#666', marginBottom: '25px' }}>
              Are you sure you want to leave the game? Your progress will be lost.
            </p>
            <div style={{ display: 'flex', gap: '15px', justifyContent: 'center' }}>
              <button 
                onClick={onCancelLeave}
                style={{ 
                  padding: '12px 20px', 
                  fontSize: '16px',
                  backgroundColor: '#6c757d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button 
                onClick={onConfirmLeave}
                style={{ 
                  padding: '12px 20px', 
                  fontSize: '16px',
                  backgroundColor: '#dc3545',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
              >
                Leave Game
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Game Over Modal */}
      {gameState === 'Ended' && (
        <div style={{ 
          position: 'fixed', 
          top: 0, 
          left: 0, 
          right: 0, 
          bottom: 0, 
          backgroundColor: 'rgba(0,0,0,0.8)', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{ 
            backgroundColor: 'white', 
            padding: '40px', 
            borderRadius: '12px', 
            textAlign: 'center',
            minWidth: '400px',
            boxShadow: '0 10px 25px rgba(0,0,0,0.3)'
          }}>
            <div style={{ fontSize: '64px', marginBottom: '20px' }}>🏆</div>
            <h2 style={{ color: '#1a1a1a', marginBottom: '15px' }}>
              Game Over!
            </h2>
            <p style={{ fontSize: '18px', color: '#666', marginBottom: '10px' }}>
              Thanks for playing Greed Roulette!
            </p>
            <p style={{ fontSize: '16px', color: '#888', marginBottom: '30px' }}>
              May the odds be ever in your favor next time!
            </p>
            <button 
              onClick={onBackToMenu} 
              style={{ 
                padding: '15px 30px', 
                fontSize: '16px',
                fontWeight: 'bold',
                backgroundColor: '#4CAF50',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                boxShadow: '0 4px 8px rgba(76, 175, 80, 0.3)'
              }}
            >
              🏠 Back to Menu
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default GameModals;