// client/src/components/Game/ActionPanel.jsx - Updated without permanent death wheel
import React from 'react';

const ActionPanel = ({ 
  currentPlayer, 
  roundPhase, 
  alivePlayers,
  deadPlayers,
  onReadyNextRound 
}) => {
  return (
    <div style={{
      padding: '20px',
      backgroundColor: '#f8f9fa',
      borderRadius: '12px',
      border: '2px solid #e0e0e0'
    }}>
      
      {/* Game Status Overview */}
      <div style={{ marginBottom: '20px' }}>
        <h3 style={{ 
          margin: '0 0 15px 0', 
          color: '#333',
          fontSize: '20px',
          textAlign: 'center'
        }}>
          🎮 Game Status
        </h3>
        
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '15px',
          marginBottom: '15px'
        }}>
          <div style={{
            padding: '12px',
            backgroundColor: '#e8f5e8',
            borderRadius: '8px',
            border: '1px solid #4caf50',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '20px', marginBottom: '4px' }}>💚</div>
            <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#4caf50' }}>
              {alivePlayers.length}
            </div>
            <div style={{ fontSize: '12px', color: '#666' }}>Alive</div>
          </div>
          
          <div style={{
            padding: '12px',
            backgroundColor: '#ffebee',
            borderRadius: '8px',
            border: '1px solid #f44336',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '20px', marginBottom: '4px' }}>💀</div>
            <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#f44336' }}>
              {deadPlayers.length}
            </div>
            <div style={{ fontSize: '12px', color: '#666' }}>Eliminated</div>
          </div>
        </div>
      </div>

      {/* Current Player Status */}
      {currentPlayer && (
        <div style={{
          padding: '15px',
          backgroundColor: currentPlayer.isAlive ? '#e3f2fd' : '#ffebee',
          borderRadius: '10px',
          border: `2px solid ${currentPlayer.isAlive ? '#2196f3' : '#f44336'}`,
          marginBottom: '20px'
        }}>
          <h4 style={{
            margin: '0 0 10px 0',
            color: currentPlayer.isAlive ? '#1976d2' : '#d32f2f',
            textAlign: 'center'
          }}>
            {currentPlayer.isAlive ? '🎯 Your Status' : '💀 Eliminated'}
          </h4>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(80px, 1fr))',
            gap: '10px',
            textAlign: 'center'
          }}>
            <div>
              <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>
                Lives
              </div>
              <div style={{
                fontSize: '18px',
                fontWeight: 'bold',
                color: currentPlayer.lives > 3 ? '#4caf50' : 
                       currentPlayer.lives > 1 ? '#ff9800' : '#f44336'
              }}>
                ❤️ {currentPlayer.lives || 0}
              </div>
            </div>
            
            <div>
              <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>
                Money
              </div>
              <div style={{
                fontSize: '18px',
                fontWeight: 'bold',
                color: '#ff9800'
              }}>
                💰 ${currentPlayer.money || 0}
              </div>
            </div>
            
            {currentPlayer.hasX2Active && (
              <div>
                <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>
                  Risk
                </div>
                <div style={{
                  fontSize: '14px',
                  fontWeight: 'bold',
                  color: '#f44336',
                  padding: '4px 8px',
                  backgroundColor: 'rgba(244, 67, 54, 0.1)',
                  borderRadius: '6px'
                }}>
                  ⚡ X2
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Phase-specific Content */}
      {roundPhase === 'preparation' && (
        <div style={{
          padding: '15px',
          backgroundColor: '#fff3e0',
          borderRadius: '8px',
          border: '1px solid #ff9800',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '32px', marginBottom: '10px' }}>⏳</div>
          <h4 style={{ margin: '0 0 8px 0', color: '#ef6c00' }}>
            Round Preparation
          </h4>
          <p style={{ margin: 0, fontSize: '14px', color: '#bf360c' }}>
            The host is deciding the round format...
          </p>
        </div>
      )}

      {roundPhase === 'minigame' && (
        <div style={{
          padding: '15px',
          backgroundColor: '#e8f5e8',
          borderRadius: '8px',
          border: '1px solid #4caf50',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '32px', marginBottom: '10px' }}>🎮</div>
          <h4 style={{ margin: '0 0 8px 0', color: '#2e7d32' }}>
            Minigame Active
          </h4>
          <p style={{ margin: 0, fontSize: '14px', color: '#1b5e20' }}>
            Complete the challenge to earn rewards!
          </p>
        </div>
      )}

      {roundPhase === 'spinning' && !currentPlayer?.isAlive && (
        <div style={{
          padding: '15px',
          backgroundColor: '#f3e5f5',
          borderRadius: '8px',
          border: '1px solid #9c27b0',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '32px', marginBottom: '10px' }}>👀</div>
          <h4 style={{ margin: '0 0 8px 0', color: '#7b1fa2' }}>
            Spectating Death Wheel
          </h4>
          <p style={{ margin: 0, fontSize: '14px', color: '#4a148c' }}>
            Watch as the remaining players face their fate...
          </p>
        </div>
      )}

      {roundPhase === 'spinning' && currentPlayer?.isAlive && (
        <div style={{
          padding: '15px',
          backgroundColor: '#ffebee',
          borderRadius: '8px',
          border: '1px solid #f44336',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '32px', marginBottom: '10px' }}>🎰</div>
          <h4 style={{ margin: '0 0 8px 0', color: '#d32f2f' }}>
            Death Wheel Active
          </h4>
          <p style={{ margin: 0, fontSize: '14px', color: '#c62828' }}>
            The death wheel will appear when it's your turn to spin!
          </p>
        </div>
      )}

      {roundPhase === 'results' && currentPlayer?.isAlive && (
        <div style={{
          padding: '15px',
          backgroundColor: '#e3f2fd',
          borderRadius: '8px',
          border: '1px solid #2196f3',
          textAlign: 'center',
          marginTop: '20px'
        }}>
          <div style={{ fontSize: '32px', marginBottom: '10px' }}>✅</div>
          <h4 style={{ margin: '0 0 15px 0', color: '#1976d2' }}>
            Round Complete
          </h4>
          <button
            onClick={onReadyNextRound}
            style={{
              padding: '12px 24px',
              backgroundColor: '#2196F3',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: 'bold',
              width: '100%',
              transition: 'all 0.3s ease',
              boxShadow: '0 4px 8px rgba(33, 150, 243, 0.3)'
            }}
          >
            🚀 Ready for Next Round
          </button>
          <p style={{
            margin: '10px 0 0 0',
            fontSize: '12px',
            color: '#1976d2',
            fontStyle: 'italic'
          }}>
            Wait for all players to be ready...
          </p>
        </div>
      )}

      {/* Tips and Information */}
      <div style={{
        marginTop: '20px',
        padding: '12px',
        backgroundColor: '#f0f0f0',
        borderRadius: '6px',
        fontSize: '12px',
        color: '#666'
      }}>
        <div style={{ fontWeight: 'bold', marginBottom: '6px', color: '#333' }}>
          💡 Game Tips:
        </div>
        <ul style={{ margin: 0, paddingLeft: '16px' }}>
          <li>Minigames award bonus lives to winners</li>
          <li>Losers must face the death wheel</li>
          <li>X2 Risk doubles both rewards and penalties</li>
          <li>The death wheel gets more dangerous each spin</li>
        </ul>
      </div>

      {/* Game Rules Reminder */}
      <div style={{
        marginTop: '15px',
        padding: '10px',
        backgroundColor: '#e8f4fd',
        borderRadius: '6px',
        fontSize: '11px',
        color: '#0277bd',
        textAlign: 'center'
      }}>
        <strong>Objective:</strong> Be the last player standing or have the most money when rounds end!
      </div>
    </div>
  );
};

export default ActionPanel;