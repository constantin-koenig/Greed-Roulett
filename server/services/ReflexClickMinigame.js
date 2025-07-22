// server/services/ReflexClickMinigame.js
// Reflex Click Minigame Server Logic for Greed Roulette

class ReflexClickGame {
  constructor(io, roomId) {
    this.io = io;
    this.roomId = roomId;
    this.gameState = 'waiting'; // 'waiting', 'countdown', 'active', 'finished'
    this.players = new Map(); // playerId -> { id, socketId, hasClicked }
    this.winnerId = null;
    this.gameTimeout = null;
    this.enableTimeout = null;
  }

  // Spieler zum Spiel hinzufügen
  addPlayer(playerId, socketId) {
    this.players.set(playerId, {
      id: playerId,
      socketId: socketId,
      hasClicked: false
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

    // Reset game state
    this.gameState = 'countdown';
    this.winnerId = null;
    this.players.forEach(player => {
      player.hasClicked = false;
    });

    // Benachrichtige alle Spieler über Spielstart
    this.io.to(this.roomId).emit('minigameStarted', {
      type: 'reflexClick',
      message: 'Get ready! Click when the button becomes active!'
    });

    // Zufällige Verzögerung zwischen 1-5 Sekunden
    const delay = Math.random() * 4000 + 1000; // 1000-5000ms

    console.log(`Reflex Click starting in ${Math.round(delay)}ms`);

    this.enableTimeout = setTimeout(() => {
      this.enableClick();
    }, delay);

    // Timeout nach 10 Sekunden falls niemand klickt
    this.gameTimeout = setTimeout(() => {
      this.endGame(null);
    }, delay + 10000);

    return true;
  }

  // Button aktivieren
  enableClick() {
    if (this.gameState !== 'countdown') {
      return;
    }

    this.gameState = 'active';
    
    // Button für alle aktivieren
    this.io.to(this.roomId).emit('enableClick', {
      timestamp: Date.now()
    });

    console.log('Reflex Click button enabled!');
  }

  // Klick-Versuch verarbeiten
  handleClickAttempt(playerId, socketId) {
    const player = this.players.get(playerId);
    
    if (!player || player.socketId !== socketId) {
      return false;
    }

    // Prüfe Spielstatus
    if (this.gameState === 'countdown') {
      // Zu früh geklickt - Spieler verliert
      player.hasClicked = true;
      this.io.to(socketId).emit('clickTooEarly', {
        message: 'Too early! You are disqualified.'
      });
      console.log(`Player ${playerId} clicked too early`);
      return false;
    }

    if (this.gameState !== 'active') {
      return false;
    }

    if (player.hasClicked) {
      return false; // Bereits geklickt
    }

    // Erster gültiger Klick!
    player.hasClicked = true;
    
    if (!this.winnerId) {
      this.winnerId = playerId;
      this.endGame(playerId);
      console.log(`Player ${playerId} won the reflex game!`);
    }

    return true;
  }

  // Spiel beenden
  endGame(winnerId) {
    if (this.gameState === 'finished') {
      return;
    }

    this.gameState = 'finished';
    this.winnerId = winnerId;

    // Timeouts clearen
    if (this.enableTimeout) {
      clearTimeout(this.enableTimeout);
      this.enableTimeout = null;
    }
    if (this.gameTimeout) {
      clearTimeout(this.gameTimeout);
      this.gameTimeout = null;
    }

    // Ergebnis an alle senden
    const allPlayerIds = Array.from(this.players.keys());
    
    this.io.to(this.roomId).emit('minigameResult', {
      type: 'reflexClick',
      winnerId: winnerId,
      allPlayerIds: allPlayerIds,
      message: winnerId ? `Player ${winnerId} won!` : 'No winner - time ran out!'
    });

    console.log(`Reflex Click ended. Winner: ${winnerId || 'none'}`);
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
    
    if (type !== 'reflexClick') {
      return;
    }

    // Prüfe ob Raum existiert
    const room = io.sockets.adapter.rooms.get(roomId);
    if (!room) {
      socket.emit('error', { message: 'Room not found' });
      return;
    }

    // Erstelle neues Spiel oder hole bestehendes
    if (!roomGames.has(roomId)) {
      roomGames.set(roomId, new Map());
    }
    
    const game = new ReflexClickGame(io, roomId);
    roomGames.get(roomId).set('reflexClick', game);

    // Füge alle Spieler im Raum hinzu
    room.forEach(socketId => {
      const playerSocket = io.sockets.sockets.get(socketId);
      if (playerSocket && playerSocket.playerId) {
        game.addPlayer(playerSocket.playerId, socketId);
      }
    });

    // Starte das Spiel
    const started = game.startGame();
    
    if (!started) {
      socket.emit('error', { message: 'Could not start game' });
    }
  });

  // Klick-Versuch
  socket.on('clickAttempt', (data) => {
    const { roomId } = data;
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

    game.handleClickAttempt(playerId, socket.id);
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