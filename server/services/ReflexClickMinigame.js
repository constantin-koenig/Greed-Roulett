// server/services/ReflexClickMinigame.js - Enhanced with Death Wheel Integration
// Reflex Click Minigame Server Logic for Greed Roulette

class ReflexClickGame {
  constructor(io, roomId) {
    this.io = io;
    this.roomId = roomId;
    this.gameState = 'waiting'; // 'waiting', 'countdown', 'active', 'finished'
    this.players = new Map(); // playerId -> { id, socketId, hasClicked, points, roundResults }
    this.currentRound = 1;
    this.maxRounds = 3;
    this.roundWinners = []; // Store winners of each round
    this.gameTimeout = null;
    this.enableTimeout = null;
    this.roundStartTime = null;
    this.overallWinner = null;
    this.finalResults = null;
  }

  // Spieler zum Spiel hinzufügen
  addPlayer(playerId, socketId) {
    this.players.set(playerId, {
      id: playerId,
      socketId: socketId,
      hasClicked: false,
      points: 0,
      roundResults: [], // Track results for each round
      eliminatedInRound: null
    });
  }

  // Spieler aus dem Spiel entfernen
  removePlayer(playerId) {
    this.players.delete(playerId);
  }

  // Minigame starten
  startGame() {
    if (this.gameState !== 'waiting') {
      return false;
    }

    this.currentRound = 1;
    this.roundWinners = [];
    this.overallWinner = null;
    this.finalResults = null;
    
    // Reset all players
    this.players.forEach(player => {
      player.hasClicked = false;
      player.points = 0;
      player.roundResults = [];
      player.eliminatedInRound = null;
    });

    // Sende initial game started event
    this.io.to(this.roomId).emit('minigameStarted', {
      type: 'reflexClick',
      message: 'Reflex Click Challenge started! Get ready for 3 rounds...',
      maxRounds: this.maxRounds
    });

    // Starte erste Runde nach kurzer Verzögerung
    setTimeout(() => {
      this.startRound();
    }, 2000);

    return true;
  }

  // Neue Runde starten
  startRound() {
    if (this.currentRound > this.maxRounds) {
      this.endGame();
      return;
    }

    // Reset für neue Runde
    this.gameState = 'countdown';
    this.players.forEach(player => {
      if (!player.eliminatedInRound) { // Nur aktive Spieler
        player.hasClicked = false;
      }
    });

    // Benachrichtige alle Spieler über Rundenbeginn
    this.io.to(this.roomId).emit('roundStarted', {
      type: 'reflexClick',
      round: this.currentRound,
      maxRounds: this.maxRounds,
      message: `Round ${this.currentRound}/${this.maxRounds}: Get ready! Click when the button becomes active!`
    });

    console.log(`Sending roundStarted event for round ${this.currentRound}`);

    // Zufällige Verzögerung zwischen 1-5 Sekunden
    const delay = Math.random() * 4000 + 1000; // 1000-5000ms

    console.log(`Reflex Click Round ${this.currentRound} starting in ${Math.round(delay)}ms`);

    this.enableTimeout = setTimeout(() => {
      this.enableClick();
    }, delay);

    // Timeout nach 10 Sekunden falls niemand klickt
    this.gameTimeout = setTimeout(() => {
      this.endRound(null);
    }, delay + 10000);
  }

  // Button aktivieren
  enableClick() {
    if (this.gameState !== 'countdown') {
      return;
    }

    this.gameState = 'active';
    this.roundStartTime = Date.now();
    
    // Button für alle aktivieren
    this.io.to(this.roomId).emit('enableClick', {
      timestamp: this.roundStartTime,
      round: this.currentRound
    });

    console.log(`Sending enableClick event for round ${this.currentRound}`);
  }

