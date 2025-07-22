// client/src/components/Game/GameScreen.jsx - Updated without permanent death wheel
import React, { useState, useEffect } from 'react';
import GameHeader from './GameHeader';
import PhaseIndicators from './PhaseIndicators';
import PlayersSection from './PlayersSection';
import SpinResults from './SpinResults';
import MinigameScoreboard from './MinigameScoreboard';
import DeathWheelModal from './DeathWheelModal';
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
  
  // Death Wheel state
  const [showDeathWheel, setShowDeathWheel] = useState(false);
  const [currentSpinner, setCurrentSpinner] = useState(null);
  const [spinQueue, setSpinQueue] = useState([]);
  const [recentSpinResults, setRecentSpinResults] = useState([]);
  
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

    // NEW: Listen for spin start events
    socket.on('spinStarted', (data) => {
      console.log('Spin started:', data);
      // The animation will be handled in the DeathWheelModal
      // We could show a toast notification here if desired
    });

    socket.on('spinResult', (data) => {
      setRecentSpinResults(prev => [...prev, data]);
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

      // Move to next spinner or close wheel
      setTimeout(() => {
        const remainingQueue = spinQueue.filter(p => p._id !== data.playerId);
        setSpinQueue(remainingQueue);
        
        if (remainingQueue.length > 0) {
          setCurrentSpinner(remainingQueue[0]);
        } else {
          // All spins complete
          setShowDeathWheel(false);
          setCurrentSpinner(null);
          setRoundPhase('results');
          setRecentSpinResults([]);
        }
      }, 3000);
    });

    // NEW: Listen for next spinner events
    socket.on('nextSpinner', (data) => {
      console.log('Next spinner:', data);
      const nextPlayer = safePlayers.find(p => p._id === data.currentSpinner);
      if (nextPlayer) {
        setCurrentSpinner(nextPlayer);
      }
    });

    // NEW: Listen for death wheel completion
    socket.on('deathWheelComplete', (data) => {
      console.log('Death wheel complete:', data);
      setTimeout(() => {
        setShowDeathWheel(false);
        setCurrentSpinner(null);
        setSpinQueue([]);
        setRecentSpinResults([]);
        setRoundPhase('results');
      }, 2000);
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
      
      // Update player lives for winner
      if (data.type === 'reflexClick' && data.winnerId) {
        setPlayers(prevPlayers => 
          Array.isArray(prevPlayers) ? prevPlayers.map(p => 
            p && p._id === data.winnerId 
              ? { ...p, lives: (p.lives || 0) + 1 }
              : p
          ) : []
        );
      }

      // Prepare scoreboard data
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

    // NEW: Death wheel phase listener
    socket.on('deathWheelPhase', (data) => {
      console.log('Death wheel phase started:', data);
      
      // Determine who needs to spin (losers from minigame)
      const losers = data.losers || [];
      const loserPlayers = safePlayers.filter(p => losers.includes(p._id) && p.isAlive);
      
      if (loserPlayers.length > 0) {
        setSpinQueue(loserPlayers);
        setCurrentSpinner(loserPlayers[0]);
        setShowDeathWheel(true);
        setRoundPhase('spinning');
      }
    });

    socket.on('playerReady', (data) => {
      console.log('Player ready:', data);
    });

    return () => {
      socket.off('playerX2Updated');
      socket.off('spinStarted');
      socket.off('spinResult');
      socket.off('nextSpinner');
      socket.off('deathWheelComplete');
      socket.off('roundEnd');
      socket.off('gameEnded');
      socket.off('minigameStarted');
      socket.off('minigameResult');
      socket.off('deathWheelPhase');
      socket.off('playerReady');
    };
  }, [socket, playerId, safePlayers, spinQueue]);

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
    
    // Start death wheel for all alive players
    const alivePlayersList = alivePlayers.filter(p => p.isAlive);
    if (alivePlayersList.length > 0) {
      setSpinQueue(alivePlayersList);
      setCurrentSpinner(alivePlayersList[0]);
      setShowDeathWheel(true);
      setRoundPhase('spinning');
    }
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
    
    // After scoreboard, start death wheel for losers
    // This would be triggered by the server sending 'deathWheelPhase' event
    // For now, we'll simulate it:
    if (scoreboardData && scoreboardData.type === 'reflexClick') {
      const nonWinners = safePlayers.filter(p => 
        p.isAlive && p._id !== scoreboardData.winnerId
      );
      
      if (nonWinners.length > 0) {
        setTimeout(() => {
          setSpinQueue(nonWinners);
          setCurrentSpinner(nonWinners[0]);
          setShowDeathWheel(true);
          setRoundPhase('spinning');
        }, 500);
      } else {
        setRoundPhase('results');
      }
    }
  };

  const handleDeathWheelClose = () => {
    setShowDeathWheel(false);
    setCurrentSpinner(null);
    setSpinQueue([]);
    setRecentSpinResults([]);
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
      <RoundStatus 
        lobby={safeLobby}
        currentRound={safeLobby.currentRound}
        roundPhase={roundPhase}
        players={safePlayers}
      />

      {/* Phase Indicators */}
      <PhaseIndicators roundPhase={roundPhase} isHost={isHost} />

      {/* Main Game Area - Only Players, no permanent death wheel */}
      <div style={{ marginBottom: '20px' }}>
        <PlayersSection
          alivePlayers={alivePlayers}
          deadPlayers={deadPlayers}
          playerId={playerId}
          currentRound={safeLobby.currentRound}
          onActivateX2={handleActivateX2}
        />
      </div>

      {/* Game Actions Panel - Only for preparation phase */}
      {roundPhase === 'preparation' && isHost && (
        <div style={{
          padding: '20px',
          backgroundColor: '#fff3e0',
          border: '2px solid #ff9800',
          borderRadius: '8px',
          textAlign: 'center',
          marginBottom: '20px'
        }}>
          <h3 style={{ margin: '0 0 15px 0', color: '#ef6c00' }}>
            🎮 Host Controls - Choose Your Path
          </h3>
          <div style={{ display: 'flex', gap: '15px', justifyContent: 'center' }}>
            <button
              onClick={startReflexGame}
              style={{
                padding: '15px 25px',
                backgroundColor: '#4CAF50',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: 'bold',
                cursor: 'pointer',
                boxShadow: '0 4px 8px rgba(76, 175, 80, 0.3)'
              }}
            >
              🎯 Start Reflex Minigame
            </button>
            <button
              onClick={skipToSpinning}
              style={{
                padding: '15px 25px',
                backgroundColor: '#f44336',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: 'bold',
                cursor: 'pointer',
                boxShadow: '0 4px 8px rgba(244, 67, 54, 0.3)'
              }}
            >
              💀 Skip to Death Wheel
            </button>
          </div>
          <p style={{ 
            margin: '15px 0 0 0', 
            color: '#bf360c',
            fontSize: '14px',
            fontStyle: 'italic'
          }}>
            Minigames award bonus lives to winners, but losers must face the death wheel!
          </p>
        </div>
      )}

      {/* Ready for Next Round Button */}
      {roundPhase === 'results' && currentPlayer?.isAlive && (
        <div style={{ 
          textAlign: 'center',
          padding: '20px',
          backgroundColor: '#e3f2fd',
          border: '2px solid #2196f3',
          borderRadius: '8px',
          marginBottom: '20px'
        }}>
          <h3 style={{ margin: '0 0 15px 0', color: '#1976d2' }}>
            ✅ Round Complete
          </h3>
          <button
            onClick={handleReadyNextRound}
            style={{
              padding: '15px 30px',
              backgroundColor: '#2196F3',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '18px',
              fontWeight: 'bold',
              boxShadow: '0 4px 8px rgba(33, 150, 243, 0.3)'
            }}
          >
            🚀 Ready for Next Round
          </button>
          <p style={{ 
            margin: '10px 0 0 0', 
            color: '#1976d2',
            fontSize: '14px'
          }}>
            Wait for all players to be ready...
          </p>
        </div>
      )}

      {/* Eliminated Player Message */}
      {!currentPlayer?.isAlive && (
        <div style={{ 
          textAlign: 'center',
          padding: '20px',
          backgroundColor: '#ffebee',
          border: '2px solid #f44336',
          borderRadius: '8px',
          marginBottom: '20px'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '10px' }}>💀</div>
          <h3 style={{ margin: '0 0 10px 0', color: '#d32f2f' }}>
            You have been eliminated!
          </h3>
          <p style={{ margin: 0, color: '#c62828', fontSize: '16px' }}>
            Continue watching as the remaining players battle for survival!
          </p>
        </div>
      )}

      {/* Spin Results History */}
      <SpinResults spinResults={spinResults} players={safePlayers} />

      {/* Death Wheel Modal - Only shown when needed */}
      <DeathWheelModal
        isVisible={showDeathWheel}
        deathWheelState={safeLobby.deathWheel}
        currentSpinner={currentSpinner}
        isMyTurn={currentSpinner?._id === playerId}
        spinResults={recentSpinResults}
        onSpin={handleSpin}
        onClose={handleDeathWheelClose}
      />

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