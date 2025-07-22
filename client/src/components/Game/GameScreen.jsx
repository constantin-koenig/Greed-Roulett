// client/src/components/Game/GameScreen.jsx - Complete functional version
import React, { useState, useEffect } from 'react';
import PlayerBoard from './PlayerBoard';
import DeathWheel from './DeathWheel';
import RoundStatus from './RoundStatus';
import ReflexClickGame from './ReflexClickGame';

const GameScreen = ({ socket, lobby, playerId, currentRound, onBackToMenu }) => {
  const [players, setPlayers] = useState(lobby?.players || []);
  const [gameState, setGameState] = useState(lobby?.gameState || 'InProgress');
  const [needsToSpin, setNeedsToSpin] = useState(false);
  const [spinResults, setSpinResults] = useState([]);
  const [roundPhase, setRoundPhase] = useState('preparation');
  const [currentMinigame, setCurrentMinigame] = useState(null);

  const [showLeaveModal, setShowLeaveModal] = useState(false);

  // Robust null checks
  const safePlayers = Array.isArray(players) ? players : [];
  const currentPlayer = safePlayers.find(p => p && p._id === playerId);
  const isHost = currentPlayer?.isHost || false;

  // Safe lobby data with defaults
  const safeLobby = lobby || {
    name: 'Unknown Lobby',
    code: 'XXXXXX',
    currentRound: 1,
    gameSettings: {},
    deathWheel: { redFields: 1, greenFields: 4, bonusFields: 0 }
  };

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
      
      // Update player stats
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

      // Check if current player needs to spin
      if (data.playerId === playerId) {
        setNeedsToSpin(false);
      }
    });

    socket.on('roundEnd', (data) => {
      setRoundPhase('results');
      // Handle round end logic
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
      // Handle minigame results - award bonus life to winner
      if (data.type === 'reflexClick' && data.winnerId) {
        setPlayers(prevPlayers => 
          Array.isArray(prevPlayers) ? prevPlayers.map(p => 
            p && p._id === data.winnerId 
              ? { ...p, lives: (p.lives || 0) + 1 }
              : p
          ) : []
        );
        
        // Show notification
        if (data.winnerId === playerId) {
          setTimeout(() => {
            alert('🎉 You won the reflex challenge! +1 Life!');
          }, 100);
        }
      }
    });

    // Player readiness
    socket.on('playerReady', (data) => {
      console.log('Player ready:', data);
    });

    return () => {
      // Cleanup all listeners
      socket.off('playerX2Updated');
      socket.off('spinResult');
      socket.off('roundEnd');
      socket.off('gameEnded');
      socket.off('minigameStarted');
      socket.off('minigameResult');
      socket.off('playerReady');
    };
  }, [socket, playerId]);

  // Start Reflex Click minigame (host only)
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

  // Skip minigame and go directly to spinning phase
  const skipToSpinning = () => {
    if (!isHost) {
      alert('Only the host can control game phases!');
      return;
    }
    setRoundPhase('spinning');
  };

  // Handle minigame end
  const handleMinigameEnd = (result) => {
    console.log('Minigame ended:', result);
    setCurrentMinigame(null);
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

  const handleReadyNextRound = () => {
    socket.emit('readyNextRound');
  };

  // Render minigame if active
  if (currentMinigame === 'reflexClick') {
    return (
      <div style={{ padding: '20px', minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
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
            <h2 style={{ margin: 0, color: '#4CAF50' }}>Round {safeLobby.currentRound} - Reflex Challenge</h2>
            <p style={{ margin: '5px 0 0 0', opacity: 0.8 }}>
              Get ready for the ultimate reflex test!
            </p>
          </div>
          <button 
            onClick={handleBackToLobby} 
            style={{ 
              padding: '8px 16px',
              backgroundColor: '#f44336',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Leave Game
          </button>
        </div>

        <ReflexClickGame
          socket={socket}
          roomId={safeLobby.code}
          playerId={playerId}
          onGameEnd={handleMinigameEnd}
        />
        
        {/* Debug Info */}
        <div style={{ 
          position: 'fixed', 
          top: '10px', 
          right: '10px', 
          backgroundColor: 'rgba(0,0,0,0.8)', 
          color: 'white', 
          padding: '10px', 
          borderRadius: '5px',
          fontSize: '12px',
          zIndex: 1000
        }}>
          <div>Room: {safeLobby.code}</div>
          <div>Player: {playerId}</div>
          <div>Socket: {socket ? 'Connected' : 'Disconnected'}</div>
        </div>
      </div>
    );
  }

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

  const alivePlayers = safePlayers.filter(p => p && p.isAlive);
  const deadPlayers = safePlayers.filter(p => p && !p.isAlive);

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto', minHeight: '100vh' }}>
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
            Lobby: {safeLobby.name} | Round {safeLobby.currentRound}
          </p>
          <p style={{ margin: '2px 0 0 0', fontSize: '14px', opacity: 0.7 }}>
            Alive: {alivePlayers.length} | Dead: {deadPlayers.length}
          </p>
        </div>
        
        {/* Game Controls */}
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          {isHost && roundPhase === 'preparation' && (
            <>
              <button 
                onClick={startReflexGame}
                style={{
                  padding: '10px 15px',
                  backgroundColor: '#4CAF50',
                  color: 'white',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                🎯 Start Reflex Game
              </button>
              <button 
                onClick={skipToSpinning}
                style={{
                  padding: '10px 15px',
                  backgroundColor: '#ff9800',
                  color: 'white',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                ⚡ Skip to Wheel
              </button>
            </>
          )}
          
          <button 
            onClick={handleBackToLobby} 
            style={{ 
              padding: '10px 15px',
              backgroundColor: '#f44336',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Leave Game
          </button>
        </div>
      </div>

      {/* Round Status */}
      {RoundStatus && (
        <RoundStatus 
          roundPhase={roundPhase}
          currentRound={safeLobby.currentRound}
          players={safePlayers}
        />
      )}

      {/* Phase-specific Messages */}
      {roundPhase === 'preparation' && isHost && (
        <div style={{
          padding: '15px',
          backgroundColor: '#fff3e0',
          border: '2px solid #ff9800',
          borderRadius: '8px',
          textAlign: 'center',
          marginBottom: '20px'
        }}>
          <h3 style={{ margin: '0 0 10px 0', color: '#ef6c00' }}>
            🎯 Round Preparation - Host Controls
          </h3>
          <p style={{ margin: '0 0 10px 0', color: '#e65100' }}>
            Start a minigame to award bonus lives, or skip directly to the death wheel!
          </p>
          <p style={{ margin: 0, fontSize: '14px', color: '#bf360c' }}>
            Minigames can change the course of the game - use them strategically!
          </p>
        </div>
      )}

      {roundPhase === 'preparation' && !isHost && (
        <div style={{
          padding: '15px',
          backgroundColor: '#f3e5f5',
          border: '2px solid #9c27b0',
          borderRadius: '8px',
          textAlign: 'center',
          marginBottom: '20px'
        }}>
          <h3 style={{ margin: '0 0 10px 0', color: '#7b1fa2' }}>
            ⏳ Waiting for Host Decision
          </h3>
          <p style={{ margin: 0, color: '#4a148c' }}>
            The host is deciding whether to start a minigame or proceed to the death wheel...
          </p>
        </div>
      )}

      {roundPhase === 'minigame' && (
        <div style={{
          padding: '15px',
          backgroundColor: '#e8f5e8',
          border: '2px solid #4CAF50',
          borderRadius: '8px',
          textAlign: 'center',
          marginBottom: '20px'
        }}>
          <h3 style={{ margin: '0 0 10px 0', color: '#2e7d32' }}>
            🎮 Minigame in Progress
          </h3>
          <p style={{ margin: 0, color: '#1b5e20' }}>
            Complete the challenge to earn rewards and advantages!
          </p>
        </div>
      )}

      {/* Main Game Area */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px', marginBottom: '20px' }}>
        {/* Players Board */}
        <div>
          <h2 style={{ color: '#333', marginBottom: '15px' }}>
            Players ({players.length})
          </h2>
          
          {/* Alive Players */}
          {alivePlayers.length > 0 && (
            <div style={{ marginBottom: '20px' }}>
              <h3 style={{ color: '#4CAF50', marginBottom: '10px' }}>
                ❤️ Alive ({alivePlayers.length})
              </h3>
              <div style={{ display: 'grid', gap: '10px' }}>
                {alivePlayers.map(player => player && player._id ? (
                  <PlayerBoard 
                    key={player._id}
                    player={player}
                    isCurrentPlayer={player._id === playerId}
                    currentRound={safeLobby.currentRound}
                    onActivateX2={player._id === playerId ? handleActivateX2 : null}
                  />
                ) : null)}
              </div>
            </div>
          )}

          {/* Dead Players */}
          {deadPlayers.length > 0 && (
            <div>
              <h3 style={{ color: '#f44336', marginBottom: '10px' }}>
                💀 Eliminated ({deadPlayers.length})
              </h3>
              <div style={{ display: 'grid', gap: '10px' }}>
                {deadPlayers.map(player => player && player._id ? (
                  <PlayerBoard 
                    key={player._id}
                    player={player}
                    isCurrentPlayer={player._id === playerId}
                    currentRound={safeLobby.currentRound}
                    onActivateX2={null}
                  />
                ) : null)}
              </div>
            </div>
          )}
        </div>

        {/* Death Wheel & Actions */}
        <div>
          <DeathWheel 
            deathWheelState={safeLobby.deathWheel}
            currentPlayer={currentPlayer || null}
          />
          
          {/* Player Actions */}
          {currentPlayer?.isAlive && roundPhase === 'spinning' && (
            <div style={{ marginTop: '20px', textAlign: 'center' }}>
              <h3 style={{ marginBottom: '15px', color: '#333' }}>Your Turn</h3>
              
              {/* Spin Button */}
              <button
                onClick={handleSpin}
                disabled={needsToSpin}
                style={{
                  padding: '20px 30px',
                  fontSize: '20px',
                  fontWeight: 'bold',
                  backgroundColor: needsToSpin ? '#666' : '#4CAF50',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: needsToSpin ? 'not-allowed' : 'pointer',
                  width: '100%',
                  boxShadow: needsToSpin ? 'none' : '0 4px 8px rgba(76, 175, 80, 0.3)',
                  transition: 'all 0.3s ease'
                }}
              >
                {needsToSpin ? '🎰 Spinning...' : '🎰 SPIN THE WHEEL'}
              </button>
              
              <p style={{ 
                marginTop: '10px', 
                fontSize: '14px', 
                color: '#666',
                fontStyle: 'italic'
              }}>
                Lives: {currentPlayer.lives} ❤️ | X2 Risk: {currentPlayer.hasX2Active ? 'ON' : 'OFF'}
              </p>
            </div>
          )}

          {/* Spectator Message */}
          {!currentPlayer?.isAlive && (
            <div style={{ 
              marginTop: '20px', 
              padding: '15px',
              backgroundColor: '#ffebee',
              border: '2px solid #f44336',
              borderRadius: '8px',
              textAlign: 'center'
            }}>
              <h3 style={{ margin: '0 0 10px 0', color: '#d32f2f' }}>
                💀 You are eliminated
              </h3>
              <p style={{ margin: 0, color: '#c62828' }}>
                Watch the remaining players battle it out!
              </p>
            </div>
          )}

          {/* Ready for Next Round */}
          {roundPhase === 'results' && currentPlayer?.isAlive && (
            <div style={{ 
              marginTop: '20px',
              padding: '15px',
              backgroundColor: '#e3f2fd',
              border: '2px solid #2196f3',
              borderRadius: '8px',
              textAlign: 'center'
            }}>
              <h3 style={{ margin: '0 0 15px 0', color: '#1976d2' }}>
                Round Complete
              </h3>
              <button
                onClick={handleReadyNextRound}
                style={{
                  padding: '12px 20px',
                  backgroundColor: '#2196F3',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '16px',
                  width: '100%'
                }}
              >
                ✅ Ready for Next Round
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Spin Results History */}
      {spinResults.length > 0 && (
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
              const player = safePlayers.find(p => p && p._id === result.playerId);
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
      )}

      {/* Leave Game Confirmation Modal */}
      {showLeaveModal && (
        <div style={{ 
          position: 'fixed', 
          top: 0, 
          left: 0, 
          right: 0, 
          bottom: 0, 
          backgroundColor: 'rgba(0,0,0,0.7)', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          zIndex: 1001
        }}>
          <div style={{ 
            backgroundColor: 'white', 
            padding: '30px', 
            borderRadius: '12px', 
            textAlign: 'center',
            minWidth: '350px',
            boxShadow: '0 10px 25px rgba(0,0,0,0.3)'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '15px' }}>⚠️</div>
            <h3 style={{ color: '#1a1a1a', marginBottom: '15px' }}>
              Leave Game?
            </h3>
            <p style={{ fontSize: '16px', color: '#666', marginBottom: '25px' }}>
              Are you sure you want to leave the game? Your progress will be lost.
            </p>
            <div style={{ display: 'flex', gap: '15px', justifyContent: 'center' }}>
              <button 
                onClick={cancelLeave}
                style={{ 
                  padding: '12px 20px', 
                  fontSize: '16px',
                  backgroundColor: '#6c757d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button 
                onClick={confirmLeave}
                style={{ 
                  padding: '12px 20px', 
                  fontSize: '16px',
                  backgroundColor: '#dc3545',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
              >
                Leave Game
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Game Over Modal */}
      {gameState === 'Ended' && (
        <div style={{ 
          position: 'fixed', 
          top: 0, 
          left: 0, 
          right: 0, 
          bottom: 0, 
          backgroundColor: 'rgba(0,0,0,0.8)', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{ 
            backgroundColor: 'white', 
            padding: '40px', 
            borderRadius: '12px', 
            textAlign: 'center',
            minWidth: '400px',
            boxShadow: '0 10px 25px rgba(0,0,0,0.3)'
          }}>
            <div style={{ fontSize: '64px', marginBottom: '20px' }}>🏆</div>
            <h2 style={{ color: '#1a1a1a', marginBottom: '15px' }}>
              Game Over!
            </h2>
            <p style={{ fontSize: '18px', color: '#666', marginBottom: '10px' }}>
              Thanks for playing Greed Roulette!
            </p>
            <p style={{ fontSize: '16px', color: '#888', marginBottom: '30px' }}>
              May the odds be ever in your favor next time!
            </p>
            <button 
              onClick={onBackToMenu} 
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
              🏠 Back to Menu
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default GameScreen;