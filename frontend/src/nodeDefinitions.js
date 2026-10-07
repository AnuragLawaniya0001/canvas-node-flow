export const NODE_TYPES = {
  NUMBER: 'number',
  ADD: 'add',
  MULTIPLY: 'multiply',
  DIVIDE: 'divide',
  FORMULA: 'formula',
  DISPLAY: 'display'
};

export const NODE_CONFIGS = {
  [NODE_TYPES.NUMBER]: {
    type: NODE_TYPES.NUMBER,
    label: 'Number',
    category: 'Inputs',
    description: 'Constant numeric value source',
    inputs: [],
    outputs: [{ id: 'out', label: 'out' }],
    defaultData: { value: 2 },
    color: '#3b82f6' // blue
  },
  [NODE_TYPES.ADD]: {
    type: NODE_TYPES.ADD,
    label: 'Add',
    category: 'Math',
    description: 'Calculates a + b',
    inputs: [
      { id: 'a', label: 'a' },
      { id: 'b', label: 'b' }
    ],
    outputs: [{ id: 'out', label: 'out' }],
    defaultData: {},
    color: '#10b981' // green
  },
  [NODE_TYPES.MULTIPLY]: {
    type: NODE_TYPES.MULTIPLY,
    label: 'Multiply',
    category: 'Math',
    description: 'Calculates a * b',
    inputs: [
      { id: 'a', label: 'a' },
      { id: 'b', label: 'b' }
    ],
    outputs: [{ id: 'out', label: 'out' }],
    defaultData: {},
    color: '#8b5cf6' // purple
  },
  [NODE_TYPES.DIVIDE]: {
    type: NODE_TYPES.DIVIDE,
    label: 'Divide',
    category: 'Math',
    description: 'Calculates a / b',
    inputs: [
      { id: 'a', label: 'a' },
      { id: 'b', label: 'b' }
    ],
    outputs: [{ id: 'out', label: 'out' }],
    defaultData: {},
    color: '#f59e0b' // amber
  },
  [NODE_TYPES.FORMULA]: {
    type: NODE_TYPES.FORMULA,
    label: 'Formula',
    category: 'Custom',
    description: 'Safe mathematical expression (e.g. a * 2 + b)',
    inputs: [
      { id: 'a', label: 'a' },
      { id: 'b', label: 'b' }
    ],
    outputs: [{ id: 'out', label: 'out' }],
    defaultData: { formula: 'a * 2 + b' },
    color: '#ec4899' // pink
  },
  [NODE_TYPES.DISPLAY]: {
    type: NODE_TYPES.DISPLAY,
    label: 'Display',
    category: 'Outputs',
    description: 'Displays input value',
    inputs: [{ id: 'a', label: 'in' }],
    outputs: [],
    defaultData: {},
    color: '#06b6d4' // cyan
  }
};
