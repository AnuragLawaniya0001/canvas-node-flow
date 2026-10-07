const Graph = require('../models/Graph');

const serializeGraph = (graph) => {
  if (!graph) return null;
  const record = typeof graph.toObject === 'function' ? graph.toObject() : { ...graph };
  const { _id, __v, ...rest } = record;
  return {
    ...rest,
    id: record._id ? record._id.toString() : record.id,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt
  };
};

const createGraph = async (data = {}) => {
  const graph = new Graph({
    name: data.name || 'Untitled Graph',
    nodes: Array.isArray(data.nodes) ? data.nodes : [],
    edges: Array.isArray(data.edges) ? data.edges : [],
    version: data.version || 1
  });
  const saved = await graph.save();
  return serializeGraph(saved);
};

const getAllGraphs = async () => {
  const graphs = await Graph.find().sort({ updatedAt: -1 });
  return graphs.map(serializeGraph);
};

const getGraphById = async (id) => {
  const graph = await Graph.findById(id);
  return serializeGraph(graph);
};

const updateGraph = async (id, data = {}) => {
  const updated = await Graph.findByIdAndUpdate(
    id,
    {
      name: data.name,
      nodes: Array.isArray(data.nodes) ? data.nodes : [],
      edges: Array.isArray(data.edges) ? data.edges : [],
      version: data.version || 1
    },
    { new: true, runValidators: true }
  );
  return serializeGraph(updated);
};

const deleteGraph = async (id) => {
  return await Graph.findByIdAndDelete(id);
};

module.exports = {
  createGraph,
  getAllGraphs,
  getGraphById,
  updateGraph,
  deleteGraph
};
