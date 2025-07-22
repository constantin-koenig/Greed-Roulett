const express = require('express');
const { Lobby, Player } = require('../models');
const router = express.Router();

// Get lobby by code
router.get('/:code', async (req, res) => {
  try {
    const lobby = await Lobby.findOne({ code: req.params.code })
      .populate('players')
      .populate('hostId');
    
    if (!lobby) {
      return res.status(404).json({ message: 'Lobby not found' });
    }
    
    res.json(lobby);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get all active lobbies (for debugging)
router.get('/', async (req, res) => {
  try {
    const lobbies = await Lobby.find({ gameState: { $ne: 'Ended' } })
      .populate('players')
      .sort({ createdAt: -1 });
    
    res.json(lobbies);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;