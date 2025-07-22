import React, { useState, useEffect } from 'react';
import useSocket from './hooks/useSocket';
import LobbyScreen from './components/Lobby/LobbyScreen';
import GameScreen from './components/Game/GameScreen';
import './App.css';

const App = () => {
  const { socket, connected } = useSocket();
  const [gameState, setGameState] = useState('menu'); // 'menu', 'lobby', 'game'
  const [lobby, setLobby] = useState(null);
  const [playerId, setPlayerId] = useState(null);
  const [currentRound, setCurrentRound] = useState(null);
  const [error, setError] = useState('');

  // Form states
  const [playerName, setPlayerName] = useState('');
  const [lobbyName, setLobbyName] = useState('');
  const [lobbyCode, setLobbyCode] = useState('');

  useEffect(() => {
    if (!socket) return;

    // Socket event listeners
    socket.on('lobbyCreated', (data) => {
      setLobby(data.lobby);
      setPlayerId(data.playerId);
      setGameState('lobby');
      setError('');
    });

    socket.on('lobbyJoined', (data) => {
      setLobby(data.lobby);
      setPlayerId(data.playerId);
      setGameState('lobby');
      setError('');
    });

    socket.on('gameStarted', (data) => {
      setLobby(data.lobby);
      setCurrentRound(data.currentRound);
      setGameState('game');
    });

    socket.on('error', (data) => {
      setError(data.message);
    });

    return () => {
      socket.off('lobbyCreated');
      socket.off('lobbyJoined');
      socket.off('gameStarted');
      socket.off('error');
    };
  }, [socket]);

  const handleCreateLobby = (e) => {
    e.preventDefault();
    if (!playerName.trim() || !lobbyName.trim()) {
      setError('Please fill in all fields');
      return;
    }

    socket.emit('createLobby', {
      playerName: playerName.trim(),
      lobbyName: lobbyName.trim(),
      gameSettings: {
        gameMode: 'LastManStanding',
        maxRounds: 10,
        startLives: 5,
        gamblingAllowed: true,
        x2RiskAllowed: true
      }
    });
  };

  const handleJoinLobby = (e) => {
    e.preventDefault();
    if (!playerName.trim() || !lobbyCode.trim()) {
      setError('Please fill in all fields');
      return;
    }

    socket.emit('joinLobby', {
      playerName: playerName.trim(),
      lobbyCode: lobbyCode.trim().toUpperCase()
    });
  };

  const handleStartGame = (data) => {
    setLobby(data.lobby);
    setCurrentRound(data.currentRound);
    setGameState('game');
  };

  const handleBackToMenu = () => {
    socket.emit('leaveLobby');
    setGameState('menu');
    setLobby(null);
    setPlayerId(null);
    setCurrentRound(null);
    setError('');
  };

  if (!connected) {
    return (
      <div className="app">
        <div className="connecting">
          <h2>Connecting to server...</h2>
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      {gameState === 'menu' && (
        <div className="menu">
          <h1>🎰 Greed Roulette</h1>
          <p>A thrilling multiplayer survival game!</p>

          {error && (
            <div className="error">
              {error}
            </div>
          )}

          <div className="menu-forms">
            <div className="form-section">
              <h2>Create Lobby</h2>
              <form onSubmit={handleCreateLobby}>
                <input
                  type="text"
                  placeholder="Your name"
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  maxLength={20}
                />
                <input
                  type="text"
                  placeholder="Lobby name"
                  value={lobbyName}
                  onChange={(e) => setLobbyName(e.target.value)}
                  maxLength={30}
                />
                <button type="submit">Create Lobby</button>
              </form>
            </div>

            <div className="form-section">
              <h2>Join Lobby</h2>
              <form onSubmit={handleJoinLobby}>
                <input
                  type="text"
                  placeholder="Your name"
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  maxLength={20}
                />
                <input
                  type="text"
                  placeholder="Lobby code"
                  value={lobbyCode}
                  onChange={(e) => setLobbyCode(e.target.value.toUpperCase())}
                  maxLength={6}
                />
                <button type="submit">Join Lobby</button>
              </form>
            </div>
          </div>
        </div>
      )}

      {gameState === 'lobby' && (
        <LobbyScreen 
          socket={socket}
          lobby={lobby}
          playerId={playerId}
          onStartGame={handleStartGame}
          onBackToMenu={handleBackToMenu}
        />
      )}

      {gameState === 'game' && (
        <GameScreen 
          socket={socket}
          lobby={lobby}
          playerId={playerId}
          currentRound={currentRound}
          onBackToMenu={handleBackToMenu}
        />
      )}
    </div>
  );
};

export default App;