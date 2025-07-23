// client/src/components/Game/SpectatorFeatures.jsx
import React, { useState, useEffect } from 'react';

const SpectatorFeatures = ({ 
  isSpectator, 
  currentSpinner, 
  isVisible, 
  spinQueue,
  recentSpins 
}) => {
  const [predictions, setPredictions] = useState(new Map());
  const [showPredictions, setShowPredictions] = useState(true);
  const [spinCount, setSpinCount] = useState(0);

  useEffect(() => {
    if (recentSpins) {
      setSpinCount(recentSpins.length);
    }
  }, [recentSpins]);

  const makePrediction = (prediction) => {
    if (!currentSpinner) return;
    
    setPredictions(prev => new Map(prev.set(currentSpinner._id, {
      prediction,
      timestamp: Date.now(),
      spinnerName: currentSpinner.name
    })));
  };

  const getPredictionAccuracy = () => {
    if (predictions.size === 0) return 0;
    // This would calculate accuracy based on actual results
    return Math.round(Math.random() * 100); // Placeholder
  };

  if (!isVisible || !isSpectator) return null;

  return (
    <div style={{
      position: 'fixed',
      top: '20px',
      right: '20px',
      width: '300px',
      backgroundColor: 'rgba(0, 0, 0, 0.9)',
      borderRadius: '12px',
      padding: '15px',
      color: 'white',
      zIndex: 1999,
      border: '2px solid #ff9800'
    }}>
      
      {/* Spectator Header */}
      <div style={{
        textAlign: 'center',
        marginBottom: '15px',
        borderBottom: '1px solid #333',
        paddingBottom: '10px'
      }}>
        <h4 style={{ margin: 0, color: '#ff9800' }}>
          👀 Spectator Mode
        </h4>
        <p style={{ 
          margin: '5px 0 0 0', 
          fontSize: '12px', 
          color: '#ccc' 
        }}>
          Live Death Wheel Action!
        </p>
      </div>

      {/* Current Spinner Info */}
      {currentSpinner && (
        <div style={{
          backgroundColor: 'rgba(255, 152, 0, 0.2)',
          padding: '10px',
          borderRadius: '8px',
          marginBottom: '15px',
          border: '1px solid #ff9800'
        }}>
          <div style={{ 
            fontSize: '14px', 
            fontWeight: 'bold',
            marginBottom: '5px'
          }}>
            🎯 Current Spinner:
          </div>
          <div style={{ fontSize: '16px', color: '#ff9800' }}>
            {currentSpinner.name}
          </div>
          <div style={{ fontSize: '11px', color: '#ccc', marginTop: '3px' }}>
            Lives: {currentSpinner.lives} ❤️
          </div>
        </div>
      )}

      {/* Spin Queue */}
      {spinQueue && spinQueue.length > 1 && (
        <div style={{
          backgroundColor: 'rgba(33, 150, 243, 0.2)',
          padding: '10px',
          borderRadius: '8px',
          marginBottom: '15px',
          border: '1px solid #2196f3'
        }}>
          <div style={{ 
            fontSize: '12px', 
            fontWeight: 'bold',
            marginBottom: '8px',
            color: '#2196f3'
          }}>
            ⏳ Waiting Queue ({spinQueue.length - 1}):
          </div>
          {spinQueue.slice(1, 4).map((player, index) => (
            <div key={player._id} style={{
              fontSize: '11px',
              color: '#ccc',
              marginBottom: '2px'
            }}>
              {index + 2}. {player.name} ({player.lives}❤️)
            </div>
          ))}
          {spinQueue.length > 4 && (
            <div style={{ fontSize: '10px', color: '#888' }}>
              +{spinQueue.length - 4} more...
            </div>
          )}
        </div>
      )}

      {/* Quick Predictions */}
      {showPredictions && currentSpinner && (
        <div style={{
          backgroundColor: 'rgba(76, 175, 80, 0.2)',
          padding: '10px',
          borderRadius: '8px',
          marginBottom: '15px',
          border: '1px solid #4caf50'
        }}>
          <div style={{ 
            fontSize: '12px', 
            fontWeight: 'bold',
            marginBottom: '8px',
            color: '#4caf50'
          }}>
            🔮 Your Prediction:
          </div>
          <div style={{ 
            display: 'flex', 
            gap: '5px',
            flexWrap: 'wrap'
          }}>
            <button
              onClick={() => makePrediction('death')}
              style={{
                padding: '5px 8px',
                backgroundColor: '#f44336',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                fontSize: '10px',
                cursor: 'pointer'
              }}
            >
              💀 Death
            </button>
            <button
              onClick={() => makePrediction('safe')}
              style={{
                padding: '5px 8px',
                backgroundColor: '#4caf50',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                fontSize: '10px',
                cursor: 'pointer'
              }}
            >
              ✅ Safe
            </button>
            <button
              onClick={() => makePrediction('bonus')}
              style={{
                padding: '5px 8px',
                backgroundColor: '#ff9800',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                fontSize: '10px',
                cursor: 'pointer'
              }}
            >
              ❤️ Bonus
            </button>
          </div>
          
          {predictions.has(currentSpinner._id) && (
            <div style={{
              marginTop: '8px',
              fontSize: '11px',
              color: '#4caf50',
              fontStyle: 'italic'
            }}>
              ✓ Predicted: {predictions.get(currentSpinner._id)?.prediction}
            </div>
          )}
        </div>
      )}

      {/* Statistics */}
      <div style={{
        backgroundColor: 'rgba(156, 39, 176, 0.2)',
        padding: '10px',
        borderRadius: '8px',
        border: '1px solid #9c27b0'
      }}>
        <div style={{ 
          fontSize: '12px', 
          fontWeight: 'bold',
          marginBottom: '8px',
          color: '#9c27b0'
        }}>
          📊 Session Stats:
        </div>
        <div style={{ fontSize: '11px', color: '#ccc' }}>
          <div>Spins Watched: {spinCount}</div>
          <div>Predictions: {predictions.size}</div>
          <div>Accuracy: {getPredictionAccuracy()}%</div>
        </div>
      </div>

      {/* Toggle Button */}
      <button
        onClick={() => setShowPredictions(!showPredictions)}
        style={{
          position: 'absolute',
          top: '-10px',
          right: '-10px',
          width: '30px',
          height: '30px',
          borderRadius: '50%',
          backgroundColor: '#ff9800',
          color: 'white',
          border: 'none',
          fontSize: '12px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        {showPredictions ? '−' : '+'}
      </button>
    </div>
  );
};

export default SpectatorFeatures;