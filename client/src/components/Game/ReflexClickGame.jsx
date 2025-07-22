// client/src/components/Game/ReflexClickGame.jsx
// Integrated Reflex Click Minigame for Greed Roulette
import React, { useState, useEffect, useCallback } from 'react';

const ReflexClickGame = ({ socket, roomId, playerId, onGameEnd }) => {
  const [gameState, setGameState] = useState('waiting'); // 'waiting', 'countdown', 'active', 'finished'
  const [message, setMessage] = useState('Waiting for game to start...');
  const [canClick, setCanClick] = useState(false);
  const [hasClicked, setHasClicked] = useState(false);
  const [result, setResult] = useState(null);
  const [startTime, setStartTime] = useState(null);
  const [clickTime, setClickTime] = useState(null);

  // Game start handler
  const handleGameStart = useCallback((data) => {
    console.log('Minigame started:', data);
    setGameState('countdown');
    setMessage(data.message || 'Get ready! Click when the button becomes active!');
    setCanClick(false);
    setHasClicked(false);
    setResult(null);
    setStartTime(null);
    setClickTime(null);
  }, []);

  // Enable click handler
  const handleEnableClick = useCallback((data) => {
    console.log('Click enabled:', data);
    setGameState('active');
    setMessage('CLICK NOW!');
    setCanClick(true);
    setStartTime(data.timestamp || Date.now());
  }, []);

  // Too early click handler
  const handleClickTooEarly = useCallback((data) => {
    console.log('Clicked too early:', data);
    setMessage(data.message || 'Too early! You are disqualified.');
    setCanClick(false);
    setHasClicked(true);
  }, []);

  // Game result handler
  const handleGameResult = useCallback((data) => {
    console.log('Game result:', data);
    setGameState('finished');
    setCanClick(false);
    
    const isWinner = data.winnerId === playerId;
    const winnerName = data.winnerId || 'No one';
    
    setResult({
      isWinner,
      winnerId: data.winnerId,
      message: data.message || `${winnerName} won!`,
      reactionTime: clickTime && startTime ? clickTime - startTime : null
    });

    setMessage(isWinner ? '🎉 You won!' : `${winnerName} won the reflex game!`);

    // Auto-hide after 5 seconds
    setTimeout(() => {
      if (onGameEnd) {
        onGameEnd(data);
      }
    }, 5000);
  }, [playerId, clickTime, startTime, onGameEnd]);

  // Setup socket listeners
  useEffect(() => {
    if (!socket) return;

    socket.on('minigameStarted', handleGameStart);
    socket.on('enableClick', handleEnableClick);
    socket.on('clickTooEarly', handleClickTooEarly);
    socket.on('minigameResult', handleGameResult);

    return () => {
      socket.off('minigameStarted', handleGameStart);
      socket.off('enableClick', handleEnableClick);
      socket.off('clickTooEarly', handleClickTooEarly);
      socket.off('minigameResult', handleGameResult);
    };
  }, [socket, handleGameStart, handleEnableClick, handleClickTooEarly, handleGameResult]);

  // Handle click attempt
  const handleClick = useCallback(() => {
    if (!canClick || hasClicked || !socket) {
      return;
    }

    const now = Date.now();
    setClickTime(now);
    setHasClicked(true);
    setCanClick(false);
    setMessage('Clicked! Waiting for results...');

    // Send click attempt to server
    socket.emit('clickAttempt', {
      roomId,
      timestamp: now
    });

    console.log('Click attempt sent');
  }, [canClick, hasClicked, socket, roomId]);

  // Start game function (for host)
  const startGame = useCallback(() => {
    if (!socket || gameState !== 'waiting') {
      return;
    }

    socket.emit('startMinigame', {
      roomId,
      type: 'reflexClick'
    });
  }, [socket, roomId, gameState]);

  // Get button style based on state
  const getButtonStyle = () => {
    const baseStyle = {
      width: '200px',
      height: '200px',
      borderRadius: '50%',
      border: 'none',
      fontSize: '18px',
      fontWeight: 'bold',
      cursor: canClick ? 'pointer' : 'not-allowed',
      transition: 'all 0.2s ease',
      boxShadow: '0 4px 8px rgba(0,0,0,0.2)'
    };

    if (gameState === 'waiting') {
      return {
        ...baseStyle,
        backgroundColor: '#gray',
        color: 'white'
      };
    }

    if (gameState === 'countdown') {
      return {
        ...baseStyle,
        backgroundColor: '#ff4444',
        color: 'white',
        animation: 'pulse 1s infinite'
      };
    }

    if (gameState === 'active' && canClick) {
      return {
        ...baseStyle,
        backgroundColor: '#44ff44',
        color: 'black',
        transform: 'scale(1.1)',
        boxShadow: '0 6px 12px rgba(0,255,0,0.4)'
      };
    }

    return {
      ...baseStyle,
      backgroundColor: '#888',
      color: 'white'
    };
  };

  const getButtonText = () => {
    if (gameState === 'waiting') return 'Waiting...';
    if (gameState === 'countdown') return 'Wait...';
    if (gameState === 'active' && canClick) return 'CLICK!';
    if (hasClicked) return 'Clicked!';
    return 'Disabled';
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '400px',
      padding: '20px',
      backgroundColor: '#f0f0f0',
      borderRadius: '10px',
      fontFamily: 'Arial, sans-serif'
    }}>
      <style>
        {`
          @keyframes pulse {
            0% { transform: scale(1); }
            50% { transform: scale(1.05); }
            100% { transform: scale(1); }
          }
        `}
      </style>
      
      <h2 style={{ marginBottom: '20px', color: '#333' }}>
        Reflex Click Challenge
      </h2>
      
      <p style={{ 
        fontSize: '18px', 
        marginBottom: '30px', 
        textAlign: 'center',
        color: gameState === 'active' ? '#ff6600' : '#666',
        fontWeight: gameState === 'active' ? 'bold' : 'normal'
      }}>
        {message}
      </p>

      <button
        onClick={handleClick}
        disabled={!canClick}
        style={getButtonStyle()}
      >
        {getButtonText()}
      </button>

      {gameState === 'waiting' && (
        <button
          onClick={startGame}
          style={{
            marginTop: '20px',
            padding: '10px 20px',
            fontSize: '16px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
          Start Game
        </button>
      )}

      {result && (
        <div style={{
          marginTop: '20px',
          padding: '15px',
          backgroundColor: result.isWinner ? '#d4edda' : '#f8d7da',
          border: `1px solid ${result.isWinner ? '#c3e6cb' : '#f5c6cb'}`,
          borderRadius: '5px',
          textAlign: 'center'
        }}>
          <h3 style={{ 
            margin: '0 0 10px 0',
            color: result.isWinner ? '#155724' : '#721c24'
          }}>
            {result.isWinner ? '🏆 Victory!' : '😔 Better luck next time!'}
          </h3>
          
          {result.reactionTime && (
            <p style={{ margin: '5px 0', fontSize: '14px' }}>
              Your reaction time: {result.reactionTime}ms
            </p>
          )}
          
          <p style={{ margin: '5px 0', fontSize: '14px' }}>
            {result.message}
          </p>
        </div>
      )}

      {gameState === 'countdown' && (
        <div style={{
          marginTop: '15px',
          fontSize: '14px',
          color: '#666',
          textAlign: 'center'
        }}>
          ⚠️ Don't click too early or you'll be disqualified!
        </div>
      )}
    </div>
  );
};

export default ReflexClickGame;

// Usage in GameScreen.jsx:
/*
import ReflexClickGame from './ReflexClickGame';

// In GameScreen component state:
const [currentMinigame, setCurrentMinigame] = useState(null);

// Add to socket listeners in useEffect:
socket.on('minigameStarted', (data) => {
  if (data.type === 'reflexClick') {
    setCurrentMinigame('reflexClick');
    setRoundPhase('minigame');
  }
});

// Add minigame render in JSX:
{currentMinigame === 'reflexClick' && (
  <ReflexClickGame
    socket={socket}
    roomId={lobby.code}
    playerId={playerId}
    onGameEnd={(result) => {
      setCurrentMinigame(null);
      setRoundPhase('spinning');
      // Continue with normal game flow
    }}
  />
)}

// To start minigame (host only):
const startReflexGame = () => {
  socket.emit('startMinigame', {
    roomId: lobby.code,
    type: 'reflexClick'
  });
};
*/