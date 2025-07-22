// server/services/SocketEvents.js
const { Player, Lobby, GameRound } = require('../models');
const GameEngine = require('./GameEngine');
const DeathWheel = require('./DeathWheel');

class SocketEvents {
  constructor(io) {
    this.io = io;
    this.gameEngine = new GameEngine();
    this.deathWheel = new DeathWheel();
  }

  handleConnection(socket) {
    console.log(`User connected: ${socket.id}`);

    // Lobby Events
    socket.on('createLobby', this.handleCreateLobby.bind(this, socket));
    socket.on('joinLobby', this.handleJoinLobby.bind(this, socket));
    socket.on('leaveLobby', this.handleLeaveLobby.bind(this, socket));
    socket.on('updateGameSettings', this.handleUpdateGameSettings.bind(this, socket));
    
    // Game Events
    socket.on('startGame', this.handleStartGame.bind(this, socket));
    socket.on('activateX2', this.handleActivateX2.bind(this, socket));
    socket.on('playerSpin', this.handlePlayerSpin.bind(this, socket));
    socket.on('readyNextRound', this.handleReadyNextRound.bind(this, socket));
    
    // Connection Events
    socket.on('disconnect', this.handleDisconnect.bind(this, socket));
  }

  async handleCreateLobby(socket, data) {
    try {
      const { playerName, lobbyName, gameSettings } = data;
      
      // Generate unique lobby code
      const lobbyCode = Math.random().toString(36).substr(2, 6).toUpperCase();
      
      // Create lobby
      const lobby = new Lobby({
        name: lobbyName,
        code: lobbyCode,
        gameSettings: gameSettings || {}
      });
      
      // Create host player
      const player = new Player({
        name: playerName,
        socketId: socket.id,
        lobbyId: lobby._id,
        isHost: true,
        lives: lobby.gameSettings.startLives
      });
      
      lobby.hostId = player._id;
      lobby.players.push(player._id);
      
      await lobby.save();
      await player.save();
      
      // Join socket room
      socket.join(lobbyCode);
      socket.playerId = player._id;
      socket.lobbyCode = lobbyCode;
      
      socket.emit('lobbyCreated', {
        lobby: await this.getLobbyData(lobby),
        playerId: player._id
      });
      
    } catch (error) {
      socket.emit('error', { message: 'Failed to create lobby', error: error.message });
    }
  }

  async handleJoinLobby(socket, data) {
    try {
      const { playerName, lobbyCode } = data;
      
      const lobby = await Lobby.findOne({ code: lobbyCode }).populate('players');
      if (!lobby) {
        socket.emit('error', { message: 'Lobby not found' });
        return;
      }
      
      if (lobby.gameState !== 'Waiting') {
        socket.emit('error', { message: 'Game already in progress' });
        return;
      }
      
      if (lobby.players.length >= lobby.maxPlayers) {
        socket.emit('error', { message: 'Lobby is full' });
        return;
      }
      
      // Create player
      const player = new Player({
        name: playerName,
        socketId: socket.id,
        lobbyId: lobby._id,
        lives: lobby.gameSettings.startLives
      });
      
      lobby.players.push(player._id);
      await lobby.save();
      await player.save();
      
      socket.join(lobbyCode);
      socket.playerId = player._id;
      socket.lobbyCode = lobbyCode;
      
      const lobbyData = await this.getLobbyData(lobby);
      
      socket.emit('lobbyJoined', { lobby: lobbyData, playerId: player._id });
      socket.to(lobbyCode).emit('playerJoined', { player, lobby: lobbyData });
      
    } catch (error) {
      socket.emit('error', { message: 'Failed to join lobby', error: error.message });
    }
  }

  async handleLeaveLobby(socket) {
    try {
      if (!socket.playerId) return;
      
      const player = await Player.findById(socket.playerId);
      if (!player) return;
      
      const lobby = await Lobby.findById(player.lobbyId).populate('players');
      if (!lobby) return;
      
      // Remove player from lobby
      lobby.players = lobby.players.filter(p => !p._id.equals(player._id));
      
      if (lobby.players.length === 0) {
        // Delete empty lobby
        await Lobby.findByIdAndDelete(lobby._id);
        await Player.deleteMany({ lobbyId: lobby._id });
      } else if (player.isHost) {
        // Transfer host to another player
        const newHost = lobby.players[0];
        newHost.isHost = true;
        lobby.hostId = newHost._id;
        await newHost.save();
      }
      
      await lobby.save();
      await Player.findByIdAndDelete(player._id);
      
      socket.leave(socket.lobbyCode);
      socket.to(socket.lobbyCode).emit('playerLeft', { 
        playerId: player._id, 
        lobby: await this.getLobbyData(lobby)
      });
      
    } catch (error) {
      console.error('Error leaving lobby:', error);
    }
  }

