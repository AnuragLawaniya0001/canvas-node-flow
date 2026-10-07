const graphService = require('../services/graphService');
const simulationService = require('../services/simulationService');
const mongoose = require('mongoose');

const isInvalidGraphId = (id) => !mongoose.isValidObjectId(id);

const saveGraph = async (req, res) => {
  try {
    const graph = await graphService.createGraph(req.body);
    res.status(201).json({ status: 'success', data: graph });
  } catch (err) {
    res.status(500).json({ error: { code: 'GRAPH_SAVE_FAILED', message: err.message } });
  }
};

const listGraphs = async (req, res) => {
  try {
    const graphs = await graphService.getAllGraphs();
    res.status(200).json({ status: 'success', data: graphs });
  } catch (err) {
    res.status(500).json({ error: { code: 'GRAPH_LIST_FAILED', message: err.message } });
  }
};

const loadGraph = async (req, res) => {
  try {
    if (isInvalidGraphId(req.params.id)) {
      return res.status(400).json({ error: { code: 'INVALID_GRAPH_ID', message: 'The saved graph ID is invalid.' } });
    }
    const graph = await graphService.getGraphById(req.params.id);
    if (!graph) {
      return res.status(404).json({ error: { code: 'GRAPH_NOT_FOUND', message: 'Graph not found' } });
    }
    res.status(200).json({ status: 'success', data: graph });
  } catch (err) {
    res.status(500).json({ error: { code: 'GRAPH_LOAD_FAILED', message: err.message } });
  }
};

const updateGraph = async (req, res) => {
  try {
    if (isInvalidGraphId(req.params.id)) {
      return res.status(400).json({ error: { code: 'INVALID_GRAPH_ID', message: 'The saved graph ID is invalid.' } });
    }
    const graph = await graphService.updateGraph(req.params.id, req.body);
    if (!graph) {
      return res.status(404).json({ error: { code: 'GRAPH_NOT_FOUND', message: 'Graph not found' } });
    }
    res.status(200).json({ status: 'success', data: graph });
  } catch (err) {
    res.status(500).json({ error: { code: 'GRAPH_UPDATE_FAILED', message: err.message } });
  }
};

const deleteGraph = async (req, res) => {
  try {
    if (isInvalidGraphId(req.params.id)) {
      return res.status(400).json({ error: { code: 'INVALID_GRAPH_ID', message: 'The saved graph ID is invalid.' } });
    }
    const graph = await graphService.deleteGraph(req.params.id);
    if (!graph) {
      return res.status(404).json({ error: { code: 'GRAPH_NOT_FOUND', message: 'Graph not found' } });
    }
    res.status(200).json({ status: 'success', data: { deleted: true, id: req.params.id } });
  } catch (err) {
    res.status(500).json({ error: { code: 'GRAPH_DELETE_FAILED', message: err.message } });
  }
};

const simulateGraph = async (req, res) => {
  try {
    const result = await simulationService.forwardSimulationRequest(req.body);
    res.status(result && result.error ? 503 : 200).json(result);
  } catch (err) {
    res.status(500).json({
      error: {
        code: 'SIMULATION_API_ERROR',
        message: err.message
      }
    });
  }
};

module.exports = {
  saveGraph,
  listGraphs,
  loadGraph,
  updateGraph,
  deleteGraph,
  simulateGraph
};