  // Klick-Versuch verarbeiten
  handleClickAttempt(playerId, socketId, clickTime) {
    const player = this.players.get(playerId);
    
    if (!player || player.socketId !== socketId) {
      return false;
    }

    // Prüfe ob Spieler bereits eliminiert ist
    if (player.eliminatedInRound) {
      return false;
    }

    // Prüfe Spielstatus
    if (this.gameState === 'countdown') {
      // Zu früh geklickt - Spieler wird eliminiert
      player.hasClicked = true;
      player.eliminatedInRound = this.currentRound;
      player.roundResults.push({
        round: this.currentRound,
        result: 'eliminated',
        reason: 'tooEarly',
        reactionTime: null
      });

      this.io.to(socketId).emit('clickTooEarly', {
        message: 'Too early! You are eliminated from this minigame.',
        round: this.currentRound
      });
      
      console.log(`Player ${playerId} eliminated in round ${this.currentRound} for clicking too early`);
      return false;
    }

    if (this.gameState !== 'active') {
      return false;
    }

    if (player.hasClicked) {
      return false; // Bereits geklickt
    }

    // Gültiger Klick!
    player.hasClicked = true;
    const reactionTime = clickTime ? clickTime - this.roundStartTime : null;
    
    // Prüfe ob das der erste Klick in dieser Runde ist
    const roundWinner = this.roundWinners.find(w => w.round === this.currentRound);
    if (!roundWinner) {
      // Erster Klick = Rundengewinner
      this.roundWinners.push({
        round: this.currentRound,
        playerId: playerId,
        reactionTime: reactionTime
      });
      
      player.points += 3; // 3 Punkte für Rundensieg
      player.roundResults.push({
        round: this.currentRound,
        result: 'winner',
        reactionTime: reactionTime
      });
      
      this.endRound(playerId);
      console.log(`Player ${playerId} won round ${this.currentRound} with ${reactionTime}ms!`);
    } else {
      // Zu spät - kein Gewinn aber auch nicht eliminiert
      player.roundResults.push({
        round: this.currentRound,
        result: 'late',
        reactionTime: reactionTime
      });
    }

    return true;
  }

  // Runde beenden
  endRound(roundWinnerId) {
    // Timeouts clearen
    if (this.enableTimeout) {
      clearTimeout(this.enableTimeout);
      this.enableTimeout = null;
    }
    if (this.gameTimeout) {
      clearTimeout(this.gameTimeout);
      this.gameTimeout = null;
    }

    // Runden-Ergebnis senden
    const roundResult = {
      type: 'reflexClick',
      round: this.currentRound,
      maxRounds: this.maxRounds,
      roundWinnerId: roundWinnerId,
      allPlayerResults: this.getRoundPlayerResults(),
      message: roundWinnerId ? `Round ${this.currentRound} Winner: Player ${roundWinnerId}!` : `Round ${this.currentRound}: No winner - time ran out!`
    };

    this.io.to(this.roomId).emit('roundResult', roundResult);

    // Zur nächsten Runde oder Spiel beenden
    this.currentRound++;
    
    if (this.currentRound <= this.maxRounds) {
      // Kurze Pause zwischen Runden
      setTimeout(() => {
        this.startRound();
      }, 2000);
    } else {
      // Spiel ist zu Ende
      setTimeout(() => {
        this.endGame();
      }, 3000);
    }

    console.log(`Round ${this.currentRound - 1} ended. Winner: ${roundWinnerId || 'none'}`);
  }

  // Spiel beenden
  endGame() {
    this.gameState = 'finished';

    // Timeouts clearen
    if (this.enableTimeout) {
      clearTimeout(this.enableTimeout);
      this.enableTimeout = null;
    }
    if (this.gameTimeout) {
      clearTimeout(this.gameTimeout);
      this.gameTimeout = null;
    }

    // Berechne Gesamtsieger (meiste Punkte)
    let overallWinner = null;
    let maxPoints = 0;
    
    this.players.forEach((player, playerId) => {
      if (player.points > maxPoints) {
        maxPoints = player.points;
        overallWinner = playerId;
      }
    });

    this.overallWinner = overallWinner;
    this.finalResults = this.getFinalPlayerResults();

    // Finale Ergebnisse senden
    const finalResult = {
      type: 'reflexClick',
      winnerId: overallWinner,
      maxPoints: maxPoints,
      allPlayerIds: Array.from(this.players.keys()),
      playerResults: this.finalResults,
      roundWinners: this.roundWinners,
      message: overallWinner ? `${overallWinner} wins the Reflex Challenge with ${maxPoints} points!` : 'No overall winner!'
    };

    this.io.to(this.roomId).emit('minigameResult', finalResult);

    console.log(`Reflex Click minigame ended. Overall winner: ${overallWinner || 'none'} with ${maxPoints} points`);

    // NEW: Automatically trigger death wheel phase after 5 seconds
    setTimeout(() => {
      this.triggerDeathWheelPhase();
    }, 5000);
  }

  // NEW: Trigger death wheel phase for non-winners
  triggerDeathWheelPhase() {
    const losers = [];
    const winner = this.overallWinner;
    
    // Collect all players who didn't win the minigame
    this.players.forEach((player, playerId) => {
      if (playerId !== winner) {
        losers.push(playerId);
      }
    });

    console.log(`Triggering death wheel phase. Winner: ${winner}, Losers: ${losers.length}`);

    // Emit death wheel phase start
    this.io.to(this.roomId).emit('deathWheelPhase', {
      type: 'reflexClick',
      winnerId: winner,
      losers: losers,
      currentSpinner: losers.length > 0 ? losers[0] : null,
      total: losers.length,
      message: losers.length > 0 ? 
        `${losers.length} player${losers.length > 1 ? 's' : ''} must face the death wheel!` :
        'No players need to spin - everyone survived!'
    });
  }

