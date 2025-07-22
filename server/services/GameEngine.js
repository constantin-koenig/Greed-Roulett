const { Player, Lobby, GameRound } = require('../models');

class GameEngine {
  async startNewRound(lobby) {
    const alivePlayers = await Player.find({ 
      lobbyId: lobby._id, 
      isAlive: true 
    });
    
    const gameRound = new GameRound({
      lobbyId: lobby._id,
      roundNumber: lobby.currentRound,
      roundType: 'minigame',
      participatingPlayers: alivePlayers.map(p => p._id),
      deathWheelState: { ...lobby.deathWheel }
    });
    
    await gameRound.save();
    
    // Simulate minigame result (random losers for now)
    const loserCount = Math.floor(Math.random() * Math.min(alivePlayers.length, 3)) + 1;
    const shuffled = [...alivePlayers].sort(() => 0.5 - Math.random());
    const losers = shuffled.slice(0, loserCount);
    
    gameRound.losers = losers.map(p => p._id);
    gameRound.phase = 'spinning';
    await gameRound.save();
    
    return gameRound;
  }
  
  async checkRoundEnd(lobby) {
    const alivePlayers = await Player.find({ 
      lobbyId: lobby._id, 
      isAlive: true 
    });
    
    if (alivePlayers.length <= 1 && lobby.gameSettings.gameMode === 'LastManStanding') {
      await this.endGame(lobby, alivePlayers[0] || null);
    } else if (lobby.currentRound >= lobby.gameSettings.maxRounds && lobby.gameSettings.gameMode === 'MoneyRush') {
      const winner = await this.getMoneyWinner(lobby);
      await this.endGame(lobby, winner);
    }
  }
  
  async endGame(lobby, winner) {
    lobby.gameState = 'Ended';
    await lobby.save();
    
    // Emit game end event with winner
    // This would be handled by the socket system
  }
  
  async getMoneyWinner(lobby) {
    const players = await Player.find({ lobbyId: lobby._id }).sort({ money: -1 });
    return players[0];
  }
}

module.exports = GameEngine;
