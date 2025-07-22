import React, { useState } from 'react';

const DeathWheel = ({ wheelState, onSpin, canSpin, playerName }) => {
  const [spinning, setSpinning] = useState(false);

  const handleSpin = () => {
    if (!canSpin || spinning) return;
    
    setSpinning(true);
    onSpin();
    
    // Stop spinning animation after 2 seconds
    setTimeout(() => {
      setSpinning(false);
    }, 2000);
  };

  const getWheelDisplay = () => {
    const fields = [];
    
    // Add red fields (death)
    for (let i = 0; i < wheelState.redFields; i++) {
      fields.push({ type: 'death', color: '#f44336', symbol: '💀' });
    }
    
    // Add green fields (safe)
    for (let i = 0; i < wheelState.greenFields; i++) {
      fields.push({ type: 'safe', color: '#4caf50', symbol: '✅' });
    }
    
    // Add bonus fields if any
    for (let i = 0; i < (wheelState.bonusFields || 0); i++) {
      fields.push({ type: 'bonus', color: '#ff9800', symbol: '❤️' });
    }
    
    return fields;
  };

  const fields = getWheelDisplay();
  const totalFields = fields.length;

  return (
    <div style={{ textAlign: 'center', padding: '20px' }}>
      <h3>Death Wheel</h3>
      {playerName && <p>It's {playerName}'s turn to spin!</p>}
      
      <div style={{ 
        position: 'relative',
        width: '200px',
        height: '200px',
        margin: '20px auto',
        borderRadius: '50%',
        border: '4px solid #333',
        transform: spinning ? 'rotate(1440deg)' : 'rotate(0deg)',
        transition: spinning ? 'transform 2s ease-out' : 'none'
      }}>
        {fields.map((field, index) => {
          const angle = (360 / totalFields) * index;
          const nextAngle = (360 / totalFields) * (index + 1);
          
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
                backgroundColor: field.color,
                height: '98px'
              }}
            >
              <div style={{
                position: 'absolute',
                top: '70px',
                left: '10px',
                fontSize: '20px'
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
          width: '20px',
          height: '20px',
          backgroundColor: '#333',
          borderRadius: '50%',
          transform: 'translate(-50%, -50%)'
        }}></div>
        
        {/* Pointer */}
        <div style={{
          position: 'absolute',
          top: '-10px',
          left: '50%',
          width: '0',
          height: '0',
          borderLeft: '10px solid transparent',
          borderRight: '10px solid transparent',
          borderTop: '20px solid #333',
          transform: 'translateX(-50%)'
        }}></div>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <p>Current Wheel State:</p>
        <p>🔴 Death: {wheelState.redFields} | 🟢 Safe: {wheelState.greenFields} | ❤️ Bonus: {wheelState.bonusFields || 0}</p>
      </div>

      <button 
        onClick={handleSpin}
        disabled={!canSpin || spinning}
        style={{
          padding: '12px 24px',
          fontSize: '18px',
          backgroundColor: canSpin && !spinning ? '#f44336' : '#ccc',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: canSpin && !spinning ? 'pointer' : 'not-allowed'
        }}
      >
        {spinning ? 'Spinning...' : 'SPIN WHEEL'}
      </button>
    </div>
  );
};

export default DeathWheel;