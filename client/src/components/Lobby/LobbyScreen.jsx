import React, { useState, useEffect } from 'react';
import PlayerList from './PlayerList';
import GameSettings from './GameSettings';

const LobbyScreen = ({ socket, lobby, playerId, onStartGame }) => {
  const [players, setPlayers] = useState(lobby?.players || []);
  const [gameSettings, setGameSettings] = useState(lobby?.gameSettings || {});
  const [isHost, setIsHost] = useState(false);

  useEffect(() => {
    if (!socket || !lobby) return;

    // Check if current player is host
    const currentPlayer = players.find(p => p._id === playerId);
    setIsHost(currentPlayer?.isHost || false);

    // Socket event listeners
    socket.on('playerJoined', (data) => {
      setPlayers(data.lobby.players);
    });

    socket.on('playerLeft', (data) => {
      setPlayers(data.lobby.players);
    });

    socket.on('gameStarted', (data) => {
      onStartGame(data);
    });

    socket.on('error', (data) => {
      alert(data.message);
    });

    return () => {
      socket.off('playerJoined');
      socket.off('playerLeft');
      socket.off('gameStarted');
      socket.off('error');
    };
  }, [socket, lobby, players, playerId, onStartGame]);

  const handleStartGame = () => {
    if (players.length < 2) {
      alert('Need at least 2 players to start the game');
      return;
    }
    socket.emit('startGame');
  };

  const handleUpdateSettings = (newSettings) => {
    setGameSettings(newSettings);
    socket.emit('updateGameSettings', newSettings);
  };

  const handleLeaveLobby = () => {
    socket.emit('leaveLobby');
  };

  if (!lobby) {
    return <div>Loading lobby...</div>;
  }

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1>Lobby: {lobby.name}</h1>
        <div>
          <span style={{ marginRight: '20px', fontSize: '18px', fontWeight: 'bold' }}>
            Code: {lobby.code}
          </span>
          <button onClick={handleLeaveLobby} style={{ padding: '8px 16px' }}>
            Leave Lobby
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        <div>
          <h2>Players ({players.length}/{lobby.maxPlayers})</h2>
          <PlayerList players={players} currentPlayerId={playerId} />
        </div>

        <div>
          <h2>Game Settings</h2>
          <GameSettings 
            settings={gameSettings}
            onUpdateSettings={handleUpdateSettings}
            isHost={isHost}
          />
        </div>
      </div>

      {isHost && (
        <div style={{ textAlign: 'center', marginTop: '30px' }}>
          <button 
            onClick={handleStartGame}
            disabled={players.length < 2}
            style={{ 
              padding: '12px 24px', 
              fontSize: '18px', 
              backgroundColor: players.length >= 2 ? '#4CAF50' : '#ccc',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: players.length >= 2 ? 'pointer' : 'not-allowed'
            }}
          >
            Start Game
          </button>
          <p style={{ marginTop: '10px', color: '#666' }}>
            {players.length < 2 ? 'Need at least 2 players to start' : 'Ready to start!'}
          </p>
        </div>
      )}

      {!isHost && (
        <div style={{ textAlign: 'center', marginTop: '30px' }}>
          <p style={{ fontSize: '16px', color: '#666' }}>
            Waiting for host to start the game...
          </p>
        </div>
      )}
    </div>
  );
};

export default LobbyScreen;