const sendInvalidGraph = (res, code, message) => {
  return res.status(400).json({
    error: { code, message }
  });
};

const validateGraphPayload = (req, res, next) => {
  const payload = req.body || {};
  const { nodes, edges } = payload;

  if (!payload || typeof payload !== 'object') {
    return sendInvalidGraph(res, 'INVALID_GRAPH', 'Request body must be an object');
  }

  if (!Object.prototype.hasOwnProperty.call(payload, 'nodes')) {
    return sendInvalidGraph(res, 'INVALID_GRAPH', 'Missing required field: nodes');
  }

  if (!Object.prototype.hasOwnProperty.call(payload, 'edges')) {
    return sendInvalidGraph(res, 'INVALID_GRAPH', 'Missing required field: edges');
  }

  if (!Array.isArray(nodes)) {
    return sendInvalidGraph(res, 'INVALID_GRAPH', 'Nodes must be an array');
  }

  if (!Array.isArray(edges)) {
    return sendInvalidGraph(res, 'INVALID_GRAPH', 'Edges must be an array');
  }

  const seenNodeIds = new Set();
  for (const node of nodes) {
    if (!node || typeof node !== 'object') {
      return sendInvalidGraph(res, 'INVALID_GRAPH', 'Each node must be an object');
    }
    if (!node.id) {
      return sendInvalidGraph(res, 'INVALID_GRAPH', 'Each node must include an id');
    }
    if (seenNodeIds.has(node.id)) {
      return sendInvalidGraph(res, 'INVALID_GRAPH', `Duplicate node id: ${node.id}`);
    }
    seenNodeIds.add(node.id);
  }

  const seenEdgeIds = new Set();
  for (const edge of edges) {
    if (!edge || typeof edge !== 'object') {
      return sendInvalidGraph(res, 'INVALID_GRAPH', 'Each edge must be an object');
    }
    if (edge.id && seenEdgeIds.has(edge.id)) {
      return sendInvalidGraph(res, 'INVALID_GRAPH', `Duplicate edge id: ${edge.id}`);
    }
    if (edge.id) seenEdgeIds.add(edge.id);
    if (!edge.source || !edge.target) {
      return sendInvalidGraph(res, 'INVALID_GRAPH', 'Each edge must include source and target');
    }
    if (!seenNodeIds.has(edge.source) || !seenNodeIds.has(edge.target)) {
      return sendInvalidGraph(res, 'INVALID_EDGE', `Edge references a nonexistent node: ${edge.id || `${edge.source}->${edge.target}`}`);
    }
  }

  next();
};

module.exports = {
  validateGraphPayload
};
