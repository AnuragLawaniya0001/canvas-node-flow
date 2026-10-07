/**
 * Connection validator callback for React Flow's isValidConnection prop.
 */
export const isValidConnection = (connection, edges, nodeTypesMap) => {
  const { source, target } = connection;
  if (!source || !target || source === target) {
    return false;
  }

  const sourceHandle = connection.sourceHandle || 'out';
  const targetHandle = connection.targetHandle || 'a';

  // Source must be an output-type handle, not an input handle.
  if (sourceHandle === 'a' || sourceHandle === 'b' || sourceHandle === 'in') {
    return false;
  }

  // Target must be an input handle, never an output handle.
  if (targetHandle === 'out') {
    return false;
  }

  // React Flow can sometimes omit handle names while dragging over the node body.
  // In that case, treat the default target as the first input and keep the standard
  // validation rules intact.
  const normalizedTargetHandle = targetHandle || 'a';
  const normalizedSourceHandle = sourceHandle || 'out';

  // Each input handle can accept only one incoming wire.
  const existingIncomingWire = edges.find(
    (edge) =>
      edge.target === target &&
      (edge.targetHandle || 'a') === normalizedTargetHandle &&
      edge.source !== source
  );

  if (existingIncomingWire) {
    return false;
  }

  // Short-circuit invalid drags that clearly come from an input side.
  if (normalizedSourceHandle === 'a' || normalizedSourceHandle === 'b' || normalizedSourceHandle === 'in') {
    return false;
  }

  return true;
};
