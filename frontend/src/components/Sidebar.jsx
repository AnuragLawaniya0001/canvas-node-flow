import React from 'react';
import { NODE_CONFIGS, NODE_TYPES } from '../nodeDefinitions';
import { Hash, Plus, X, Divide, Binary, Monitor, Layers } from 'lucide-react';

const ICON_MAP = {
  [NODE_TYPES.NUMBER]: Hash,
  [NODE_TYPES.ADD]: Plus,
  [NODE_TYPES.MULTIPLY]: X,
  [NODE_TYPES.DIVIDE]: Divide,
  [NODE_TYPES.FORMULA]: Binary,
  [NODE_TYPES.DISPLAY]: Monitor
};

const Sidebar = ({ onAddNode }) => {
  const onDragStart = (event, nodeType) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <aside className="app-sidebar">
      <div className="sidebar-header">
        <Layers size={18} />
        <span>Node Palette</span>
      </div>

      <div className="sidebar-list">
        {Object.values(NODE_CONFIGS).map((config) => {
          const IconComponent = ICON_MAP[config.type] || Layers;
          return (
            <div
              key={config.type}
              className="palette-item"
              onDragStart={(event) => onDragStart(event, config.type)}
              onClick={() => onAddNode(config.type)}
              draggable
            >
              <div className="palette-item-header">
                <span className="palette-icon" style={{ backgroundColor: config.color }}>
                  <IconComponent size={14} color="#fff" />
                </span>
                <span className="palette-title">{config.label}</span>
              </div>
              <p className="palette-desc">{config.description}</p>
            </div>
          );
        })}
      </div>
    </aside>
  );
};

export default Sidebar;
