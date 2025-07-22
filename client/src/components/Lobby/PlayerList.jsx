import React from 'react';

const PlayerList = ({ players, currentPlayerId }) => {
  return (
    <div style={{ border: '1px solid #ddd', borderRadius: '4px', padding: '10px' }}>
      {players.map((player) => (
        <div 
          key={player._id} 
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '8px',
            backgroundColor: player._id === currentPlayerId ? '#e3f2fd' : 'transparent',
            borderRadius: '4px',
            marginBottom: '4px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <span style={{ fontWeight: player.isHost ? 'bold' : 'normal' }}>
              {player.name}
              {player.isHost && <span style={{ color: '#ff9800', marginLeft: '8px' }}>👑</span>}
              {player._id === currentPlayerId && <span style={{ color: '#2196f3', marginLeft: '8px' }}>(You)</span>}
            </span>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ color: '#4caf50' }}>
              ❤️ {player.lives}
            </span>
            <span style={{ color: '#ff9800' }}>
              💰 ${player.money}
            </span>
            {player.hasX2Active && (
              <span style={{ color: '#f44336', fontWeight: 'bold' }}>
                2X
              </span>
            )}
            <span style={{ 
              width: '10px', 
              height: '10px', 
              borderRadius: '50%', 
              backgroundColor: player.isAlive ? '#4caf50' : '#f44336',
              display: 'inline-block'
            }}></span>
          </div>
        </div>
      ))}
      
      {players.length === 0 && (
        <p style={{ textAlign: 'center', color: '#666', margin: '20px 0' }}>
          No players in lobby
        </p>
      )}
    </div>
  );
};

export default PlayerList;
