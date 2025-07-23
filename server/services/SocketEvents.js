// server/services/SocketEvents.js - Updated with Death Wheel Phase Management
const { Player, Lobby, GameRound } = require('../models');
const GameEngine = require('./GameEngine');
const DeathWheel = require('./DeathWheel');
const { setupReflexClickHandlers } = require('./ReflexClickMinigame');

class SocketEvents {
  constructor(io) {
    this.io = io;
    this.gameEngine = new GameEngine();
    this.deathWheel = new DeathWheel();
    this.roomGames = new Map(); // Store minigames per room
    this.deathWheelQueues = new Map(); // NEW: Track death wheel spinning queues per lobby
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
    
    // NEW: Death Wheel Management
    socket.on('startDeathWheelPhase', this.handleStartDeathWheelPhase.bind(this, socket));
    
    // Setup Reflex Click Minigame Handlers with enhanced callback
    this.setupEnhancedReflexClickHandlers(socket);
    
    // Connection Events
    socket.on('disconnect', this.handleDisconnect.bind(this, socket));
  }

  // Enhanced Reflex Click handlers that trigger death wheel phase
  setupEnhancedReflexClickHandlers(socket) {
    setupReflexClickHandlers(this.io, socket, this.roomGames);
    
    // Listen for minigame completion to start death wheel
    socket.on('minigameComplete', async (data) => {
      try {
        const { roomId, type, losers, winnerId } = data;
        
        if (type === 'reflexClick') {
          // Wait a moment for scoreboard, then start death wheel phase
          setTimeout(async () => {
            await this.startDeathWheelForLosers(roomId, losers, winnerId);
          }, 5000); // 5 second delay for scoreboard viewing
        }
      } catch (error) {
        console.error('Error handling minigame completion:', error);
      }
    });
  }

  // NEW: Start death wheel phase for minigame losers
  async startDeathWheelForLosers(lobbyCode, loserIds, winnerId) {
    try {
      const lobby = await Lobby.findOne({ code: lobbyCode }).populate('players');
      if (!lobby) return;

      // Get alive players who lost the minigame
      const losers = lobby.players.filter(p => 
        loserIds.includes(p._id.toString()) && p.isAlive
      );

      if (losers.length === 0) {
        // No losers to spin, proceed to next round
        this.io.to(lobbyCode).emit('roundEnd', { message: 'No players need to spin' });
        return;
      }

      // Set up death wheel queue for this lobby
      this.deathWheelQueues.set(lobby._id.toString(), {
        queue: losers.map(p => p._id.toString()),
        currentSpinner: losers[0]._id.toString(),
        completed: []
      });

      // Notify all players about death wheel phase
      this.io.to(lobbyCode).emit('deathWheelPhase', {
        losers: losers.map(p => p._id.toString()),
        currentSpinner: losers[0]._id.toString(),
        total: losers.length,
        message: `${losers.length} player${losers.length > 1 ? 's' : ''} must face the death wheel!`
      });

      console.log(`Death wheel phase started for lobby ${lobbyCode}. Losers: ${losers.length}`);
    } catch (error) {
      console.error('Error starting death wheel phase:', error);
    }
  }

