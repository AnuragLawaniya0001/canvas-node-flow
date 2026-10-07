import { useEffect, useRef, useCallback } from 'react';
import { simulateGraphApi } from '../services/apiClient';

export const useGraphExecution = ({
  nodes,
  edges,
  version,
  isLiveSync,
  setExecutionStatus,
  setNodeResults,
  setCycleNodes,
  setGlobalError
}) => {
  const latestVersionRef = useRef(version);
  latestVersionRef.current = version;

  const abortControllerRef = useRef(null);
  const debounceTimerRef = useRef(null);

  const executeSimulation = useCallback(async (currentVersion, currentNodes, currentEdges) => {
    latestVersionRef.current = currentVersion;

    // Abort previous in-flight request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setExecutionStatus('running');
    setNodeResults({});
    setGlobalError(null);

    try {
      const payload = {
        version: currentVersion,
        nodes: currentNodes.map((n) => ({
          id: n.id,
          type: n.type,
          position: n.position,
          data: n.data
        })),
        edges: currentEdges.map((e) => ({
          id: e.id,
          source: e.source,
          target: e.target,
          sourceHandle: e.sourceHandle,
          targetHandle: e.targetHandle
        }))
      };

      const response = await simulateGraphApi(payload, controller.signal);

      // Canceled request -> do nothing
      if (response && response.canceled) {
        return;
      }

      if (response && response.version !== undefined && response.version !== currentVersion) {
        console.warn(`[Stale Protection] Ignored response for v${response.version} (current v${currentVersion})`);
        return;
      }

      if (response && response.status === 'success') {
        setExecutionStatus('success');
        setNodeResults(response.nodes || {});
        setCycleNodes([]);
        setGlobalError(null);
      } else if (response && response.status === 'error') {
        const errorCode = response.errorCode || response.error?.code || 'SIMULATION_ERROR';
        const errorMessage = response.message || response.error?.message || 'Simulation error';
        const nextStatus = errorCode === 'SIMULATION_SERVICE_UNAVAILABLE' || errorCode === 'API_CONNECTION_ERROR' ? 'unavailable' : 'error';

        setExecutionStatus(nextStatus);
        setNodeResults(response.nodes || {});
        setCycleNodes(response.cycleNodes || []);
        setGlobalError(errorMessage);
      }
    } catch (err) {
      if (err.name === 'CanceledError' || err.name === 'AbortError') {
        return;
      }
      setExecutionStatus('unavailable');
      setGlobalError('Backend connection error');
    }
  }, [setExecutionStatus, setNodeResults, setCycleNodes, setGlobalError]);

  // Live Sync trigger with 200ms debounce
  useEffect(() => {
    if (!isLiveSync) return;

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      executeSimulation(version, nodes, edges);
    }, 200);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [nodes, edges, version, isLiveSync, executeSimulation]);

  return {
    runManualExecution: () => executeSimulation(version, nodes, edges)
  };
};
