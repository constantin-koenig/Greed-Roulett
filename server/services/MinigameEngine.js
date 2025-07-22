class MinigameEngine {
  constructor(io) {
    this.io = io;
    this.activeMinigames = new Map(); // lobbyId -> minigameState
  }

  // Start Reflex Click Minigame
  startReflexClick(lobbyId, playerIds) {
    const minigameState = {
      type: 'reflexClick',
      lobbyId: lobbyId,
      playerIds: [...playerIds],
      phase: 'waiting', // 'waiting' -> 'active' -> 'finished'
      clickEnabled: false,
      clickAttempts: [],
      winnerId: null,
      startTime: Date.now(),
      enableTimeout: null
    };

    this.activeMinigames.set(lobbyId, minigameState);

    // Notify all players that minigame started
    this.io.to(lobbyId.toString()).emit('minigameStarted', {
      type: 'reflexClick',
      playerIds: playerIds,
      message: 'Get ready... Click as soon as the button turns green!'
    });

    // Random delay between 1-5 seconds
    const delay = Math.floor(Math.random() * 4000) + 1000; // 1000-5000ms
    
    console.log(`[Reflex Click] Starting in lobby ${lobbyId} with delay ${delay}ms`);

    minigameState.enableTimeout = setTimeout(() => {
      this.enableReflexClick(lobbyId);
    }, delay);
  }

  // Enable clicking after random delay
  enableReflexClick(lobbyId) {
    const minigameState = this.activeMinigames.get(lobbyId);
    
    if (!minigameState || minigameState.phase !== 'waiting') {
      return;
    }

    minigameState.phase = 'active';
    minigameState.clickEnabled = true;
    minigameState.enableTime = Date.now();

    console.log(`[Reflex Click] Enabling clicks in lobby ${lobbyId}`);

    // Notify all players that clicking is now enabled
    this.io.to(lobbyId.toString()).emit('enableClick', {
      timestamp: minigameState.enableTime
    });
  }

  // Handle player click attempt
  handleClickAttempt(lobbyId, playerId, playerName) {
    const minigameState = this.activeMinigames.get(lobbyId);
    
    if (!minigameState || minigameState.phase !== 'active') {
      console.log(`[Reflex Click] Invalid click attempt from ${playerName} - game not active`);
      return false;
    }

    if (!minigameState.playerIds.includes(playerId)) {
      console.log(`[Reflex Click] Invalid click attempt from ${playerName} - not in game`);
      return false;
    }

    // Check if player already clicked
    const alreadyClicked = minigameState.clickAttempts.some(attempt => attempt.playerId === playerId);
    if (alreadyClicked) {
      console.log(`[Reflex Click] ${playerName} already clicked`);
      return false;
    }

    const clickTime = Date.now();
    const reactionTime = clickTime - minigameState.enableTime;

    const clickAttempt = {
      playerId: playerId,
      playerName: playerName,
      clickTime: clickTime,
      reactionTime: reactionTime
    };

    minigameState.clickAttempts.push(clickAttempt);

    console.log(`[Reflex Click] ${playerName} clicked with ${reactionTime}ms reaction time`);

    // If this is the first click, they win!
    if (minigameState.clickAttempts.length === 1) {
      minigameState.winnerId = playerId;
      minigameState.phase = 'finished';
      
      this.finishReflexClick(lobbyId);
      return true;
    }

    return false;
  }

  // Finish the minigame and broadcast results
  finishReflexClick(lobbyId) {
    const minigameState = this.activeMinigames.get(lobbyId);
    
    if (!minigameState) {
      return;
    }

    // Clear timeout if still waiting
    if (minigameState.enableTimeout) {
      clearTimeout(minigameState.enableTimeout);
    }

    const winner = minigameState.clickAttempts.find(attempt => attempt.playerId === minigameState.winnerId);
    const losers = minigameState.playerIds.filter(id => id !== minigameState.winnerId);

    console.log(`[Reflex Click] Game finished in lobby ${lobbyId}. Winner: ${winner?.playerName || 'None'}`);

    // Broadcast results to all players
    this.io.to(lobbyId.toString()).emit('minigameResult', {
      type: 'reflexClick',
      winnerId: minigameState.winnerId,
      winnerName: winner?.playerName || null,
      winnerReactionTime: winner?.reactionTime || null,
      losers: losers,
      allAttempts: minigameState.clickAttempts,
      totalDuration: Date.now() - minigameState.startTime
    });

    // Clean up
    this.activeMinigames.delete(lobbyId);

    return {
      winnerId: minigameState.winnerId,
      losers: losers
    };
  }

  // Force end minigame (if needed)
  endMinigame(lobbyId) {
    const minigameState = this.activeMinigames.get(lobbyId);
    
    if (minigameState) {
      if (minigameState.enableTimeout) {
        clearTimeout(minigameState.enableTimeout);
      }
      this.activeMinigames.delete(lobbyId);
      
      this.io.to(lobbyId.toString()).emit('minigameEnded', {
        reason: 'forced'
      });
    }
  }

  // Get active minigame state
  getMinigameState(lobbyId) {
    return this.activeMinigames.get(lobbyId) || null;
  }
}

module.exports = MinigameEngine;