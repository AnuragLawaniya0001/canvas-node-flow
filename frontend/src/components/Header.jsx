import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Save, FolderOpen, RefreshCw, Zap, AlertTriangle, CheckCircle2, X, LoaderCircle, Network } from 'lucide-react';
import { saveGraphApi, listGraphsApi, getGraphApi } from '../services/apiClient';

const getErrorMessage = (error) => (
  error.response?.data?.error?.message
  || error.response?.data?.message
  || error.message
  || 'An unexpected error occurred.'
);

const Header = ({
  nodes,
  edges,
  version,
  executionStatus,
  onLoadGraph,
  onManualRun
}) => {
  const [graphName, setGraphName] = useState('My Circuit Graph');
  const [savedGraphs, setSavedGraphs] = useState([]);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [isLoadModalOpen, setIsLoadModalOpen] = useState(false);
  const [isLoadingGraphs, setIsLoadingGraphs] = useState(false);
  const [loadingGraphId, setLoadingGraphId] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [saveError, setSaveError] = useState('');
  const [notice, setNotice] = useState('');

  const fetchSavedGraphs = async () => {
    setIsLoadingGraphs(true);
    setLoadError('');
    try {
      const res = await listGraphsApi();
      const graphs = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
      setSavedGraphs(graphs);
      return true;
    } catch (err) {
      console.error('Failed to list graphs:', err);
      setLoadError(getErrorMessage(err));
      return false;
    } finally {
      setIsLoadingGraphs(false);
    }
  };

  const handleSave = async () => {
    if (!graphName.trim()) {
      setSaveError('Enter a name for this graph.');
      return;
    }

    setIsSaving(true);
    setSaveError('');
    try {
      await saveGraphApi({
        name: graphName.trim(),
        nodes,
        edges,
        version
      });
      setIsSaveModalOpen(false);
      setNotice('Graph saved successfully.');
      await fetchSavedGraphs();
    } catch (err) {
      setSaveError(getErrorMessage(err));
    } finally {
      setIsSaving(false);
    }
  };

  const handleLoadSelected = async (id) => {
    if (!id) {
      setLoadError('This saved graph does not have a valid ID. Refresh the list and try again.');
      return;
    }

    setLoadingGraphId(id);
    setLoadError('');
    try {
      const res = await getGraphApi(id);
      const graph = res?.data || res;

      if (graph && Array.isArray(graph.nodes) && Array.isArray(graph.edges)) {
        onLoadGraph(graph.nodes, graph.edges);
        setGraphName(graph.name || 'Loaded Graph');
        setIsLoadModalOpen(false);
        setNotice(`Loaded "${graph.name || 'graph'}".`);
      } else {
        throw new Error('Graph data was not returned from the server.');
      }
    } catch (err) {
      setLoadError(getErrorMessage(err));
    } finally {
      setLoadingGraphId(null);
    }
  };

  const openLoadModal = () => {
    setIsLoadModalOpen(true);
    fetchSavedGraphs();
  };

  const closeModals = () => {
    setIsSaveModalOpen(false);
    setIsLoadModalOpen(false);
    setSaveError('');
    setLoadError('');
  };

  const saveModal = isSaveModalOpen && createPortal(
    <div className="modal-overlay" onMouseDown={closeModals}>
      <section className="modal-card" role="dialog" aria-modal="true" aria-labelledby="save-modal-title" onMouseDown={(event) => event.stopPropagation()}>
        <div className="modal-heading">
          <div>
            <span className="modal-eyebrow">GRAPH LIBRARY</span>
            <h2 id="save-modal-title">Save this flow</h2>
          </div>
          <button className="modal-close" type="button" aria-label="Close" onClick={closeModals}><X size={18} /></button>
        </div>
        <p className="modal-description">Save the current nodes and connections so you can reopen this flow later.</p>
        <label className="modal-label" htmlFor="graph-name">Flow name</label>
        <input
          id="graph-name"
          type="text"
          className="modal-input"
          value={graphName}
          onChange={(event) => setGraphName(event.target.value)}
          placeholder="e.g. Voltage divider"
          maxLength={100}
          autoFocus
        />
        {saveError && <p className="modal-error" role="alert"><AlertTriangle size={15} />{saveError}</p>}
        <div className="modal-actions">
          <button className="btn btn-secondary" type="button" onClick={closeModals} disabled={isSaving}>Cancel</button>
          <button className="btn btn-primary" type="button" onClick={handleSave} disabled={isSaving || !graphName.trim()}>
            {isSaving ? <LoaderCircle size={16} className="spin" /> : <Save size={16} />}
            {isSaving ? 'Saving…' : 'Save flow'}
          </button>
        </div>
      </section>
    </div>,
    document.body
  );

  const loadModal = isLoadModalOpen && createPortal(
    <div className="modal-overlay" onMouseDown={closeModals}>
      <section className="modal-card load-modal-card" role="dialog" aria-modal="true" aria-labelledby="load-modal-title" onMouseDown={(event) => event.stopPropagation()}>
        <div className="modal-heading">
          <div>
            <span className="modal-eyebrow">GRAPH LIBRARY</span>
            <h2 id="load-modal-title">Load a flow</h2>
          </div>
          <button className="modal-close" type="button" aria-label="Close" onClick={closeModals}><X size={18} /></button>
        </div>
        <p className="modal-description">Choose a saved flow to restore it to the canvas.</p>
        {loadError && <p className="modal-error" role="alert"><AlertTriangle size={15} />{loadError}</p>}
        <div className="saved-graphs-list" aria-live="polite">
          {isLoadingGraphs ? (
            <div className="modal-state"><LoaderCircle size={20} className="spin" /><span>Loading saved flows…</span></div>
          ) : loadError && savedGraphs.length === 0 ? (
            <div className="modal-state modal-state-error">Could not load saved flows. Check that the API and database are running, then retry.</div>
          ) : savedGraphs.length === 0 ? (
            <div className="modal-state"><Network size={22} /><span>No saved flows yet. Use Save to add this canvas to your library.</span></div>
          ) : (
            savedGraphs.map((graph) => {
              const id = graph.id || graph._id;
              return (
                <button
                  className="saved-graph-item"
                  key={id || graph.name}
                  type="button"
                  onClick={() => handleLoadSelected(id)}
                  disabled={!id || loadingGraphId !== null}
                >
                  <span className="saved-graph-icon"><Network size={18} /></span>
                  <span className="saved-graph-copy">
                    <span className="saved-name">{graph.name || 'Untitled flow'}</span>
                    <span className="saved-date">
                      {graph.nodes?.length || 0} nodes · {graph.edges?.length || 0} connections
                      {graph.updatedAt && ` · ${new Date(graph.updatedAt).toLocaleString()}`}
                    </span>
                  </span>
                  {loadingGraphId === id && <LoaderCircle size={17} className="spin saved-graph-loading" />}
                </button>
              );
            })
          )}
        </div>
        <div className="modal-actions">
          <button className="btn btn-secondary" type="button" onClick={fetchSavedGraphs} disabled={isLoadingGraphs}>
            <RefreshCw size={15} className={isLoadingGraphs ? 'spin' : ''} /> Refresh
          </button>
          <button className="btn btn-secondary" type="button" onClick={closeModals}>Close</button>
        </div>
      </section>
    </div>,
    document.body
  );

  const statusNotice = notice && createPortal(
    <div className="header-notice" role="status">
      {notice}
      <button type="button" aria-label="Dismiss" onClick={() => setNotice('')}><X size={14} /></button>
    </div>,
    document.body
  );

  return (
    <header className="app-header">
      <div className="header-brand">
        <Zap className="brand-icon" size={22} />
        <span className="brand-title">Live Node Flow Engine</span>
        <span className="version-badge">v{version}</span>
      </div>

      <div className="header-controls">
        <button className="btn btn-primary" onClick={onManualRun}>
          <Zap size={16} />
          <span>Run</span>
        </button>

        <button className="btn btn-secondary" onClick={() => { setNotice(''); setSaveError(''); setIsSaveModalOpen(true); }}>
          <Save size={16} />
          <span>Save</span>
        </button>

        <button className="btn btn-secondary" onClick={() => { setNotice(''); setSavedGraphs([]); setIsLoadModalOpen(true); fetchSavedGraphs(); }}>
          <FolderOpen size={16} />
          <span>Load</span>
        </button>
      </div>

      {/* Execution Status Indicator */}
      <div className={`status-pill status-${executionStatus}`}>
        {executionStatus === 'running' && <RefreshCw size={14} className="spin" />}
        {executionStatus === 'success' && <CheckCircle2 size={14} />}
        {executionStatus === 'error' && <AlertTriangle size={14} />}
        <span className="status-text">{executionStatus.toUpperCase()}</span>
      </div>

      {statusNotice}
      {saveModal}
      {loadModal}
    </header>
  );
};

export default Header;
