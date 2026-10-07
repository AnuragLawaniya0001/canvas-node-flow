import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { Hash } from 'lucide-react';

const NumberNode = ({ id, data, isConnectable }) => {
  const result = data.results?.[id] || {};
  const status = result.status || 'idle';

  const handleChange = (e) => {
    const val = parseFloat(e.target.value) || 0;
    if (data.onNodeDataChange) {
      data.onNodeDataChange(id, { value: val });
    }
  };

  return (
    <div className={`custom-node number-node status-${status}`}>
      <div className="node-header">
        <Hash className="node-icon" size={16} />
        <span className="node-title">Number</span>
      </div>

      <div className="node-body">
        <label className="input-label">Value</label>
        <input
          type="number"
          className="node-input nodrag"
          value={data.value !== undefined ? data.value : 2}
          onChange={handleChange}
          step="any"
        />
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

export default React.memo(NumberNode);
