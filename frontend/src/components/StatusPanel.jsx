import React from 'react';
import { AlertCircle, AlertOctagon, CheckCircle2, Info } from 'lucide-react';

const StatusPanel = ({ executionStatus, globalError, cycleNodes, nodeResults }) => {
  const errorCount = Object.values(nodeResults).filter((r) => r.status === 'error').length;
  const blockedCount = Object.values(nodeResults).filter((r) => r.status === 'blocked').length;

  return (
    <div className={`status-panel status-${executionStatus}`}>
      <div className="status-panel-content">
        {executionStatus === 'error' && (
          <div className="status-message error-text">
            <AlertOctagon size={16} />
            <span>
              <strong>Error Detected:</strong> {globalError || 'Graph execution encountered errors'}
              {cycleNodes.length > 0 && ` | Nodes involved in cycle: [ ${cycleNodes.join(', ')} ]`}
            </span>
          </div>
        )}

        {executionStatus === 'unavailable' && (
          <div className="status-message warning-text">
            <AlertCircle size={16} />
            <span>
              <strong>Simulation unavailable:</strong> {globalError || 'The backend is temporarily unavailable.'}
            </span>
          </div>
        )}

        {executionStatus === 'success' && (
          <div className="status-message success-text">
            <CheckCircle2 size={16} />
            <span>Circuit simulation active — all nodes synchronized with ngspice backend.</span>
          </div>
        )}

        {executionStatus === 'idle' && (
          <div className="status-message idle-text">
            <Info size={16} />
            <span>Add or connect nodes to run live ngspice simulation.</span>
          </div>
        )}

        {executionStatus === 'running' && (
          <div className="status-message running-text">
            <Info size={16} />
            <span>Executing ngspice simulation...</span>
          </div>
        )}
      </div>

      <div className="status-summary-pills">
        {errorCount > 0 && <span className="pill pill-error">{errorCount} Errors</span>}
        {blockedCount > 0 && <span className="pill pill-blocked">{blockedCount} Blocked</span>}
      </div>
    </div>
  );
};

export default StatusPanel;
