// client/src/components/Game/PhaseIndicators.jsx
import React from 'react';

const PhaseIndicators = ({ roundPhase, isHost }) => {
  if (roundPhase === 'preparation' && isHost) {
    return (
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
    );
  }

  if (roundPhase === 'preparation' && !isHost) {
    return (
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
    );
  }

  if (roundPhase === 'minigame') {
    return (
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
    );
  }

  return null;
};

export default PhaseIndicators;