  async handleStartGame(socket) {
    try {
      const player = await Player.findById(socket.playerId);
      if (!player || !player.isHost) {
        socket.emit('error', { message: 'Only host can start the game' });
        return;
      }
      
      const lobby = await Lobby.findById(player.lobbyId).populate('players');
      if (lobby.players.length < 2) {
        socket.emit('error', { message: 'Need at least 2 players to start' });
        return;
      }
      
      lobby.gameState = 'InProgress';
      lobby.currentRound = 1;
      await lobby.save();
      
      const firstRound = await this.gameEngine.startNewRound(lobby);
      
      this.io.to(socket.lobbyCode).emit('gameStarted', {
        lobby: await this.getLobbyData(lobby),
        currentRound: firstRound
      });
      
    } catch (error) {
      socket.emit('error', { message: 'Failed to start game', error: error.message });
    }
  }

  async handleUpdateGameSettings(socket, data) {
    try {
      const player = await Player.findById(socket.playerId);
      if (!player || !player.isHost) {
        socket.emit('error', { message: 'Only host can update game settings' });
        return;
      }
      
      const lobby = await Lobby.findById(player.lobbyId);
      if (lobby.gameState !== 'Waiting') {
        socket.emit('error', { message: 'Cannot change settings during game' });
        return;
      }
      
      // Update game settings
      lobby.gameSettings = { ...lobby.gameSettings, ...data };
      await lobby.save();
      
      const lobbyData = await this.getLobbyData(lobby);
      
      // Notify all players in lobby
      this.io.to(socket.lobbyCode).emit('gameSettingsUpdated', {
        lobby: lobbyData
      });
      
    } catch (error) {
      socket.emit('error', { message: 'Failed to update settings', error: error.message });
    }
  }

  async handleActivateX2(socket) {
    try {
      const player = await Player.findById(socket.playerId);
      if (!player || !player.isAlive) return;
      
      const lobby = await Lobby.findById(player.lobbyId);
      if (!lobby.gameSettings.x2RiskAllowed) {
        socket.emit('error', { message: 'X2 risk not allowed in this lobby' });
        return;
      }
      
      player.hasX2Active = !player.hasX2Active;
      await player.save();
      
      socket.to(socket.lobbyCode).emit('playerX2Updated', {
        playerId: player._id,
        hasX2Active: player.hasX2Active
      });
      
      socket.emit('x2Updated', { hasX2Active: player.hasX2Active });
      
    } catch (error) {
      socket.emit('error', { message: 'Failed to toggle X2', error: error.message });
    }
  }

  async handleReadyNextRound(socket) {
    try {
      const player = await Player.findById(socket.playerId);
      if (!player) return;
      
      // Logic for handling ready state for next round
      // This can be expanded based on game requirements
      
      socket.emit('readyStateUpdated', { ready: true });
      
    } catch (error) {
      socket.emit('error', { message: 'Failed to update ready state', error: error.message });
    }
  }

  async handlePlayerSpin(socket) {
    try {
      const player = await Player.findById(socket.playerId);
      if (!player || !player.isAlive) return;
      
      const lobby = await Lobby.findById(player.lobbyId);
      const result = this.deathWheel.spin(lobby.deathWheel);
      
      // Update death wheel - make it more dangerous
      if (lobby.deathWheel.greenFields > 0) {
        lobby.deathWheel.greenFields--;
        lobby.deathWheel.redFields++;
      }
      
      // Process spin result
      let livesLost = 0;
      if (result === 'death') {
        livesLost = player.hasX2Active ? 2 : 1;
        player.lives = Math.max(0, player.lives - livesLost);
        if (player.lives === 0) {
          player.isAlive = false;
        }
      } else if (result === 'bonus') {
        player.lives++;
      }
      
      // Add to spin history
      player.spinHistory.push({
        round: lobby.currentRound,
        result: result
      });
      
      // Reset X2 after spin
      player.hasX2Active = false;
      
      await player.save();
      await lobby.save();
      
      const spinData = {
        playerId: player._id,
        result: result,
        livesLost: livesLost,
        newLives: player.lives,
        isAlive: player.isAlive,
        deathWheelState: lobby.deathWheel
      };
      
      this.io.to(socket.lobbyCode).emit('spinResult', spinData);
      
      // Check if round/game should end
      await this.gameEngine.checkRoundEnd(lobby);
      
    } catch (error) {
      socket.emit('error', { message: 'Failed to spin wheel', error: error.message });
    }
  }

  async handleDisconnect(socket) {
    console.log(`User disconnected: ${socket.id}`);
    await this.handleLeaveLobby(socket);
  }

  async getLobbyData(lobby) {
    const populatedLobby = await Lobby.findById(lobby._id)
      .populate('players')
      .populate('hostId');
    
    return {
      _id: populatedLobby._id,
      name: populatedLobby.name,
      code: populatedLobby.code,
      gameState: populatedLobby.gameState,
      currentRound: populatedLobby.currentRound,
      gameSettings: populatedLobby.gameSettings,
      deathWheel: populatedLobby.deathWheel,
      players: populatedLobby.players.map(p => ({
        _id: p._id,
        name: p.name,
        lives: p.lives,
        money: p.money,
        isAlive: p.isAlive,
        isHost: p.isHost,
        hasX2Active: p.hasX2Active
      })),
      host: populatedLobby.hostId
    };
  }
}

module.exports = SocketEvents;