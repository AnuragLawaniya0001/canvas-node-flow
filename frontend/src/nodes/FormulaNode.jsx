import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { Binary } from 'lucide-react';

const FormulaNode = ({ id, data, isConnectable }) => {
  const result = data.results?.[id] || {};
  const status = result.status || 'idle';

  const handleChange = (e) => {
    const val = e.target.value;
    if (data.onNodeDataChange) {
      data.onNodeDataChange(id, { formula: val });
    }
  };

  return (
    <div className={`custom-node formula-node status-${status}`}>
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
        <Binary className="node-icon" size={16} />
        <span className="node-title">Formula</span>
      </div>

      <div className="node-body">
        <div className="handle-labels">
          <span style={{ top: '22%' }}>a</span>
          <span style={{ top: '62%' }}>b</span>
        </div>
        <label className="input-label">Expr (vars: a, b)</label>
        <input
          type="text"
          className="node-input formula-input nodrag"
          value={data.formula !== undefined ? data.formula : 'a * 2 + b'}
          onChange={handleChange}
          placeholder="e.g. a * 2 + b"
        />

        {status === 'success' && result.value !== undefined && (
          <div className="result-badge">{result.value}</div>
        )}
        {status === 'error' && (
          <div className="error-badge alert-red">{result.errorCode || 'INVALID_FORMULA'}</div>
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

export default React.memo(FormulaNode);
