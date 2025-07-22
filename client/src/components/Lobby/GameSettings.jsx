import React from 'react';

const GameSettings = ({ settings, onUpdateSettings, isHost }) => {
  const handleSettingChange = (key, value) => {
    if (!isHost) return;
    
    const newSettings = { ...settings, [key]: value };
    onUpdateSettings(newSettings);
  };

  const gameModes = [
    { value: 'LastManStanding', label: 'Last Man Standing' },
    { value: 'MoneyRush', label: 'Money Rush' },
    { value: 'SurvivalScore', label: 'Survival Score' }
  ];

  return (
    <div style={{ border: '1px solid #ddd', borderRadius: '4px', padding: '15px' }}>
      {!isHost && (
        <p style={{ color: '#666', marginBottom: '15px', fontStyle: 'italic' }}>
          Only the host can change settings
        </p>
      )}
      
      <div style={{ display: 'grid', gap: '12px' }}>
        <div>
          <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>
            Game Mode:
          </label>
          <select 
            value={settings.gameMode || 'LastManStanding'}
            onChange={(e) => handleSettingChange('gameMode', e.target.value)}
            disabled={!isHost}
            style={{ width: '100%', padding: '4px', border: '1px solid #ccc' }}
          >
            {gameModes.map(mode => (
              <option key={mode.value} value={mode.value}>
                {mode.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>
            Max Rounds:
          </label>
          <input 
            type="number" 
            value={settings.maxRounds || 10}
            onChange={(e) => handleSettingChange('maxRounds', parseInt(e.target.value))}
            disabled={!isHost}
            min="1"
            max="50"
            style={{ width: '100%', padding: '4px', border: '1px solid #ccc' }}
          />
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>
            Starting Lives:
          </label>
          <input 
            type="number" 
            value={settings.startLives || 5}
            onChange={(e) => handleSettingChange('startLives', parseInt(e.target.value))}
            disabled={!isHost}
            min="1"
            max="10"
            style={{ width: '100%', padding: '4px', border: '1px solid #ccc' }}
          />
        </div>

        <div>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input 
              type="checkbox" 
              checked={settings.gamblingAllowed !== false}
              onChange={(e) => handleSettingChange('gamblingAllowed', e.target.checked)}
              disabled={!isHost}
            />
            <span>Allow Gambling Rounds</span>
          </label>
        </div>

        <div>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input 
              type="checkbox" 
              checked={settings.x2RiskAllowed !== false}
              onChange={(e) => handleSettingChange('x2RiskAllowed', e.target.checked)}
              disabled={!isHost}
            />
            <span>Allow X2 Risk Mechanic</span>
          </label>
        </div>
      </div>

      <div style={{ marginTop: '15px', padding: '10px', backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
        <h4 style={{ margin: '0 0 8px 0' }}>Death Wheel Start:</h4>
        <p style={{ margin: '4px 0', fontSize: '14px' }}>🔴 Red Fields: 1</p>
        <p style={{ margin: '4px 0', fontSize: '14px' }}>🟢 Green Fields: 4</p>
        <p style={{ margin: '4px 0', fontSize: '12px', color: '#666' }}>
          Each spin makes the wheel more dangerous!
        </p>
      </div>
    </div>
  );
};

export default GameSettings;