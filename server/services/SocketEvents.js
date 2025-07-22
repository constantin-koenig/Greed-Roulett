// server/services/SocketEvents.js - Updated with Reflex Click Integration
const { Player, Lobby, GameRound } = require('../models');
const GameEngine = require('./GameEngine');
const DeathWheel = require('./DeathWheel');
const { setupReflexClickHandlers } = require('./ReflexClickMinigame');

class SocketEvents {
  constructor(io) {
    this.io = io;
    this.gameEngine = new GameEngine();
    this.deathWheel = new DeathWheel();
    this.roomGames = new Map(); // NEW: Store minigames per room
  }

  handleConnection(socket) {
    console.log(`User connected: ${socket.id}`);

    // Existing Lobby Events
    socket.on('createLobby', this.handleCreateLobby.bind(this, socket));
    socket.on('joinLobby', this.handleJoinLobby.bind(this, socket));
    socket.on('leaveLobby', this.handleLeaveLobby.bind(this, socket));
    socket.on('updateGameSettings', this.handleUpdateGameSettings.bind(this, socket));
    
    // Existing Game Events
    socket.on('startGame', this.handleStartGame.bind(this, socket));
    socket.on('activateX2', this.handleActivateX2.bind(this, socket));
    socket.on('playerSpin', this.handlePlayerSpin.bind(this, socket));
    socket.on('readyNextRound', this.handleReadyNextRound.bind(this, socket));
    
    // NEW: Setup Reflex Click Minigame Handlers
    setupReflexClickHandlers(this.io, socket, this.roomGames);
    
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
        // Delete empty lobby and cleanup minigames
        await Lobby.findByIdAndDelete(lobby._id);
        await Player.deleteMany({ lobbyId: lobby._id });
        
        // NEW: Cleanup any active minigames for this room
        if (this.roomGames.has(socket.lobbyCode)) {
          const gamesMap = this.roomGames.get(socket.lobbyCode);
          gamesMap.forEach(game => {
            if (game.cleanup) game.cleanup();
          });
          this.roomGames.delete(socket.lobbyCode);
        }
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
      
      this.io.to(socket.lobbyCode).emit('gameSettingsUpdated', { 
        gameSettings: lobby.gameSettings,
        lobby: lobbyData
      });
      
    } catch (error) {
      socket.emit('error', { message: 'Failed to update settings', error: error.message });
    }
  }

  async handleActivateX2(socket) {
    try {
      const player = await Player.findById(socket.playerId);
      if (!player) return;
      
      const lobby = await Lobby.findById(player.lobbyId);
      if (lobby.gameState !== 'InProgress') {
        socket.emit('error', { message: 'Game not in progress' });
        return;
      }
      
      if (!lobby.gameSettings.x2RiskAllowed) {
        socket.emit('error', { message: 'X2 risk not allowed in this game' });
        return;
      }
      
      player.hasX2Active = !player.hasX2Active;
      await player.save();
      
      this.io.to(socket.lobbyCode).emit('playerX2Updated', {
        playerId: player._id,
        hasX2Active: player.hasX2Active
      });
      
    } catch (error) {
      socket.emit('error', { message: 'Failed to toggle X2', error: error.message });
    }
  }

  async handlePlayerSpin(socket) {
    try {
      const player = await Player.findById(socket.playerId);
      if (!player || !player.isAlive) {
        socket.emit('error', { message: 'Player cannot spin' });
        return;
      }
      
      const lobby = await Lobby.findById(player.lobbyId);
      if (lobby.gameState !== 'InProgress') {
        socket.emit('error', { message: 'Game not in progress' });
        return;
      }
      
      // Spin the death wheel
      const result = this.deathWheel.spin(lobby.deathWheel);
      
      // Calculate lives lost
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

  async handleReadyNextRound(socket) {
    try {
      const player = await Player.findById(socket.playerId);
      if (!player) return;
      
      player.isReadyForNextRound = true;
      await player.save();
      
      const lobby = await Lobby.findById(player.lobbyId).populate('players');
      const alivePlayers = lobby.players.filter(p => p.isAlive);
      const readyPlayers = alivePlayers.filter(p => p.isReadyForNextRound);
      
      this.io.to(socket.lobbyCode).emit('playerReady', {
        playerId: player._id,
        readyCount: readyPlayers.length,
        totalAlive: alivePlayers.length
      });
      
      // Start next round if all alive players are ready
      if (readyPlayers.length === alivePlayers.length && alivePlayers.length > 1) {
        await this.gameEngine.startNewRound(lobby);
      }
      
    } catch (error) {
      socket.emit('error', { message: 'Failed to ready up', error: error.message });
    }
  }

  async handleDisconnect(socket) {
    console.log(`User disconnected: ${socket.id}`);
    
    // NEW: Remove player from any active minigames
    if (socket.playerId && socket.lobbyCode) {
      const roomGamesMap = this.roomGames.get(socket.lobbyCode);
      if (roomGamesMap) {
        roomGamesMap.forEach(game => {
          if (game.removePlayer) {
            game.removePlayer(socket.playerId);
          }
        });
      }
    }
    
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