  // Hole Runden-Ergebnisse für alle Spieler
  getRoundPlayerResults() {
    const results = {};
    this.players.forEach((player, playerId) => {
      const roundResult = player.roundResults.find(r => r.round === this.currentRound);
      results[playerId] = {
        hasClicked: player.hasClicked,
        roundResult: roundResult || { result: 'noClick' },
        points: player.points,
        eliminated: !!player.eliminatedInRound
      };
    });
    return results;
  }

  // Hole finale Ergebnisse für alle Spieler
  getFinalPlayerResults() {
    const results = {};
    this.players.forEach((player, playerId) => {
      results[playerId] = {
        totalPoints: player.points,
        roundResults: player.roundResults,
        eliminatedInRound: player.eliminatedInRound,
        roundsWon: this.roundWinners.filter(w => w.playerId === playerId).length
      };
    });
    return results;
  }

  // Aufräumen
  cleanup() {
    if (this.enableTimeout) {
      clearTimeout(this.enableTimeout);
    }
    if (this.gameTimeout) {
      clearTimeout(this.gameTimeout);
    }
    this.players.clear();
  }
}

// Server Socket Event Handlers
function setupReflexClickHandlers(io, socket, roomGames) {
  
  // Minigame starten
  socket.on('startMinigame', (data) => {
    const { roomId, type } = data;
    
    console.log(`Server: Received startMinigame request. RoomId: ${roomId}, Type: ${type}, SocketId: ${socket.id}`);
    
    if (type !== 'reflexClick') {
      console.log(`Server: Wrong minigame type: ${type}`);
      return;
    }

    // Prüfe ob Raum existiert
    const room = io.sockets.adapter.rooms.get(roomId);
    if (!room) {
      console.log(`Server: Room ${roomId} not found`);
      socket.emit('error', { message: 'Room not found' });
      return;
    }

    console.log(`Server: Room ${roomId} found with ${room.size} players`);

    // Erstelle neues Spiel oder hole bestehendes
    if (!roomGames.has(roomId)) {
      roomGames.set(roomId, new Map());
    }
    
    const game = new ReflexClickGame(io, roomId);
    roomGames.get(roomId).set('reflexClick', game);

    console.log(`Server: Created new ReflexClickGame for room ${roomId}`);

    // Füge alle Spieler im Raum hinzu
    room.forEach(socketId => {
      const playerSocket = io.sockets.sockets.get(socketId);
      if (playerSocket && playerSocket.playerId) {
        console.log(`Server: Adding player ${playerSocket.playerId} to game`);
        game.addPlayer(playerSocket.playerId, socketId);
      }
    });

    // Starte das Spiel
    const started = game.startGame();
    
    if (!started) {
      console.log(`Server: Failed to start game for room ${roomId}`);
      socket.emit('error', { message: 'Could not start game' });
    } else {
      console.log(`Server: Successfully started game for room ${roomId}`);
    }
  });

  // Klick-Versuch
  socket.on('clickAttempt', (data) => {
    const { roomId, timestamp } = data;
    const playerId = socket.playerId;

    if (!playerId || !roomId) {
      return;
    }

    const roomGamesMap = roomGames.get(roomId);
    if (!roomGamesMap) {
      return;
    }

    const game = roomGamesMap.get('reflexClick');
    if (!game) {
      return;
    }

    game.handleClickAttempt(playerId, socket.id, timestamp);
  });

  // Spieler verlässt Raum
  socket.on('leaveRoom', () => {
    const playerId = socket.playerId;
    
    // Entferne Spieler aus allen aktiven Spielen
    roomGames.forEach((gamesMap, roomId) => {
      const game = gamesMap.get('reflexClick');
      if (game && playerId) {
        game.removePlayer(playerId);
      }
    });
  });

  // Verbindung getrennt
  socket.on('disconnect', () => {
    const playerId = socket.playerId;
    
    // Entferne Spieler aus allen aktiven Spielen
    roomGames.forEach((gamesMap, roomId) => {
      const game = gamesMap.get('reflexClick');
      if (game && playerId) {
        game.removePlayer(playerId);
      }
    });
  });
}

// Export für Integration in bestehenden Server
module.exports = {
  ReflexClickGame,
  setupReflexClickHandlers
};