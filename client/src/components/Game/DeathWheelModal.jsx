// client/src/components/Game/DeathWheelModal.jsx
import React, { useState, useEffect } from 'react';

const DeathWheelModal = ({ 
  isVisible,
  deathWheelState, 
  currentSpinner, 
  isMyTurn,
  spinResults,
  onSpin,
  onClose
}) => {
  const [isSpinning, setIsSpinning] = useState(false);
  const [spinRotation, setSpinRotation] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [currentResult, setCurrentResult] = useState(null);

  // Reset state when modal opens
  useEffect(() => {
    if (isVisible) {
      setIsSpinning(false);
      setSpinRotation(0);
      setShowResult(false);
      setCurrentResult(null);
    }
  }, [isVisible]);

  // Handle spin result
  useEffect(() => {
    if (spinResults && spinResults.length > 0) {
      const latestResult = spinResults[spinResults.length - 1];
      if (latestResult && !currentResult) {
        setCurrentResult(latestResult);
        setShowResult(true);
      }
    }
  }, [spinResults, currentResult]);

  // Listen for other players' spins
  useEffect(() => {
    if (!isMyTurn && currentSpinner && isVisible) {
      // Listen for spin started events to trigger animation for spectators
      const latestResult = spinResults && spinResults.length > 0 ? 
        spinResults[spinResults.length - 1] : null;
      
      if (latestResult && latestResult.type === 'spinStarted' && !isSpinning) {
        setIsSpinning(true);
        
        // Random spin animation for spectators
        const rotations = 3 + Math.random() * 4;
        const finalRotation = spinRotation + (rotations * 360) + (Math.random() * 360);
        setSpinRotation(finalRotation);
        
        // Stop spinning after 3 seconds
        setTimeout(() => {
          setIsSpinning(false);
        }, 3000);
      }
    }
  }, [spinResults, currentSpinner, isMyTurn, isVisible, isSpinning, spinRotation]);

  if (!isVisible) return null;

  const safeWheelState = deathWheelState || {
    redFields: 1,
    greenFields: 4,
    bonusFields: 0
  };

  const handleSpin = () => {
    if (!isMyTurn || isSpinning) return;
    
    setIsSpinning(true);
    
    // Random spin animation (3-7 full rotations plus random angle)
    const rotations = 3 + Math.random() * 4;
    const finalRotation = spinRotation + (rotations * 360) + (Math.random() * 360);
    setSpinRotation(finalRotation);
    
    // Call the actual spin function
    onSpin();
    
    // Stop spinning animation after 3 seconds
    setTimeout(() => {
      setIsSpinning(false);
    }, 3000);
  };

  const getWheelFields = () => {
    const fields = [];
    
    // Add death fields
    for (let i = 0; i < safeWheelState.redFields; i++) {
      fields.push({ type: 'death', color: '#f44336', symbol: '💀', label: 'Death' });
    }
    
    // Add safe fields
    for (let i = 0; i < safeWheelState.greenFields; i++) {
      fields.push({ type: 'safe', color: '#4caf50', symbol: '✅', label: 'Safe' });
    }
    
    // Add bonus fields
    for (let i = 0; i < (safeWheelState.bonusFields || 0); i++) {
      fields.push({ type: 'bonus', color: '#ff9800', symbol: '❤️', label: 'Bonus Life' });
    }
    
    return fields;
  };

  const fields = getWheelFields();
  const totalFields = fields.length;

  const getResultMessage = () => {
    if (!currentResult) return '';
    
    switch (currentResult.result) {
      case 'death':
        return `💀 Death! Lost ${currentResult.livesLost} life${currentResult.livesLost > 1 ? 's' : ''}`;
      case 'safe':
        return '✅ Safe! You survived this round';
      case 'bonus':
        return '❤️ Bonus Life! You gained a life';
      default:
        return 'Spin complete';
    }
  };

  const getResultColor = () => {
    if (!currentResult) return '#333';
    
    switch (currentResult.result) {
      case 'death': return '#f44336';
      case 'safe': return '#4caf50';
      case 'bonus': return '#ff9800';
      default: return '#333';
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.9)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 2000,
      animation: 'fadeIn 0.5s ease-in-out'
    }}>
      <style>
        {`
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          
          @keyframes wheelSpin {
            from { transform: translate(-50%, -50%) rotate(0deg); }
            to { transform: translate(-50%, -50%) rotate(${spinRotation}deg); }
          }
          
          @keyframes pulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.05); }
          }
          
          @keyframes resultPop {
            0% { transform: scale(0); opacity: 0; }
            50% { transform: scale(1.2); }
            100% { transform: scale(1); opacity: 1; }
          }
        `}
      </style>

      <div style={{
        backgroundColor: 'white',
        borderRadius: '20px',
        padding: '40px',
        textAlign: 'center',
        maxWidth: '600px',
        width: '90%',
        maxHeight: '90vh',
        overflow: 'auto',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)'
      }}>
        
        {/* Header */}
        <h1 style={{
          margin: '0 0 20px 0',
          color: '#333',
          fontSize: '36px',
          fontWeight: 'bold',
          textShadow: '2px 2px 4px rgba(0,0,0,0.1)'
        }}>
          🎰 Death Wheel
        </h1>

        {/* Current Spinner Info */}
        <div style={{
          padding: '15px',
          backgroundColor: isMyTurn ? '#e3f2fd' : '#f5f5f5',
          borderRadius: '12px',
          border: `3px solid ${isMyTurn ? '#2196f3' : '#ddd'}`,
          marginBottom: '30px'
        }}>
          <h2 style={{
            margin: '0 0 8px 0',
            color: isMyTurn ? '#1976d2' : '#666',
            fontSize: '24px'
          }}>
            {isMyTurn ? '🎯 Your Turn!' : `🎮 ${currentSpinner?.name || 'Unknown'}'s Turn`}
          </h2>
          
          {isMyTurn && !isSpinning && (
            <p style={{
              margin: 0,
              color: '#1976d2',
              fontSize: '16px',
              fontWeight: '500'
            }}>
              Click the wheel to spin and discover your fate!
            </p>
          )}
          
          {isMyTurn && isSpinning && (
            <p style={{
              margin: 0,
              color: '#ff9800',
              fontSize: '16px',
              fontWeight: '500'
            }}>
              🎰 Spinning... Hold your breath!
            </p>
          )}
          
          {!isMyTurn && !isSpinning && (
            <p style={{
              margin: 0,
              color: '#666',
              fontSize: '16px'
            }}>
              Watch as {currentSpinner?.name || 'the player'} prepares to spin...
            </p>
          )}

          {!isMyTurn && isSpinning && (
            <p style={{
              margin: 0,
              color: '#ff9800',
              fontSize: '16px',
              fontWeight: '500'
            }}>
              🎰 {currentSpinner?.name || 'Player'} is spinning the wheel!
            </p>
          )}
        </div>

        {/* Death Wheel */}
        <div style={{
          position: 'relative',
          width: '300px',
          height: '300px',
          margin: '30px auto',
          cursor: isMyTurn && !isSpinning ? 'pointer' : 'default'
        }} onClick={handleSpin}>
          
          {/* Wheel Base */}
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            width: '300px',
            height: '300px',
            borderRadius: '50%',
            border: '8px solid #333',
            backgroundColor: '#fff',
            transform: 'translate(-50%, -50%)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
            animation: isSpinning ? `wheelSpin 3s cubic-bezier(0.25, 0.46, 0.45, 0.94)` : 'none'
          }}>
            
            {/* Wheel Segments */}
            {fields.map((field, index) => {
              const angle = (360 / totalFields) * index;
              const segmentAngle = 360 / totalFields;
              
              return (
                <div
                  key={index}
                  style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    width: '150px',
                    height: '150px',
                    transformOrigin: '0 0',
                    transform: `rotate(${angle}deg)`,
                    clipPath: `polygon(0 0, ${50 * Math.cos((segmentAngle * Math.PI) / 180)}px ${50 * Math.sin((segmentAngle * Math.PI) / 180)}px, 0 150px)`,
                    backgroundColor: field.color,
                    opacity: 0.9
                  }}
                >
                  {/* Symbol */}
                  <div style={{
                    position: 'absolute',
                    top: '40px',
                    left: '20px',
                    fontSize: '24px',
                    transform: `rotate(-${angle}deg)`,
                    textShadow: '2px 2px 4px rgba(0,0,0,0.5)'
                  }}>
                    {field.symbol}
                  </div>
                </div>
              );
            })}
            
            {/* Center Hub */}
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              width: '60px',
              height: '60px',
              backgroundColor: '#333',
              borderRadius: '50%',
              transform: 'translate(-50%, -50%)',
              zIndex: 10,
              boxShadow: '0 4px 8px rgba(0,0,0,0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: '20px',
              fontWeight: 'bold'
            }}>
              🎰
            </div>
          </div>

          {/* Pointer */}
          <div style={{
            position: 'absolute',
            top: '20px',
            left: '50%',
            width: '0',
            height: '0',
            borderLeft: '20px solid transparent',
            borderRight: '20px solid transparent',
            borderTop: '40px solid #ff4444',
            transform: 'translateX(-50%)',
            zIndex: 15,
            filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.3))'
          }} />

          {/* Spin Indicator */}
          {isMyTurn && !isSpinning && !showResult && (
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              backgroundColor: 'rgba(33, 150, 243, 0.9)',
              color: 'white',
              padding: '15px 25px',
              borderRadius: '50px',
              fontSize: '18px',
              fontWeight: 'bold',
              zIndex: 20,
              animation: 'pulse 2s infinite',
              boxShadow: '0 4px 15px rgba(33, 150, 243, 0.4)',
              cursor: 'pointer'
            }}>
              CLICK TO SPIN
            </div>
          )}

          {/* Spinning Indicator */}
          {isSpinning && (
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              backgroundColor: 'rgba(255, 152, 0, 0.95)',
              color: 'white',
              padding: '20px 30px',
              borderRadius: '50px',
              fontSize: '20px',
              fontWeight: 'bold',
              zIndex: 20,
              boxShadow: '0 8px 25px rgba(255, 152, 0, 0.6)',
              animation: 'pulse 1s infinite',
              border: '3px solid rgba(255, 255, 255, 0.3)'
            }}>
              {isMyTurn ? '🎰 SPINNING...' : `🎰 ${currentSpinner?.name || 'PLAYER'} SPINNING...`}
            </div>
          )}

          {/* Spectator Waiting Indicator */}
          {!isMyTurn && !isSpinning && !showResult && (
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              backgroundColor: 'rgba(156, 39, 176, 0.9)',
              color: 'white',
              padding: '15px 25px',
              borderRadius: '50px',
              fontSize: '16px',
              fontWeight: 'bold',
              zIndex: 20,
              animation: 'pulse 3s infinite',
              boxShadow: '0 4px 15px rgba(156, 39, 176, 0.4)'
            }}>
              👀 WATCHING...
            </div>
          )}
        </div>

        {/* Wheel Stats */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '15px',
          marginBottom: '30px'
        }}>
          <div style={{
            padding: '15px',
            backgroundColor: '#ffebee',
            borderRadius: '12px',
            border: '2px solid #f44336'
          }}>
            <div style={{ fontSize: '24px', marginBottom: '8px' }}>💀</div>
            <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#f44336' }}>
              {safeWheelState.redFields}
            </div>
            <div style={{ fontSize: '14px', color: '#666' }}>Death</div>
          </div>
          
          <div style={{
            padding: '15px',
            backgroundColor: '#e8f5e8',
            borderRadius: '12px',
            border: '2px solid #4caf50'
          }}>
            <div style={{ fontSize: '24px', marginBottom: '8px' }}>✅</div>
            <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#4caf50' }}>
              {safeWheelState.greenFields}
            </div>
            <div style={{ fontSize: '14px', color: '#666' }}>Safe</div>
          </div>
          
          <div style={{
            padding: '15px',
            backgroundColor: '#fff3e0',
            borderRadius: '12px',
            border: '2px solid #ff9800'
          }}>
            <div style={{ fontSize: '24px', marginBottom: '8px' }}>❤️</div>
            <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#ff9800' }}>
              {safeWheelState.bonusFields || 0}
            </div>
            <div style={{ fontSize: '14px', color: '#666' }}>Bonus</div>
          </div>
        </div>

        {/* Result Display */}
        {showResult && currentResult && (
          <div style={{
            padding: '20px',
            backgroundColor: currentResult.result === 'death' ? '#ffebee' : 
                           currentResult.result === 'bonus' ? '#fff3e0' : '#e8f5e8',
            border: `3px solid ${getResultColor()}`,
            borderRadius: '15px',
            marginBottom: '30px',
            animation: 'resultPop 0.6s ease-out'
          }}>
            <h3 style={{
              margin: '0 0 10px 0',
              color: getResultColor(),
              fontSize: '28px',
              fontWeight: 'bold'
            }}>
              {getResultMessage()}
            </h3>
            
            <div style={{
              fontSize: '18px',
              color: '#666',
              marginBottom: '10px'
            }}>
              Lives remaining: {currentResult.newLives} ❤️
            </div>
            
            {currentResult.result === 'death' && currentResult.newLives === 0 && (
              <div style={{
                padding: '12px',
                backgroundColor: '#f44336',
                color: 'white',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: 'bold'
              }}>
                💀 YOU HAVE BEEN ELIMINATED!
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div style={{
          display: 'flex',
          gap: '15px',
          justifyContent: 'center'
        }}>
          {!isMyTurn && (
            <button
              onClick={onClose}
              style={{
                padding: '15px 30px',
                backgroundColor: '#6c757d',
                color: 'white',
                border: 'none',
                borderRadius: '10px',
                fontSize: '16px',
                fontWeight: 'bold',
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}
            >
              Continue Watching
            </button>
          )}
          
          {showResult && (
            <button
              onClick={onClose}
              style={{
                padding: '15px 30px',
                backgroundColor: '#4CAF50',
                color: 'white',
                border: 'none',
                borderRadius: '10px',
                fontSize: '16px',
                fontWeight: 'bold',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                boxShadow: '0 4px 12px rgba(76, 175, 80, 0.3)'
              }}
            >
              Continue Game 🎮
            </button>
          )}
        </div>

        {/* Instructions */}
        {!showResult && (
          <div style={{
            marginTop: '20px',
            padding: '15px',
            backgroundColor: '#f8f9fa',
            borderRadius: '10px',
            fontSize: '14px',
            color: '#666'
          }}>
            {isMyTurn ? (
              <>
                🎯 <strong>Your turn!</strong> Click the wheel to spin and see if you survive.
                <br />
                💡 Higher X2 risk means double the consequences!
              </>
            ) : (
              <>
                👀 <strong>Spectating:</strong> Watch as {currentSpinner?.name || 'the player'} faces the wheel.
                <br />
                🎭 <strong>Live Action:</strong> You'll see the wheel spin in real-time!
              </>
            )}
          </div>
        )}

        {/* Live Viewer Count (Mock) */}
        {!isMyTurn && (
          <div style={{
            marginTop: '15px',
            textAlign: 'center',
            fontSize: '12px',
            color: '#999',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '5px'
          }}>
            <span style={{ color: '#f44336' }}>🔴</span>
            <span>LIVE</span>
            <span>•</span>
            <span>👥 {Math.floor(Math.random() * 5) + 2} watching</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default DeathWheelModal;