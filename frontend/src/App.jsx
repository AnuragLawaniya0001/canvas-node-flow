import React, { useState, useCallback, useMemo } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  addEdge,
  applyNodeChanges,
  applyEdgeChanges,
  ReactFlowProvider
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import NumberNode from './nodes/NumberNode';
import AddNode from './nodes/AddNode';
import MultiplyNode from './nodes/MultiplyNode';
import DivideNode from './nodes/DivideNode';
import FormulaNode from './nodes/FormulaNode';
import DisplayNode from './nodes/DisplayNode';

import Header from './components/Header';
import Sidebar from './components/Sidebar';
import StatusPanel from './components/StatusPanel';

import { useGraphState } from './hooks/useGraphState';
import { useGraphExecution } from './hooks/useGraphExecution';
import { isValidConnection } from './utils/graphValidator';

const nodeTypes = {
  number: NumberNode,
  add: AddNode,
  multiply: MultiplyNode,
  divide: DivideNode,
  formula: FormulaNode,
  display: DisplayNode
};

function FlowCanvas() {
  const [isLiveSync, setIsLiveSync] = useState(false);
  const [selectedNodeIds, setSelectedNodeIds] = useState([]);

  const {
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
  } = useGraphState();

  const { runManualExecution } = useGraphExecution({
    nodes,
    edges,
    version,
    isLiveSync,
    setExecutionStatus,
    setNodeResults,
    setCycleNodes,
    setGlobalError
  });

  const onNodesChange = useCallback(
    (changes) => {
      setNodes((nds) => {
        const nextNodes = applyNodeChanges(changes, nds);
        if (changes.some((c) => c.type === 'remove' || c.type === 'position')) {
          incrementVersion();
        }
        return nextNodes;
      });
    },
    [setNodes, incrementVersion]
  );

  const onEdgesChange = useCallback(
    (changes) => {
      setEdges((eds) => {
        const nextEdges = applyEdgeChanges(changes, eds);
        if (changes.some((c) => c.type === 'remove')) {
          incrementVersion();
        }
        return nextEdges;
      });
    },
    [setEdges, incrementVersion]
  );

  const onConnect = useCallback(
    (connection) => {
      const normalizedConnection = {
        ...connection,
        sourceHandle: connection.sourceHandle || 'out',
        targetHandle: connection.targetHandle || 'a'
      };

      if (isValidConnection(normalizedConnection, edges, nodeTypes)) {
        setEdges((eds) => addEdge(normalizedConnection, eds));
        incrementVersion();
      }
    },
    [edges, setEdges, incrementVersion]
  );

  const handleDeleteSelected = useCallback(() => {
    if (selectedNodeIds.length === 0) return;

    const selectedSet = new Set(selectedNodeIds);
    setNodes((nds) => nds.filter((node) => !selectedSet.has(node.id)));
    setEdges((eds) => eds.filter((edge) => !selectedSet.has(edge.source) && !selectedSet.has(edge.target)));
    setSelectedNodeIds([]);
    incrementVersion();
  }, [selectedNodeIds, setNodes, setEdges, incrementVersion]);

  const onNodesDelete = useCallback(
    (deleted) => {
      const deletedIds = new Set(deleted.map((node) => node.id));
      setNodes((nds) => nds.filter((node) => !deletedIds.has(node.id)));
      setEdges((eds) => eds.filter((edge) => !deletedIds.has(edge.source) && !deletedIds.has(edge.target)));
      setSelectedNodeIds((ids) => ids.filter((id) => !deletedIds.has(id)));
      incrementVersion();
    },
    [setNodes, setEdges, incrementVersion]
  );

  const onEdgesDelete = useCallback(
    (deleted) => {
      const deletedIds = new Set(deleted.map((edge) => edge.id));
      setEdges((eds) => eds.filter((edge) => !deletedIds.has(edge.id)));
      incrementVersion();
    },
    [setEdges, incrementVersion]
  );

  const onSelectionChange = useCallback(({ nodes: selectedNodes }) => {
    setSelectedNodeIds(selectedNodes.map((node) => node.id));
  }, []);

  const handleDragOver = useCallback((event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const handleDrop = useCallback(
    (event) => {
      event.preventDefault();
      const type = event.dataTransfer.getData('application/reactflow');
      if (!type) return;

      const reactFlowBounds = event.currentTarget.getBoundingClientRect();
      const position = {
        x: event.clientX - reactFlowBounds.left - 80,
        y: event.clientY - reactFlowBounds.top - 30
      };

      addNode(type, position);
    },
    [addNode]
  );

  // Attach results, cycle highlights, and data change handlers to each node object
  const decoratedNodes = useMemo(() => {
    return nodes.map((node) => {
      const isCycle = cycleNodes.includes(node.id);
      return {
        ...node,
        className: isCycle ? 'node-in-cycle' : '',
        data: {
          ...node.data,
          results: nodeResults,
          onNodeDataChange: updateNodeData
        }
      };
    });
  }, [nodes, nodeResults, cycleNodes, updateNodeData]);

  return (
    <div className="app-container">
      <Header
        nodes={nodes}
        edges={edges}
        version={version}
        executionStatus={executionStatus}
        isLiveSync={isLiveSync}
        setIsLiveSync={setIsLiveSync}
        onManualRun={runManualExecution}
        onLoadGraph={(newNodes, newEdges) => updateNodesAndEdges(newNodes, newEdges)}
      />

      <div className="main-layout">
        <Sidebar onAddNode={(type) => addNode(type)} />

        <div className="canvas-wrapper" onDragOver={handleDragOver} onDrop={handleDrop}>
          {selectedNodeIds.length > 0 && (
            <div className="canvas-quick-actions">
              <button className="btn btn-danger" onClick={handleDeleteSelected}>
                Delete Selected
              </button>
            </div>
          )}

          <ReactFlow
            nodes={decoratedNodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodesDelete={onNodesDelete}
            onEdgesDelete={onEdgesDelete}
            onSelectionChange={onSelectionChange}
            isValidConnection={(conn) => isValidConnection(conn, edges, nodeTypes)}
            nodeTypes={nodeTypes}
            deleteKeyCode={['Backspace', 'Delete']}
            connectionMode="loose"
            connectionRadius={32}
            connectOnClick
            fitView
            nodesDraggable
            nodesConnectable
            elementsSelectable
            panOnScroll
            zoomOnScroll
            selectionOnDrag
            style={{ width: '100%', height: '100%' }}
          >
            <Background color="#334155" gap={16} size={1} />
            <Controls className="react-flow-controls" />
            <MiniMap className="react-flow-minimap" nodeColor="#475569" maskColor="rgba(15, 23, 42, 0.7)" />
          </ReactFlow>
        </div>
      </div>

      <StatusPanel
        executionStatus={executionStatus}
        globalError={globalError}
        cycleNodes={cycleNodes}
        nodeResults={nodeResults}
      />
    </div>
  );
}

export default function App() {
  return (
    <ReactFlowProvider>
      <FlowCanvas />
    </ReactFlowProvider>
  );
}
