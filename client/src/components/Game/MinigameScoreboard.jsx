// client/src/components/Game/MinigameScoreboard.jsx
import React from 'react';

const MinigameScoreboard = ({ scoreboardData, playerId, onClose }) => {
  if (!scoreboardData) return null;

  return (
    <div style={{ 
      position: 'fixed', 
      top: 0, 
      left: 0, 
      right: 0, 
      bottom: 0, 
      backgroundColor: 'rgba(0,0,0,0.85)', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      zIndex: 2000,
      padding: '20px'
    }}>
      <div style={{ 
        backgroundColor: 'white', 
        padding: '30px', 
        borderRadius: '15px', 
        maxWidth: '800px',
        width: '100%',
        maxHeight: '90vh',
        overflow: 'auto',
        boxShadow: '0 15px 35px rgba(0,0,0,0.3)'
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '25px' }}>
          <h2 style={{ 
            margin: '0 0 10px 0', 
            color: '#1a1a1a',
            fontSize: '28px'
          }}>
            🎯 Reflex Challenge Complete!
          </h2>
          <p style={{ 
            margin: 0, 
            fontSize: '18px', 
            color: '#666'
          }}>
            {scoreboardData.message}
          </p>
        </div>

        {/* Winner Spotlight */}
        {scoreboardData.winnerId && (
          <div style={{
            padding: '20px',
            backgroundColor: '#fff3cd',
            border: '2px solid #ffc107',
            borderRadius: '10px',
            textAlign: 'center',
            marginBottom: '25px'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '10px' }}>🏆</div>
            <h3 style={{ 
              margin: '0 0 5px 0', 
              color: '#856404',
              fontSize: '24px'
            }}>
              Champion: {scoreboardData.players.find(p => p._id === scoreboardData.winnerId)?.name || 'Unknown'}
            </h3>
            <p style={{ 
              margin: 0, 
              color: '#856404',
              fontSize: '16px'
            }}>
              +1 Bonus Life Awarded! 🎉
            </p>
          </div>
        )}

        {/* Round Winners */}
        {scoreboardData.roundWinners && scoreboardData.roundWinners.length > 0 && (
          <div style={{ marginBottom: '25px' }}>
            <h4 style={{ color: '#333', marginBottom: '15px' }}>Round Winners:</h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
              {scoreboardData.roundWinners.map((winner, index) => {
                const player = scoreboardData.players.find(p => p._id === winner.playerId);
                return (
                  <div key={index} style={{
                    padding: '10px',
                    backgroundColor: '#e8f5e8',
                    border: '1px solid #4CAF50',
                    borderRadius: '6px',
                    textAlign: 'center'
                  }}>
                    <div style={{ fontWeight: 'bold', color: '#2e7d32' }}>
                      Round {winner.round}
                    </div>
                    <div style={{ fontSize: '14px', color: '#1b5e20' }}>
                      {player?.name || 'Unknown'}
                    </div>
                    {winner.reactionTime && (
                      <div style={{ fontSize: '12px', color: '#388e3c' }}>
                        {winner.reactionTime}ms
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Player Standings */}
        <div style={{ marginBottom: '25px' }}>
          <h4 style={{ color: '#333', marginBottom: '15px' }}>Updated Player Standings:</h4>
          <div style={{ display: 'grid', gap: '10px' }}>
            {scoreboardData.players
              .sort((a, b) => (b.lives || 0) - (a.lives || 0)) // Sort by lives descending
              .map((player, index) => {
                const minigameResult = player.minigameResult;
                const isWinner = player._id === scoreboardData.winnerId;
                const isCurrentPlayer = player._id === playerId;
                
                return (
                  <div key={player._id} style={{
                    padding: '15px',
                    backgroundColor: 
                      isCurrentPlayer ? '#e3f2fd' :
                      isWinner ? '#fff3cd' :
                      '#f8f9fa',
                    border: `2px solid ${
                      isCurrentPlayer ? '#2196f3' :
                      isWinner ? '#ffc107' :
                      '#e9ecef'
                    }`,
                    borderRadius: '8px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                      <div style={{
                        width: '30px',
                        height: '30px',
                        borderRadius: '50%',
                        backgroundColor: 
                          index === 0 ? '#ffd700' :
                          index === 1 ? '#c0c0c0' :
                          index === 2 ? '#cd7f32' : '#e0e0e0',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 'bold',
                        color: index <= 2 ? 'white' : '#666'
                      }}>
                        {index + 1}
                      </div>
                      
                      <div>
                        <div style={{ 
                          fontWeight: 'bold', 
                          fontSize: '16px',
                          color: '#333'
                        }}>
                          {player.name}
                          {isCurrentPlayer && <span style={{ color: '#2196f3', marginLeft: '8px' }}>(You)</span>}
                          {isWinner && <span style={{ marginLeft: '8px' }}>🏆</span>}
                        </div>
                        
                        {/* Minigame Performance */}
                        {minigameResult && (
                          <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                            Rounds Won: {minigameResult.roundsWon || 0}/3 | 
                            Points: {minigameResult.totalPoints || 0}
                            {minigameResult.eliminatedInRound && (
                              <span style={{ color: '#f44336', marginLeft: '8px' }}>
                                (Eliminated R{minigameResult.eliminatedInRound})
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ 
                        fontSize: '24px', 
                        fontWeight: 'bold',
                        color: player.lives > 3 ? '#4caf50' : 
                               player.lives > 1 ? '#ff9800' : '#f44336'
                      }}>
                        ❤️ {player.lives || 0}
                      </div>
                      
                      {isWinner && (
                        <div style={{ 
                          fontSize: '12px', 
                          color: '#4caf50',
                          fontWeight: 'bold',
                          marginTop: '4px'
                        }}>
                          +1 Life!
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
          </div>
        </div>

        {/* Close Button */}
        <div style={{ textAlign: 'center' }}>
          <button 
            onClick={onClose}
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
            Continue Game 🎮
          </button>
        </div>
      </div>
    </div>
  );
};

export default MinigameScoreboard;