  // NEW: Handle manual death wheel phase start (skip minigame)
  async handleStartDeathWheelPhase(socket) {
    try {
      const player = await Player.findById(socket.playerId);
      if (!player || !player.isHost) {
        socket.emit('error', { message: 'Only host can start death wheel phase' });
        return;
      }

      const lobby = await Lobby.findById(player.lobbyId).populate('players');
      const alivePlayers = lobby.players.filter(p => p.isAlive);

      if (alivePlayers.length === 0) {
        socket.emit('error', { message: 'No alive players to spin' });
        return;
      }

      // Set up death wheel queue for all alive players
      this.deathWheelQueues.set(lobby._id.toString(), {
        queue: alivePlayers.map(p => p._id.toString()),
        currentSpinner: alivePlayers[0]._id.toString(),
        completed: []
      });

      // Notify all players
      this.io.to(socket.lobbyCode).emit('deathWheelPhase', {
        losers: alivePlayers.map(p => p._id.toString()),
        currentSpinner: alivePlayers[0]._id.toString(),
        total: alivePlayers.length,
        message: `All ${alivePlayers.length} players must face the death wheel!`
      });

      console.log(`Manual death wheel phase started for lobby ${socket.lobbyCode}`);
    } catch (error) {
      socket.emit('error', { message: 'Failed to start death wheel phase', error: error.message });
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

      // Check if player is in current death wheel queue
      const lobbyQueue = this.deathWheelQueues.get(lobby._id.toString());
      if (lobbyQueue && lobbyQueue.currentSpinner !== player._id.toString()) {
        socket.emit('error', { message: 'Not your turn to spin!' });
        return;
      }

      // NEW: Notify all players that spinning has started
      this.io.to(socket.lobbyCode).emit('spinStarted', {
        playerId: player._id,
        playerName: player.name,
        message: `${player.name} is spinning the wheel!`
      });

      // Simulate spinning delay (2-4 seconds for drama)
      const spinDelay = 2000 + Math.random() * 2000;
      
      setTimeout(async () => {
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

        // Update death wheel state (make it more dangerous)
        if (result === 'safe' || result === 'bonus') {
          // Remove one green field and add one red field
          if (lobby.deathWheel.greenFields > 1) {
            lobby.deathWheel.greenFields--;
            lobby.deathWheel.redFields++;
          }
        }
        await lobby.save();
        
        const spinData = {
          playerId: player._id,
          playerName: player.name,
          result: result,
          livesLost: livesLost,
          newLives: player.lives,
          isAlive: player.isAlive,
          deathWheelState: lobby.deathWheel,
          spinnerName: player.name
        };
        
        // NEW: Send result to ALL players in the room
        this.io.to(socket.lobbyCode).emit('spinResult', spinData);

        // Update death wheel queue
        if (lobbyQueue) {
          lobbyQueue.completed.push(player._id.toString());
          lobbyQueue.queue = lobbyQueue.queue.filter(id => id !== player._id.toString());
          
          if (lobbyQueue.queue.length > 0) {
            // Move to next spinner
            const nextSpinnerId = lobbyQueue.queue[0];
            const nextSpinner = await Player.findById(nextSpinnerId);
            lobbyQueue.currentSpinner = nextSpinnerId;
            
            // NEW: Notify about next spinner with delay
            setTimeout(() => {
              this.io.to(socket.lobbyCode).emit('nextSpinner', {
                currentSpinner: nextSpinnerId,
                currentSpinnerName: nextSpinner?.name || 'Unknown',
                remaining: lobbyQueue.queue.length,
                message: `${nextSpinner?.name || 'Next player'}'s turn to spin!`
              });
            }, 3000); // 3 second delay to show result
          } else {
            // All spins complete
            this.deathWheelQueues.delete(lobby._id.toString());
            
            setTimeout(() => {
              this.io.to(socket.lobbyCode).emit('deathWheelComplete', {
                message: 'Death wheel phase complete!'
              });
              
              // Check if round/game should end
              this.gameEngine.checkRoundEnd(lobby);
            }, 3000);
          }
        }
      }, spinDelay);
      
    } catch (error) {
      socket.emit('error', { message: 'Failed to spin wheel', error: error.message });
    }
  }

  // [Keep all existing methods unchanged...]
  
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
        // Delete empty lobby and cleanup
        await Lobby.findByIdAndDelete(lobby._id);
        await Player.deleteMany({ lobbyId: lobby._id });
        
        // Cleanup minigames and death wheel queues
        if (this.roomGames.has(socket.lobbyCode)) {
          const gamesMap = this.roomGames.get(socket.lobbyCode);
          gamesMap.forEach(game => {
            if (game.cleanup) game.cleanup();
          });
          this.roomGames.delete(socket.lobbyCode);
        }
        this.deathWheelQueues.delete(lobby._id.toString());
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
    
    // Remove player from minigames and death wheel queues
    if (socket.playerId && socket.lobbyCode) {
      const roomGamesMap = this.roomGames.get(socket.lobbyCode);
      if (roomGamesMap) {
        roomGamesMap.forEach(game => {
          if (game.removePlayer) {
            game.removePlayer(socket.playerId);
          }
        });
      }
      
      // Remove from death wheel queue if present
      this.deathWheelQueues.forEach((queue, lobbyId) => {
        if (queue.currentSpinner === socket.playerId) {
          // Move to next spinner
          queue.queue = queue.queue.filter(id => id !== socket.playerId);
          if (queue.queue.length > 0) {
            queue.currentSpinner = queue.queue[0];
          }
        } else {
          queue.queue = queue.queue.filter(id => id !== socket.playerId);
        }
      });
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