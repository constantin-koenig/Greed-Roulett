// client/src/components/Game/GameScreen.jsx - Refactored modular version
import React, { useState, useEffect } from 'react';
import GameHeader from './GameHeader';
import PhaseIndicators from './PhaseIndicators';
import PlayersSection from './PlayersSection';
import ActionPanel from './ActionPanel';
import SpinResults from './SpinResults';
import MinigameScoreboard from './MinigameScoreboard';
import GameModals from './GameModals';
import ReflexClickGame from './ReflexClickGame';
import RoundStatus from './RoundStatus';

const GameScreen = ({ socket, lobby, playerId, currentRound, onBackToMenu }) => {
  // Core game state
  const [players, setPlayers] = useState(lobby?.players || []);
  const [gameState, setGameState] = useState(lobby?.gameState || 'InProgress');
  const [needsToSpin, setNeedsToSpin] = useState(false);
  const [spinResults, setSpinResults] = useState([]);
  const [roundPhase, setRoundPhase] = useState('preparation');
  
  // Minigame state
  const [currentMinigame, setCurrentMinigame] = useState(null);
  const [showScoreboard, setShowScoreboard] = useState(false);
  const [scoreboardData, setScoreboardData] = useState(null);
  
  // UI state
  const [showLeaveModal, setShowLeaveModal] = useState(false);

  // Safe data with defaults
  const safePlayers = Array.isArray(players) ? players : [];
  const currentPlayer = safePlayers.find(p => p && p._id === playerId);
  const isHost = currentPlayer?.isHost || false;
  const safeLobby = lobby || {
    name: 'Unknown Lobby',
    code: 'XXXXXX',
    currentRound: 1,
    gameSettings: {},
    deathWheel: { redFields: 1, greenFields: 4, bonusFields: 0 }
  };

  const alivePlayers = safePlayers.filter(p => p && p.isAlive);
  const deadPlayers = safePlayers.filter(p => p && !p.isAlive);

  // Socket event handlers
  useEffect(() => {
    if (!socket) return;

    // Existing socket listeners
    socket.on('playerX2Updated', (data) => {
      setPlayers(prevPlayers => 
        prevPlayers.map(p => 
          p._id === data.playerId 
            ? { ...p, hasX2Active: data.hasX2Active }
            : p
        )
      );
    });

    socket.on('spinResult', (data) => {
      setSpinResults(prev => [...prev, data]);
      
      setPlayers(prevPlayers => 
        prevPlayers.map(p => 
          p._id === data.playerId 
            ? { 
                ...p, 
                lives: data.newLives, 
                isAlive: data.isAlive,
                hasX2Active: false 
              }
            : p
        )
      );

      if (data.playerId === playerId) {
        setNeedsToSpin(false);
      }
    });

    socket.on('roundEnd', (data) => {
      setRoundPhase('results');
    });

    socket.on('gameEnded', (data) => {
      setGameState('Ended');
      alert(`Game Over! Winner: ${data.winner?.name || 'No one'}`);
    });

    // Minigame socket listeners
    socket.on('minigameStarted', (data) => {
      console.log('Minigame started:', data);
      if (data.type === 'reflexClick') {
        setCurrentMinigame('reflexClick');
        setRoundPhase('minigame');
      }
    });

    socket.on('minigameResult', (data) => {
      console.log('Minigame result:', data);
      
      if (data.type === 'reflexClick' && data.winnerId) {
        setPlayers(prevPlayers => 
          Array.isArray(prevPlayers) ? prevPlayers.map(p => 
            p && p._id === data.winnerId 
              ? { ...p, lives: (p.lives || 0) + 1 }
              : p
          ) : []
        );
      }

      setScoreboardData({
        type: data.type,
        winnerId: data.winnerId,
        playerResults: data.playerResults,
        roundWinners: data.roundWinners,
        message: data.message,
        players: safePlayers.map(player => ({
          ...player,
          lives: player._id === data.winnerId ? (player.lives || 0) + 1 : (player.lives || 0),
          minigameResult: data.playerResults?.[player._id] || null
        }))
      });

      setShowScoreboard(true);
    });

    socket.on('playerReady', (data) => {
      console.log('Player ready:', data);
    });

    return () => {
      socket.off('playerX2Updated');
      socket.off('spinResult');
      socket.off('roundEnd');
      socket.off('gameEnded');
      socket.off('minigameStarted');
      socket.off('minigameResult');
      socket.off('playerReady');
    };
  }, [socket, playerId, safePlayers]);

  // Game action handlers
  const startReflexGame = () => {
    if (!isHost) {
      alert('Only the host can start minigames!');
      return;
    }
    socket.emit('startMinigame', {
      roomId: safeLobby.code,
      type: 'reflexClick'
    });
  };

  const skipToSpinning = () => {
    if (!isHost) {
      alert('Only the host can control game phases!');
      return;
    }
    setRoundPhase('spinning');
  };

  const handleActivateX2 = () => {
    if (!currentPlayer?.isAlive) {
      alert('Only alive players can activate X2!');
      return;
    }
    socket.emit('activateX2');
  };

  const handleSpin = () => {
    if (!currentPlayer?.isAlive) {
      alert('Only alive players can spin!');
      return;
    }
    if (needsToSpin) {
      alert('Please wait for the current spin to complete!');
      return;
    }
    
    setNeedsToSpin(true);
    socket.emit('playerSpin');
  };

  const handleReadyNextRound = () => {
    socket.emit('readyNextRound');
  };

  // Modal handlers
  const handleBackToLobby = () => {
    setShowLeaveModal(true);
  };

  const confirmLeave = () => {
    socket.emit('leaveLobby');
    onBackToMenu();
    setShowLeaveModal(false);
  };

  const cancelLeave = () => {
    setShowLeaveModal(false);
  };

  const handleMinigameEnd = (result) => {
    console.log('Minigame ended:', result);
    setCurrentMinigame(null);
  };

  const handleScoreboardClose = () => {
    setShowScoreboard(false);
    setScoreboardData(null);
    setRoundPhase('spinning');
  };

  // Render minigame if active
  if (currentMinigame === 'reflexClick') {
    return (
      <div style={{ padding: '20px', minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
        <GameHeader
          lobby={safeLobby}
          alivePlayers={alivePlayers}
          deadPlayers={deadPlayers}
          isHost={isHost}
          roundPhase="minigame"
          onBackToLobby={handleBackToLobby}
        />

        <ReflexClickGame
          socket={socket}
          roomId={safeLobby.code}
          playerId={playerId}
          onGameEnd={handleMinigameEnd}
        />
        
        <GameModals
          showLeaveModal={showLeaveModal}
          onConfirmLeave={confirmLeave}
          onCancelLeave={cancelLeave}
          gameState={gameState}
          onBackToMenu={onBackToMenu}
        />
      </div>
    );
  }

  // Loading state
  if (!safeLobby || !socket) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <h2>Loading game...</h2>
        <p>Please wait while the game data loads.</p>
        <button onClick={onBackToMenu} style={{ marginTop: '20px', padding: '10px 20px' }}>
          Back to Menu
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto', minHeight: '100vh' }}>
      {/* Header */}
      <GameHeader
        lobby={safeLobby}
        alivePlayers={alivePlayers}
        deadPlayers={deadPlayers}
        isHost={isHost}
        roundPhase={roundPhase}
        onStartReflexGame={startReflexGame}
        onSkipToSpinning={skipToSpinning}
        onBackToLobby={handleBackToLobby}
      />

      {/* Round Status */}
      {RoundStatus && (
        <RoundStatus 
          roundPhase={roundPhase}
          currentRound={safeLobby.currentRound}
          players={safePlayers}
        />
      )}

      {/* Phase Indicators */}
      <PhaseIndicators roundPhase={roundPhase} isHost={isHost} />

      {/* Main Game Area */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px', marginBottom: '20px' }}>
        {/* Players Section */}
        <PlayersSection
          alivePlayers={alivePlayers}
          deadPlayers={deadPlayers}
          playerId={playerId}
          currentRound={safeLobby.currentRound}
          onActivateX2={handleActivateX2}
        />

        {/* Action Panel */}
        <ActionPanel
          deathWheelState={safeLobby.deathWheel}
          currentPlayer={currentPlayer}
          roundPhase={roundPhase}
          needsToSpin={needsToSpin}
          onSpin={handleSpin}
          onReadyNextRound={handleReadyNextRound}
        />
      </div>

      {/* Spin Results */}
      <SpinResults spinResults={spinResults} players={safePlayers} />

      {/* Minigame Scoreboard */}
      {showScoreboard && (
        <MinigameScoreboard
          scoreboardData={scoreboardData}
          playerId={playerId}
          onClose={handleScoreboardClose}
        />
      )}

      {/* Game Modals */}
      <GameModals
        showLeaveModal={showLeaveModal}
        onConfirmLeave={confirmLeave}
        onCancelLeave={cancelLeave}
        gameState={gameState}
        onBackToMenu={onBackToMenu}
      />
    </div>
  );
};

export default GameScreen;