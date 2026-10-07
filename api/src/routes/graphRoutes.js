const express = require('express');
const router = express.Router();
const graphController = require('../controllers/graphController');
const { validateGraphPayload } = require('../validators/graphValidator');

router.post('/graphs', validateGraphPayload, graphController.saveGraph);
router.get('/graphs', graphController.listGraphs);
router.get('/graphs/:id', graphController.loadGraph);
router.put('/graphs/:id', validateGraphPayload, graphController.updateGraph);
router.delete('/graphs/:id', graphController.deleteGraph);

router.post('/simulate', validateGraphPayload, graphController.simulateGraph);

module.exports = router;
