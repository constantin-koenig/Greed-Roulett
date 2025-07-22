// client/src/components/Game/SpinResults.jsx
import React from 'react';

const SpinResults = ({ spinResults, players }) => {
  if (spinResults.length === 0) return null;

  return (
    <div style={{ 
      marginTop: '20px',
      padding: '20px',
      backgroundColor: '#f8f9fa',
      borderRadius: '8px',
      border: '1px solid #e9ecef'
    }}>
      <h3 style={{ marginTop: 0, color: '#495057' }}>Recent Spins</h3>
      <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
        {spinResults.slice(-10).reverse().map((result, index) => {
          const player = players.find(p => p && p._id === result.playerId);
          return (
            <div key={index} style={{ 
              padding: '10px', 
              margin: '8px 0',
              backgroundColor: 'white',
              borderRadius: '6px',
              border: '1px solid #dee2e6',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <span style={{ fontWeight: 'bold' }}>
                {player?.name || 'Unknown Player'}
              </span>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ 
                  padding: '4px 8px',
                  borderRadius: '4px',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  backgroundColor: 
                    result.result === 'death' ? '#ffebee' : 
                    result.result === 'bonus' ? '#fff3e0' : '#e8f5e8',
                  color: 
                    result.result === 'death' ? '#d32f2f' : 
                    result.result === 'bonus' ? '#f57c00' : '#2e7d32'
                }}>
                  {result.result === 'death' ? '💀 Death' : 
                   result.result === 'bonus' ? '❤️ Bonus' : '✅ Safe'}
                </span>
                
                {result.livesLost > 0 && (
                  <span style={{ 
                    color: '#d32f2f', 
                    fontSize: '14px',
                    fontWeight: 'bold'
                  }}>
                    -{result.livesLost} ❤️
                  </span>
                )}
                
                <span style={{ fontSize: '12px', color: '#6c757d' }}>
                  → {result.newLives} ❤️
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SpinResults;