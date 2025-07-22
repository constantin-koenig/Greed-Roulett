import React from 'react';

const PlayerBoard = ({ players, currentPlayerId, onActivateX2, x2Allowed }) => {
  const currentPlayer = players.find(p => p._id === currentPlayerId);

  return (
    <div>
      <div style={{ border: '1px solid #ddd', borderRadius: '4px', padding: '15px' }}>
        {players.map((player) => (
          <div 
            key={player._id}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '12px',
              backgroundColor: player._id === currentPlayerId ? '#e3f2fd' : 
                             !player.isAlive ? '#ffebee' : 'transparent',
              borderRadius: '4px',
              marginBottom: '8px',
              opacity: player.isAlive ? 1 : 0.6
            }}
          >
            <div>
              <div style={{ fontWeight: 'bold', fontSize: '16px' }}>
                {player.name}
                {player._id === currentPlayerId && <span style={{ color: '#2196f3', marginLeft: '8px' }}>(You)</span>}
                {!player.isAlive && <span style={{ color: '#f44336', marginLeft: '8px' }}>💀</span>}
              </div>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '12px', color: '#666' }}>Lives</div>
                <div style={{ fontSize: '18px', color: '#4caf50', fontWeight: 'bold' }}>
                  ❤️ {player.lives}
                </div>
              </div>
              
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '12px', color: '#666' }}>Money</div>
                <div style={{ fontSize: '18px', color: '#ff9800', fontWeight: 'bold' }}>
                  💰 ${player.money}
                </div>
              </div>
              
              {player.hasX2Active && (
                <div style={{ 
                  backgroundColor: '#f44336', 
                  color: 'white', 
                  padding: '4px 8px', 
                  borderRadius: '4px',
                  fontSize: '12px',
                  fontWeight: 'bold'
                }}>
                  2X RISK
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {x2Allowed && currentPlayer?.isAlive && (
        <div style={{ marginTop: '15px', textAlign: 'center' }}>
          <button
            onClick={onActivateX2}
            style={{
              padding: '10px 20px',
              fontSize: '16px',
              backgroundColor: currentPlayer.hasX2Active ? '#f44336' : '#ff9800',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            {currentPlayer.hasX2Active ? 'Disable X2 Risk' : 'Activate X2 Risk'}
          </button>
          <p style={{ fontSize: '12px', color: '#666', marginTop: '8px' }}>
            X2 Risk: Double rewards on win, double penalty on loss!
          </p>
        </div>
      )}
    </div>
  );
};

export default PlayerBoard;