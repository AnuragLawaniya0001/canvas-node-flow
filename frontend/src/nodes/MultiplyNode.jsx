import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { X } from 'lucide-react';

const MultiplyNode = ({ id, data, isConnectable }) => {
  const result = data.results?.[id] || {};
  const status = result.status || 'idle';

  return (
    <div className={`custom-node multiply-node status-${status}`}>
      <Handle
        type="target"
        position={Position.Left}
        id="a"
        style={{ top: '30%' }}
        isConnectable={isConnectable}
        className="handle handle-target"
      />
      <Handle
        type="target"
        position={Position.Left}
        id="b"
        style={{ top: '70%' }}
        isConnectable={isConnectable}
        className="handle handle-target"
      />

      <div className="node-header">
        <X className="node-icon" size={16} />
        <span className="node-title">Multiply</span>
      </div>

      <div className="node-body">
        <div className="handle-labels">
          <span style={{ top: '22%' }}>a</span>
          <span style={{ top: '62%' }}>b</span>
        </div>
        <div className="op-symbol">a × b</div>
        {status === 'success' && result.value !== undefined && (
          <div className="result-badge">{result.value}</div>
        )}
        {status === 'error' && (
          <div className="error-badge">{result.errorCode || 'ERROR'}</div>
        )}
        {status === 'blocked' && (
          <div className="blocked-badge">BLOCKED</div>
        )}
      </div>

      <Handle
        type="source"
        position={Position.Right}
        id="out"
        isConnectable={isConnectable}
        className="handle handle-source"
      />
    </div>
  );
};

export default React.memo(MultiplyNode);
