import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { Monitor } from 'lucide-react';

const DisplayNode = ({ id, data, isConnectable }) => {
  const result = data.results?.[id] || {};
  const status = result.status || 'idle';

  return (
    <div className={`custom-node display-node status-${status}`}>
      <Handle
        type="target"
        position={Position.Left}
        id="a"
        isConnectable={isConnectable}
        className="handle handle-target"
      />

      <div className="node-header">
        <Monitor className="node-icon" size={16} />
        <span className="node-title">Display</span>
      </div>

      <div className="node-body display-body">
        {status === 'success' && result.value !== undefined ? (
          <div className="display-screen">
            <span className="display-value">{result.value}</span>
          </div>
        ) : status === 'blocked' ? (
          <div className="display-screen screen-blocked">
            <span className="display-status">BLOCKED</span>
          </div>
        ) : status === 'error' ? (
          <div className="display-screen screen-error">
            <span className="display-status">{result.errorCode || 'ERROR'}</span>
          </div>
        ) : (
          <div className="display-screen screen-idle">
            <span className="display-status">--</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default React.memo(DisplayNode);
