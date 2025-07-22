const mongoose = require('mongoose');

const roundResultSchema = new mongoose.Schema({
  playerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Player',
    required: true
  },
  minigameResult: {
    type: String,
    enum: ['win', 'lose', 'skip'],
    default: 'skip'
  },
  hadX2Active: {
    type: Boolean,
    default: false
  },
  moneyEarned: {
    type: Number,
    default: 0
  },
  spinResult: {
    type: String,
    enum: ['safe', 'death', 'bonus', 'none'],
    default: 'none'
  },
  livesLost: {
    type: Number,
    default: 0
  },
  survived: {
    type: Boolean,
    default: true
  }
});

const gameRoundSchema = new mongoose.Schema({
  lobbyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Lobby',
    required: true
  },
  roundNumber: {
    type: Number,
    required: true
  },
  roundType: {
    type: String,
    enum: ['minigame', 'gambling', 'survival'],
    default: 'minigame'
  },
  phase: {
    type: String,
    enum: ['preparation', 'playing', 'spinning', 'completed'],
    default: 'preparation'
  },
  participatingPlayers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Player'
  }],
  losers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Player'
  }],
  results: [roundResultSchema],
  deathWheelState: {
    redFields: Number,
    greenFields: Number,
    bonusFields: Number
  },
  startTime: {
    type: Date,
    default: Date.now
  },
  endTime: Date,
  duration: Number // in milliseconds
});

gameRoundSchema.pre('save', function(next) {
  if (this.endTime && this.startTime) {
    this.duration = this.endTime - this.startTime;
  }
  next();
});

module.exports = mongoose.model('GameRound', gameRoundSchema);