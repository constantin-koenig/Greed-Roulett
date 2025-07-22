import React from 'react';

const RoundStatus = ({ lobby, currentRound, roundPhase, players }) => {
  const alivePlayers = players.filter(p => p.isAlive);
  const deadPlayers = players.filter(p => !p.isAlive);

  const getPhaseDescription = () => {
    switch (roundPhase) {
      case 'preparation':
        return 'Preparing for round...';
      case 'minigame':
        return 'Playing minigame (simulated)';
      case 'spinning':
        return 'Death wheel spinning phase';
      case 'results':
        return 'Round completed';
      default:
        return 'In progress...';
    }
  };

  const getGameModeDescription = () => {
    switch (lobby?.gameSettings?.gameMode) {
      case 'LastManStanding':
        return 'Last player standing wins!';
      case 'MoneyRush':
        return `Most money after ${lobby.gameSettings.maxRounds} rounds wins!`;
      case 'SurvivalScore':
        return 'Survival points determine the winner!';
      default:
        return '';
    }
  };

  return (
    <div style={{ 
      border: '2px solid #2196f3', 
      borderRadius: '8px', 
      padding: '20px', 
      backgroundColor: '#f3f9ff' 
    }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px', textAlign: 'center' }}>
        <div>
          <h3 style={{ margin: '0 0 10px 0', color: '#1976d2' }}>Round Info</h3>
          <p style={{ margin: '5px 0' }}>
            <strong>Round:</strong> {lobby?.currentRound || 1}
          </p>
          <p style={{ margin: '5px 0' }}>
            <strong>Phase:</strong> {getPhaseDescription()}
          </p>
          <p style={{ margin: '5px 0', fontSize: '12px', color: '#666' }}>
            {getGameModeDescription()}
          </p>
        </div>

        <div>
          <h3 style={{ margin: '0 0 10px 0', color: '#1976d2' }}>Players</h3>
          <p style={{ margin: '5px 0', color: '#4caf50' }}>
            <strong>Alive:</strong> {alivePlayers.length}
          </p>
          <p style={{ margin: '5px 0', color: '#f44336' }}>
            <strong>Eliminated:</strong> {deadPlayers.length}
          </p>
          <p style={{ margin: '5px 0' }}>
            <strong>Total:</strong> {players.length}
          </p>
        </div>

        <div>
          <h3 style={{ margin: '0 0 10px 0', color: '#1976d2' }}>Death Wheel</h3>
          <p style={{ margin: '5px 0' }}>
            🔴 <strong>{lobby?.deathWheel?.redFields || 1}</strong> Death
          </p>
          <p style={{ margin: '5px 0' }}>
            🟢 <strong>{lobby?.deathWheel?.greenFields || 4}</strong> Safe
          </p>
          <p style={{ margin: '5px 0' }}>
            ❤️ <strong>{lobby?.deathWheel?.bonusFields || 0}</strong> Bonus
          </p>
        </div>
      </div>

      {alivePlayers.length <= 1 && lobby?.gameSettings?.gameMode === 'LastManStanding' && (
        <div style={{ 
          marginTop: '15px', 
          padding: '15px', 
          backgroundColor: '#4caf50', 
          color: 'white', 
          borderRadius: '4px', 
          textAlign: 'center' 
        }}>
          <h3 style={{ margin: 0 }}>
            🏆 {alivePlayers[0]?.name || 'No one'} Wins!
          </h3>
        </div>
      )}
    </div>
  );
};

export default RoundStatus;