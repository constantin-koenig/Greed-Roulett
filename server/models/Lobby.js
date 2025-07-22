const mongoose = require('mongoose');

const gameSettingsSchema = new mongoose.Schema({
  gameMode: {
    type: String,
    enum: ['LastManStanding', 'MoneyRush', 'SurvivalScore'],
    default: 'LastManStanding'
  },
  maxRounds: {
    type: Number,
    default: 10,
    min: 1,
    max: 50
  },
  startLives: {
    type: Number,
    default: 5,
    min: 1,
    max: 10
  },
  deathWheelStart: {
    redFields: { type: Number, default: 1 },
    greenFields: { type: Number, default: 4 }
  },
  gamblingAllowed: {
    type: Boolean,
    default: true
  },
  x2RiskAllowed: {
    type: Boolean,
    default: true
  }
});

const lobbySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 30
  },
  code: {
    type: String,
    required: true,
    unique: true,
    length: 6
  },
  hostId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Player',
    required: true
  },
  players: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Player'
  }],
  maxPlayers: {
    type: Number,
    default: 8,
    min: 2,
    max: 12
  },
  gameState: {
    type: String,
    enum: ['Waiting', 'InProgress', 'Ended'],
    default: 'Waiting'
  },
  currentRound: {
    type: Number,
    default: 0
  },
  gameSettings: gameSettingsSchema,
  deathWheel: {
    redFields: { type: Number, default: 1 },
    greenFields: { type: Number, default: 4 },
    bonusFields: { type: Number, default: 0 }
  },
  roundHistory: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'GameRound'
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

lobbySchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Lobby', lobbySchema);