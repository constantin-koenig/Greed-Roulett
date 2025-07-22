import React, { useState, useEffect } from 'react';
import PlayerBoard from './PlayerBoard';
import DeathWheel from './DeathWheel';
import RoundStatus from './RoundStatus';

const GameScreen = ({ socket, lobby, playerId, currentRound, onBackToMenu }) => {
  const [players, setPlayers] = useState(lobby?.players || []);
  const [gameState, setGameState] = useState(lobby?.gameState || 'InProgress');
  const [needsToSpin, setNeedsToSpin] = useState(false);
  const [spinResults, setSpinResults] = useState([]);
  const [roundPhase, setRoundPhase] = useState('preparation'); // 'preparation', 'minigame', 'spinning', 'results'

  const currentPlayer = players.find(p => p._id === playerId);

  useEffect(() => {
    if (!socket) return;

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

    return () => {
      socket.off('playerX2Updated');
      socket.off('spinResult');
      socket.off('roundEnd');
      socket.off('gameEnded');
    };
  }, [socket, playerId]);

  const handleActivateX2 = () => {
    socket.emit('activateX2');
  };

  const handlePlayerSpin = () => {
    socket.emit('playerSpin');
  };

  const getWheelState = () => {
    return lobby?.deathWheel || { redFields: 1, greenFields: 4, bonusFields: 0 };
  };

  const getPlayerNeedingToSpin = () => {
    // Logic to determine who needs to spin based on round losers
    // For now, simplified to check if current player is alive and needs to spin
    return currentPlayer?.isAlive && needsToSpin;
  };

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1>🎰 Greed Roulette - Round {lobby?.currentRound}</h1>
        <button onClick={onBackToMenu} style={{ padding: '8px 16px' }}>
          Leave Game
        </button>
      </div>

      <RoundStatus 
        lobby={lobby}
        currentRound={currentRound}
        roundPhase={roundPhase}
        players={players}
      />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px', marginTop: '20px' }}>
        <div>
          <h2>Players</h2>
          <PlayerBoard 
            players={players}
            currentPlayerId={playerId}
            onActivateX2={handleActivateX2}
            x2Allowed={lobby?.gameSettings?.x2RiskAllowed}
          />
        </div>

        <div>
          <DeathWheel 
            wheelState={getWheelState()}
            onSpin={handlePlayerSpin}
            canSpin={getPlayerNeedingToSpin()}
            playerName={currentPlayer?.name}
          />
        </div>
      </div>

      {spinResults.length > 0 && (
        <div style={{ marginTop: '30px' }}>
          <h3>Recent Spins</h3>
          <div style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid #ddd', padding: '10px' }}>
            {spinResults.slice(-10).map((result, index) => {
              const player = players.find(p => p._id === result.playerId);
              return (
                <div key={index} style={{ padding: '5px 0', borderBottom: '1px solid #eee' }}>
                  <strong>{player?.name}</strong> spun: 
                  <span style={{ 
                    color: result.result === 'death' ? '#f44336' : 
                          result.result === 'bonus' ? '#ff9800' : '#4caf50',
                    marginLeft: '8px'
                  }}>
                    {result.result === 'death' ? '💀 Death' : 
                     result.result === 'bonus' ? '❤️ Bonus Life' : '✅ Safe'}
                  </span>
                  {result.livesLost > 0 && (
                    <span style={{ color: '#f44336', marginLeft: '8px' }}>
                      (-{result.livesLost} ❤️)
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

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
          justifyContent: 'center' 
        }}>
          <div style={{ 
            backgroundColor: 'white', 
            padding: '40px', 
            borderRadius: '8px', 
            textAlign: 'center' 
          }}>
            <h2>🏆 Game Over!</h2>
            <p>Thanks for playing Greed Roulette!</p>
            <button onClick={onBackToMenu} style={{ padding: '12px 24px', marginTop: '20px' }}>
              Back to Menu
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default GameScreen;