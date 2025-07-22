// client/src/components/Lobby/LobbyScreen.jsx - Updated with Minigame Preview
import React, { useState, useEffect } from 'react';
import PlayerList from './PlayerList';
import GameSettings from './GameSettings';

const LobbyScreen = ({ socket, lobby, playerId, onStartGame, onBackToMenu }) => {
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

    socket.on('gameSettingsUpdated', (data) => {
      setGameSettings(data.gameSettings);
    });

    socket.on('error', (data) => {
      alert(data.message);
    });

    return () => {
      socket.off('playerJoined');
      socket.off('playerLeft');
      socket.off('gameStarted');
      socket.off('gameSettingsUpdated');
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
    onBackToMenu();
  };

  if (!lobby) {
    return <div>Loading lobby...</div>;
  }

  return (
    <div style={{ padding: '20px', maxWidth: '1000px', margin: '0 auto' }}>
      {/* Header */}
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
            Lobby: {lobby.name}
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <span style={{ 
            fontSize: '18px', 
            fontWeight: 'bold',
            color: '#4CAF50',
            padding: '8px 12px',
            backgroundColor: 'rgba(76, 175, 80, 0.2)',
            borderRadius: '6px'
          }}>
            Code: {lobby.code}
          </span>
          <button 
            onClick={handleLeaveLobby} 
            style={{ 
              padding: '8px 16px',
              backgroundColor: '#f44336',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Leave Lobby
          </button>
        </div>
      </div>

      {/* Main Content Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px', marginBottom: '30px' }}>
        {/* Players Section */}
        <div style={{ 
          padding: '20px', 
          backgroundColor: '#f8f9fa', 
          borderRadius: '8px',
          border: '1px solid #e9ecef'
        }}>
          <h2 style={{ marginTop: 0, color: '#495057' }}>
            Players ({players.length}/{lobby.maxPlayers})
          </h2>
          <PlayerList players={players} currentPlayerId={playerId} />
        </div>

        {/* Game Settings Section */}
        <div style={{ 
          padding: '20px', 
          backgroundColor: '#f8f9fa', 
          borderRadius: '8px',
          border: '1px solid #e9ecef'
        }}>
          <h2 style={{ marginTop: 0, color: '#495057' }}>Game Settings</h2>
          <GameSettings 
            settings={gameSettings}
            onUpdateSettings={handleUpdateSettings}
            isHost={isHost}
          />
        </div>
      </div>

      {/* NEW: Minigames Preview Section */}
      <div style={{ 
        padding: '20px', 
        backgroundColor: '#e8f5e8', 
        borderRadius: '8px',
        border: '1px solid #4CAF50',
        marginBottom: '30px'
      }}>
        <h2 style={{ marginTop: 0, color: '#2e7d32' }}>
          🎮 Available Minigames
        </h2>
        <p style={{ color: '#1b5e20', marginBottom: '20px' }}>
          During the game, the host can start optional minigames that award bonus lives and other advantages!
        </p>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '15px' }}>
          {/* Reflex Click Preview */}
          <div style={{ 
            padding: '15px', 
            backgroundColor: 'white', 
            borderRadius: '6px',
            border: '1px solid #c8e6c9'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
              <span style={{ fontSize: '24px', marginRight: '10px' }}>⚡</span>
              <h3 style={{ margin: 0, color: '#2e7d32' }}>Reflex Click</h3>
            </div>
            <p style={{ margin: '0 0 10px 0', fontSize: '14px', color: '#388e3c' }}>
              Be the first to click when the button turns green! Winner gets a bonus life.
            </p>
            <div style={{ fontSize: '12px', color: '#689f38' }}>
              • Random 1-5 second delay
              • First player to click wins
              • Don't click too early!
            </div>
          </div>

          {/* Future Minigames Preview */}
          <div style={{ 
            padding: '15px', 
            backgroundColor: '#f5f5f5', 
            borderRadius: '6px',
            border: '1px solid #ddd',
            opacity: 0.7
          }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
              <span style={{ fontSize: '24px', marginRight: '10px' }}>🎯</span>
              <h3 style={{ margin: 0, color: '#666' }}>More Coming Soon!</h3>
            </div>
            <p style={{ margin: '0 0 10px 0', fontSize: '14px', color: '#777' }}>
              Memory games, trivia challenges, and more exciting minigames are in development.
            </p>
            <div style={{ fontSize: '12px', color: '#999' }}>
              • Memory Match
              • Quick Math
              • Color Sequence
            </div>
          </div>
        </div>
      </div>

      {/* Start Game Section */}
      {isHost && (
        <div style={{ 
          textAlign: 'center',
          padding: '20px',
          backgroundColor: players.length >= 2 ? '#e8f5e8' : '#ffebee',
          borderRadius: '8px',
          border: `2px solid ${players.length >= 2 ? '#4CAF50' : '#f44336'}`
        }}>
          <button 
            onClick={handleStartGame}
            disabled={players.length < 2}
            style={{ 
              padding: '15px 30px', 
              fontSize: '18px',
              fontWeight: 'bold',
              backgroundColor: players.length >= 2 ? '#4CAF50' : '#ccc',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: players.length >= 2 ? 'pointer' : 'not-allowed',
              transition: 'all 0.3s ease',
              boxShadow: players.length >= 2 ? '0 4px 8px rgba(76, 175, 80, 0.3)' : 'none'
            }}
          >
            {players.length >= 2 ? '🚀 Start Game!' : '⏳ Need More Players'}
          </button>
          
          <p style={{ 
            marginTop: '10px', 
            color: players.length >= 2 ? '#2e7d32' : '#d32f2f',
            fontWeight: '500'
          }}>
            {players.length < 2 
              ? `Need at least 2 players to start (${players.length}/2)` 
              : `Ready to start with ${players.length} players!`
            }
          </p>
          
          {players.length >= 2 && (
            <p style={{ 
              margin: '10px 0 0 0', 
              fontSize: '14px', 
              color: '#388e3c',
              fontStyle: 'italic'
            }}>
              💡 Tip: You can start minigames during rounds to mix things up!
            </p>
          )}
        </div>
      )}

      {!isHost && (
        <div style={{ 
          textAlign: 'center',
          padding: '20px',
          backgroundColor: '#f3e5f5',
          borderRadius: '8px',
          border: '2px solid #9c27b0'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '10px' }}>⏳</div>
          <h3 style={{ margin: '0 0 10px 0', color: '#7b1fa2' }}>
            Waiting for Host
          </h3>
          <p style={{ margin: 0, color: '#4a148c' }}>
            The host will start the game when ready...
          </p>
          {players.length < 2 && (
            <p style={{ 
              marginTop: '10px', 
              fontSize: '14px', 
              color: '#6a1b9a',
              fontStyle: 'italic'
            }}>
              Still need {2 - players.length} more player{2 - players.length !== 1 ? 's' : ''} to start
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default LobbyScreen;