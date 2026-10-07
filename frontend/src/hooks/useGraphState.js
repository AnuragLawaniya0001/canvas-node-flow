import { useState, useCallback, useRef } from 'react';
import { NODE_CONFIGS } from '../nodeDefinitions';

export const useGraphState = (initialNodes = [], initialEdges = []) => {
  const [nodes, setNodes] = useState(initialNodes);
  const [edges, setEdges] = useState(initialEdges);
  const [version, setVersion] = useState(1);
  const [executionStatus, setExecutionStatus] = useState('idle'); // idle | running | success | error
  const [nodeResults, setNodeResults] = useState({});
  const [cycleNodes, setCycleNodes] = useState([]);
  const [globalError, setGlobalError] = useState(null);

  const incrementVersion = useCallback(() => {
    setVersion((v) => v + 1);
  }, []);

  const addNode = useCallback((type, position) => {
    const config = NODE_CONFIGS[type];
    if (!config) return;

    const id = `node_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const basePosition = position || { x: 250, y: 150 };

    setNodes((nds) => {
      const offsetX = (nds.length % 3) * 220;
      const offsetY = Math.floor(nds.length / 3) * 160;
      const newNode = {
        id,
        type,
        position: {
          x: basePosition.x + offsetX,
          y: basePosition.y + offsetY
        },
        data: { ...config.defaultData }
      };

      return [...nds, newNode];
    });
    incrementVersion();
  }, [incrementVersion]);

  const updateNodeData = useCallback((nodeId, newData) => {
    setNodes((nds) =>
      nds.map((n) => {
        if (n.id === nodeId) {
          return {
            ...n,
            data: { ...n.data, ...newData }
          };
        }
        return n;
      })
    );
    incrementVersion();
  }, [incrementVersion]);

  const updateNodesAndEdges = useCallback((newNodes, newEdges) => {
    setNodes(newNodes);
    setEdges(newEdges);
    setNodeResults({});
    setCycleNodes([]);
    setGlobalError(null);
    incrementVersion();
  }, [incrementVersion]);

  return {
    nodes,
    setNodes,
    edges,
    setEdges,
    version,
    executionStatus,
    setExecutionStatus,
    nodeResults,
    setNodeResults,
    cycleNodes,
    setCycleNodes,
    globalError,
    setGlobalError,
    addNode,
    updateNodeData,
    updateNodesAndEdges,
    incrementVersion
  };
};
