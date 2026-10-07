const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { checkSimulationHealth } = require('../services/simulationService');

router.get('/health', async (req, res) => {
  try {
    await checkSimulationHealth();
  } catch (error) {
    // Health endpoint intentionally remains minimal for the assignment contract.
  }

  res.status(200).json({
    status: 'ok',
    service: 'api'
  });
});

module.exports = router;
