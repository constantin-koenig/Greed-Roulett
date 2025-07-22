// client/src/components/Game/ReflexClickGame.jsx
// Integrated Reflex Click Minigame for Greed Roulette
import React, { useState, useEffect, useCallback } from 'react';

const ReflexClickGame = ({ socket, roomId, playerId, onGameEnd }) => {
  const [gameState, setGameState] = useState('waiting'); // 'waiting', 'countdown', 'active', 'roundResult', 'finished'
  const [message, setMessage] = useState('Waiting for game to start...');
  const [canClick, setCanClick] = useState(false);
  const [hasClicked, setHasClicked] = useState(false);
  const [result, setResult] = useState(null);
  const [startTime, setStartTime] = useState(null);
  const [clickTime, setClickTime] = useState(null);
  const [currentRound, setCurrentRound] = useState(1);
  const [maxRounds, setMaxRounds] = useState(3);
  const [roundResults, setRoundResults] = useState([]);
  const [eliminated, setEliminated] = useState(false);

  // Game start handler
  const handleGameStart = useCallback((data) => {
    console.log('Minigame started:', data);
    setGameState('waiting');
    setMessage('Reflex Click Challenge started! Get ready for 3 rounds...');
    setCurrentRound(1);
    setMaxRounds(3);
    setRoundResults([]);
    setEliminated(false);
    setCanClick(false);
    setHasClicked(false);
    setResult(null);
    setStartTime(null);
    setClickTime(null);
  }, []);

  // Round start handler
  const handleRoundStart = useCallback((data) => {
    console.log('Round started:', data);
    setGameState('countdown');
    setCurrentRound(data.round);
    setMaxRounds(data.maxRounds);
    setMessage(data.message || `Round ${data.round}/${data.maxRounds}: Get ready!`);
    setCanClick(false);
    setHasClicked(false);
    setStartTime(null);
    setClickTime(null);
  }, []);

  // Enable click handler
  const handleEnableClick = useCallback((data) => {
    console.log('Click enabled:', data);
    if (!eliminated) {
      setGameState('active');
      setMessage('CLICK NOW!');
      setCanClick(true);
      setStartTime(data.timestamp || Date.now());
    }
  }, [eliminated]);

  // Too early click handler
  const handleClickTooEarly = useCallback((data) => {
    console.log('Clicked too early:', data);
    setMessage(data.message || 'Too early! You are eliminated.');
    setCanClick(false);
    setHasClicked(true);
    setEliminated(true);
  }, []);

  // Round result handler
  const handleRoundResult = useCallback((data) => {
    console.log('Round result:', data);
    setGameState('roundResult');
    setCanClick(false);

    const myResult = data.allPlayerResults?.[playerId];
    if (myResult) {
      const roundResult = {
        round: data.round,
        result: myResult.roundResult?.result || 'noClick',
        reactionTime: myResult.roundResult?.reactionTime,
        points: myResult.points,
        wasWinner: data.roundWinnerId === playerId
      };

      setRoundResults(prev => [...prev, roundResult]);

      if (roundResult.wasWinner) {
        setMessage(`🎉 You won Round ${data.round}!`);
      } else if (roundResult.result === 'late') {
        setMessage(`Round ${data.round}: Too slow, but you're still in!`);
      } else if (roundResult.result === 'noClick') {
        setMessage(`Round ${data.round}: You didn't click in time!`);
      }
    }

    // Show round results for a moment
    setTimeout(() => {
      if (data.round < data.maxRounds && !eliminated) {
        setGameState('waiting');
        setMessage(`Preparing Round ${data.round + 1}...`);
      }
    }, 2000);
  }, [playerId, eliminated]);

  // Game result handler
  const handleGameResult = useCallback((data) => {
    console.log('Game result:', data);
    setGameState('finished');
    setCanClick(false);
    
    const isWinner = data.winnerId === playerId;
    const myFinalResult = data.playerResults?.[playerId];
    
    setResult({
      isWinner,
      winnerId: data.winnerId,
      message: data.message || `Game Over!`,
      totalPoints: myFinalResult?.totalPoints || 0,
      roundsWon: myFinalResult?.roundsWon || 0,
      finalRanking: isWinner ? 1 : null
    });

    setMessage(isWinner ? '🏆 You won the entire challenge!' : `Game Over! Winner: ${data.winnerId}`);

    // Auto-hide after 5 seconds
    setTimeout(() => {
      if (onGameEnd) {
        onGameEnd(data);
      }
    }, 5000);
  }, [playerId, onGameEnd]);

  // Setup socket listeners
  useEffect(() => {
    if (!socket) return;

    console.log('ReflexClickGame: Setting up socket listeners');

    const handleGameStartDebug = (data) => {
      console.log('ReflexClickGame: Received minigameStarted:', data);
      handleGameStart(data);
    };

    const handleRoundStartDebug = (data) => {
      console.log('ReflexClickGame: Received roundStarted:', data);
      handleRoundStart(data);
    };

    const handleEnableClickDebug = (data) => {
      console.log('ReflexClickGame: Received enableClick:', data);
      handleEnableClick(data);
    };

    const handleClickTooEarlyDebug = (data) => {
      console.log('ReflexClickGame: Received clickTooEarly:', data);
      handleClickTooEarly(data);
    };

    const handleRoundResultDebug = (data) => {
      console.log('ReflexClickGame: Received roundResult:', data);
      handleRoundResult(data);
    };

    const handleGameResultDebug = (data) => {
      console.log('ReflexClickGame: Received minigameResult:', data);
      handleGameResult(data);
    };

    socket.on('minigameStarted', handleGameStartDebug);
    socket.on('roundStarted', handleRoundStartDebug);
    socket.on('enableClick', handleEnableClickDebug);
    socket.on('clickTooEarly', handleClickTooEarlyDebug);
    socket.on('roundResult', handleRoundResultDebug);
    socket.on('minigameResult', handleGameResultDebug);

    return () => {
      console.log('ReflexClickGame: Cleaning up socket listeners');
      socket.off('minigameStarted', handleGameStartDebug);
      socket.off('roundStarted', handleRoundStartDebug);
      socket.off('enableClick', handleEnableClickDebug);
      socket.off('clickTooEarly', handleClickTooEarlyDebug);
      socket.off('roundResult', handleRoundResultDebug);
      socket.off('minigameResult', handleGameResultDebug);
    };
  }, [socket, handleGameStart, handleRoundStart, handleEnableClick, handleClickTooEarly, handleRoundResult, handleGameResult]);

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

    console.log('ReflexClickGame: Starting game with roomId:', roomId);

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
      cursor: canClick && !eliminated ? 'pointer' : 'not-allowed',
      transition: 'all 0.2s ease',
      boxShadow: '0 4px 8px rgba(0,0,0,0.2)'
    };

    if (eliminated) {
      return {
        ...baseStyle,
        backgroundColor: '#666',
        color: 'white'
      };
    }

    if (gameState === 'waiting') {
      return {
        ...baseStyle,
        backgroundColor: '#2196f3',
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
    if (eliminated) return 'Eliminated';
    if (gameState === 'waiting') return `Round ${currentRound}`;
    if (gameState === 'countdown') return 'Wait...';
    if (gameState === 'active' && canClick) return 'CLICK!';
    if (gameState === 'roundResult') return 'Round Over';
    if (hasClicked) return 'Clicked!';
    return 'Ready';
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
        Reflex Click Challenge - 3 Rounds
      </h2>
      
      {/* Round Progress */}
      <div style={{
        marginBottom: '20px',
        padding: '15px',
        backgroundColor: '#f0f0f0',
        borderRadius: '8px',
        border: '2px solid #ddd'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0, color: '#555' }}>
            Round {currentRound} of {maxRounds}
          </h3>
          <div style={{ display: 'flex', gap: '5px' }}>
            {[1, 2, 3].map(round => (
              <div
                key={round}
                style={{
                  width: '30px',
                  height: '30px',
                  borderRadius: '50%',
                  backgroundColor: 
                    roundResults.find(r => r.round === round)?.wasWinner ? '#4CAF50' :
                    roundResults.find(r => r.round === round) ? '#ff9800' :
                    round === currentRound ? '#2196f3' : '#ddd',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '12px',
                  fontWeight: 'bold'
                }}
              >
                {roundResults.find(r => r.round === round)?.wasWinner ? '🏆' :
                 roundResults.find(r => r.round === round) ? '✓' :
                 round}
              </div>
            ))}
          </div>
        </div>
        
        {/* Score Display */}
        {roundResults.length > 0 && (
          <div style={{ marginTop: '10px', fontSize: '14px', color: '#666' }}>
            Your Score: {roundResults.reduce((sum, r) => sum + (r.points || 0), 0)} points | 
            Rounds Won: {roundResults.filter(r => r.wasWinner).length}
            {eliminated && <span style={{ color: '#f44336', fontWeight: 'bold' }}> - ELIMINATED</span>}
          </div>
        )}
      </div>
      
      <p style={{ 
        fontSize: '18px', 
        marginBottom: '30px', 
        textAlign: 'center',
        color: 
          gameState === 'active' ? '#ff6600' : 
          eliminated ? '#f44336' : 
          gameState === 'roundResult' ? '#4CAF50' : '#666',
        fontWeight: 
          gameState === 'active' ? 'bold' : 
          gameState === 'roundResult' ? 'bold' : 'normal'
      }}>
        {message}
      </p>

      <button
        onClick={handleClick}
        disabled={!canClick || eliminated}
        style={getButtonStyle()}
      >
        {getButtonText()}
      </button>

      {gameState === 'waiting' && currentRound === 1 && (
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
          Start 3-Round Challenge
        </button>
      )}

      {/* Round Results Summary */}
      {roundResults.length > 0 && (
        <div style={{
          marginTop: '20px',
          padding: '15px',
          backgroundColor: '#f8f9fa',
          border: '1px solid #e9ecef',
          borderRadius: '8px'
        }}>
          <h4 style={{ margin: '0 0 10px 0', color: '#495057' }}>Round Results</h4>
          {roundResults.map((roundResult, index) => (
            <div key={index} style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '8px 0',
              borderBottom: index < roundResults.length - 1 ? '1px solid #e9ecef' : 'none'
            }}>
              <span style={{ fontWeight: 'bold' }}>
                Round {roundResult.round}:
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                {roundResult.wasWinner && <span style={{ color: '#4CAF50' }}>🏆 WON</span>}
                {roundResult.result === 'late' && <span style={{ color: '#ff9800' }}>⏰ Late</span>}
                {roundResult.result === 'eliminated' && <span style={{ color: '#f44336' }}>❌ Eliminated</span>}
                {roundResult.result === 'noClick' && <span style={{ color: '#666' }}>⭕ No Click</span>}
                {roundResult.reactionTime && (
                  <span style={{ fontSize: '12px', color: '#666' }}>
                    {roundResult.reactionTime}ms
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {result && (
        <div style={{
          marginTop: '20px',
          padding: '20px',
          backgroundColor: result.isWinner ? '#d4edda' : '#f8d7da',
          border: `2px solid ${result.isWinner ? '#c3e6cb' : '#f5c6cb'}`,
          borderRadius: '8px',
          textAlign: 'center'
        }}>
          <h3 style={{ 
            margin: '0 0 15px 0',
            color: result.isWinner ? '#155724' : '#721c24',
            fontSize: '24px'
          }}>
            {result.isWinner ? '🏆 CHAMPION!' : '🎮 Game Complete!'}
          </h3>
          
          <div style={{ marginBottom: '15px' }}>
            <div style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '5px' }}>
              Final Score: {result.totalPoints || 0} points
            </div>
            <div style={{ fontSize: '16px', marginBottom: '5px' }}>
              Rounds Won: {result.roundsWon || 0}/3
            </div>
          </div>
          
          <p style={{ margin: '10px 0', fontSize: '16px' }}>
            {result.message}
          </p>
          
          {result.isWinner && (
            <div style={{
              padding: '10px',
              backgroundColor: 'rgba(255, 215, 0, 0.3)',
              borderRadius: '6px',
              marginTop: '10px'
            }}>
              🎉 Congratulations! You dominated the reflex challenge! 🎉
            </div>
          )}
        </div>
      )}

      {(gameState === 'countdown' || gameState === 'waiting') && !eliminated && (
        <div style={{
          marginTop: '15px',
          fontSize: '14px',
          color: '#666',
          textAlign: 'center'
        }}>
          {gameState === 'countdown' ? (
            <>
              ⚠️ Don't click too early or you'll be eliminated from the entire challenge!
              <br />
              💡 Wait for the button to turn green before clicking
            </>
          ) : (
            <>
              🎯 Best of 3 rounds - Win the most rounds to become champion!
              <br />
              ⚡ Each round win = 3 points | Too early = elimination
            </>
          )}
        </div>
      )}

      {eliminated && (
        <div style={{
          marginTop: '15px',
          padding: '15px',
          backgroundColor: '#ffebee',
          border: '2px solid #f44336',
          borderRadius: '8px',
          textAlign: 'center'
        }}>
          <h4 style={{ margin: '0 0 10px 0', color: '#d32f2f' }}>
            💀 Eliminated!
          </h4>
          <p style={{ margin: 0, fontSize: '14px', color: '#c62828' }}>
            You clicked too early and have been eliminated from the challenge.
            <br />
            Watch the remaining players compete for victory!
          </p>
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