// client/src/components/Game/DeathWheel.jsx - Fixed version compatible with GameScreen
import React from 'react';

const DeathWheel = ({ deathWheelState, currentPlayer }) => {
  // Safety check for deathWheelState
  const safeWheelState = deathWheelState || {
    redFields: 1,
    greenFields: 4,
    bonusFields: 0
  };

  const getWheelDisplay = () => {
    const fields = [];
    
    // Add red fields (death)
    for (let i = 0; i < safeWheelState.redFields; i++) {
      fields.push({ type: 'death', color: '#f44336', symbol: '💀' });
    }
    
    // Add green fields (safe)
    for (let i = 0; i < safeWheelState.greenFields; i++) {
      fields.push({ type: 'safe', color: '#4caf50', symbol: '✅' });
    }
    
    // Add bonus fields if any
    for (let i = 0; i < (safeWheelState.bonusFields || 0); i++) {
      fields.push({ type: 'bonus', color: '#ff9800', symbol: '❤️' });
    }
    
    return fields;
  };

  const fields = getWheelDisplay();
  const totalFields = fields.length;

  // Calculate survival chance
  const survivalChance = totalFields > 0 ? 
    Math.round(((safeWheelState.greenFields + (safeWheelState.bonusFields || 0)) / totalFields) * 100) : 0;

  // Calculate death chance
  const deathChance = totalFields > 0 ? 
    Math.round((safeWheelState.redFields / totalFields) * 100) : 0;

  return (
    <div style={{ 
      padding: '20px',
      backgroundColor: '#f8f9fa',
      borderRadius: '12px',
      border: '2px solid #e0e0e0',
      textAlign: 'center'
    }}>
      <h3 style={{ 
        margin: '0 0 15px 0', 
        color: '#333',
        fontSize: '24px',
        fontWeight: 'bold'
      }}>
        🎰 Death Wheel
      </h3>
      
      {/* Wheel Visual */}
      <div style={{ 
        position: 'relative',
        width: '180px',
        height: '180px',
        margin: '20px auto',
        borderRadius: '50%',
        border: '4px solid #333',
        backgroundColor: '#fff',
        boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
      }}>
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
                width: '50%',
                height: '2px',
                transformOrigin: '0 0',
                transform: `rotate(${angle}deg)`,
                zIndex: 1
              }}
            >
              {/* Segment background */}
              <div style={{
                position: 'absolute',
                top: '-89px',
                left: '0',
                width: '89px',
                height: '89px',
                backgroundColor: field.color,
                clipPath: `polygon(0 100%, 100% 100%, ${50 + 50 * Math.sin((segmentAngle * Math.PI) / 180)}% ${50 - 50 * Math.cos((segmentAngle * Math.PI) / 180)}%)`,
                opacity: 0.8
              }}></div>
              
              {/* Symbol */}
              <div style={{
                position: 'absolute',
                top: '-60px',
                left: '15px',
                fontSize: '18px',
                zIndex: 2,
                textShadow: '1px 1px 2px rgba(0,0,0,0.5)'
              }}>
                {field.symbol}
              </div>
            </div>
          );
        })}
        
        {/* Center circle */}
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          width: '30px',
          height: '30px',
          backgroundColor: '#333',
          borderRadius: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 3,
          boxShadow: '0 2px 4px rgba(0,0,0,0.3)'
        }}>
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            width: '20px',
            height: '20px',
            backgroundColor: '#fff',
            borderRadius: '50%',
            transform: 'translate(-50%, -50%)'
          }}></div>
        </div>
        
        {/* Pointer */}
        <div style={{
          position: 'absolute',
          top: '-15px',
          left: '50%',
          width: '0',
          height: '0',
          borderLeft: '12px solid transparent',
          borderRight: '12px solid transparent',
          borderTop: '25px solid #ff4444',
          transform: 'translateX(-50%)',
          zIndex: 4,
          filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))'
        }}></div>
      </div>

      {/* Wheel Statistics */}
      <div style={{ 
        backgroundColor: '#fff',
        padding: '15px',
        borderRadius: '8px',
        border: '1px solid #e0e0e0',
        marginTop: '20px'
      }}>
        <h4 style={{ margin: '0 0 12px 0', color: '#555', fontSize: '16px' }}>
          Current Wheel
        </h4>
        
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(3, 1fr)', 
          gap: '12px',
          marginBottom: '15px'
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ 
              backgroundColor: '#ffebee', 
              padding: '8px', 
              borderRadius: '6px',
              border: '1px solid #f44336'
            }}>
              <div style={{ fontSize: '20px', marginBottom: '4px' }}>💀</div>
              <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#f44336' }}>
                {safeWheelState.redFields}
              </div>
              <div style={{ fontSize: '12px', color: '#666' }}>Death</div>
            </div>
          </div>
          
          <div style={{ textAlign: 'center' }}>
            <div style={{ 
              backgroundColor: '#e8f5e8', 
              padding: '8px', 
              borderRadius: '6px',
              border: '1px solid #4caf50'
            }}>
              <div style={{ fontSize: '20px', marginBottom: '4px' }}>✅</div>
              <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#4caf50' }}>
                {safeWheelState.greenFields}
              </div>
              <div style={{ fontSize: '12px', color: '#666' }}>Safe</div>
            </div>
          </div>
          
          <div style={{ textAlign: 'center' }}>
            <div style={{ 
              backgroundColor: '#fff3e0', 
              padding: '8px', 
              borderRadius: '6px',
              border: '1px solid #ff9800'
            }}>
              <div style={{ fontSize: '20px', marginBottom: '4px' }}>❤️</div>
              <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#ff9800' }}>
                {safeWheelState.bonusFields || 0}
              </div>
              <div style={{ fontSize: '12px', color: '#666' }}>Bonus</div>
            </div>
          </div>
        </div>

        {/* Probability Display */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: '1fr 1fr', 
          gap: '8px',
          fontSize: '14px'
        }}>
          <div style={{ 
            padding: '8px',
            backgroundColor: '#e8f5e8',
            borderRadius: '4px',
            textAlign: 'center'
          }}>
            <div style={{ fontWeight: 'bold', color: '#4caf50' }}>
              {survivalChance}%
            </div>
            <div style={{ color: '#666', fontSize: '12px' }}>
              Survival
            </div>
          </div>
          
          <div style={{ 
            padding: '8px',
            backgroundColor: '#ffebee',
            borderRadius: '4px',
            textAlign: 'center'
          }}>
            <div style={{ fontWeight: 'bold', color: '#f44336' }}>
              {deathChance}%
            </div>
            <div style={{ color: '#666', fontSize: '12px' }}>
              Death
            </div>
          </div>
        </div>
      </div>

      {/* Current Player Info */}
      {currentPlayer && (
        <div style={{ 
          marginTop: '15px',
          padding: '12px',
          backgroundColor: currentPlayer.isAlive ? '#e3f2fd' : '#ffebee',
          borderRadius: '8px',
          border: `2px solid ${currentPlayer.isAlive ? '#2196f3' : '#f44336'}`
        }}>
          <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
            {currentPlayer.isAlive ? '🎯 Your Turn' : '💀 Eliminated'}
          </div>
          <div style={{ fontSize: '14px', color: '#666' }}>
            Lives: {currentPlayer.lives || 0} ❤️
            {currentPlayer.hasX2Active && (
              <span style={{ 
                marginLeft: '8px',
                color: '#f44336',
                fontWeight: 'bold'
              }}>
                | X2 RISK ACTIVE ⚡
              </span>
            )}
          </div>
        </div>
      )}

      {/* Wheel Warning */}
      {deathChance >= 50 && (
        <div style={{
          marginTop: '15px',
          padding: '10px',
          backgroundColor: '#fff3e0',
          border: '2px solid #ff9800',
          borderRadius: '8px',
          fontSize: '14px',
          color: '#ef6c00'
        }}>
          ⚠️ <strong>High Risk!</strong> The wheel is getting dangerous...
        </div>
      )}
    </div>
  );
};

export default DeathWheel;