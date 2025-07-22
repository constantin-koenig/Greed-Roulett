// server/models/Player.js
const mongoose = require('mongoose');

const playerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 20
  },
  socketId: {
    type: String,
    required: true
  },
  lobbyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Lobby',
    required: true
  },
  lives: {
    type: Number,
    default: 5
  },
  money: {
    type: Number,
    default: 0
  },
  hasX2Active: {
    type: Boolean,
    default: false
  },
  isAlive: {
    type: Boolean,
    default: true
  },
  isHost: {
    type: Boolean,
    default: false
  },
  spinHistory: [{
    round: Number,
    result: String, // 'safe', 'death', 'bonus'
    timestamp: { type: Date, default: Date.now }
  }],
  safeFieldsLeft: {
    type: Number,
    default: 4
  },
  joinedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Player', playerSchema);