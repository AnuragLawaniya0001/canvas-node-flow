const mongoose = require('mongoose');

const GraphSchema = new mongoose.Schema({
  name: { type: String, default: 'Untitled Graph' },
  nodes: { type: Array, default: [] },
  edges: { type: Array, default: [] },
  version: { type: Number, default: 1 }
}, {
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: (_, ret) => {
      const serialized = { ...ret };
      const id = serialized._id ? serialized._id.toString() : serialized.id;
      delete serialized._id;
      delete serialized.__v;
      serialized.id = id;
      return serialized;
    }
  }
});

GraphSchema.virtual('id').get(function getId() {
  return this._id ? this._id.toString() : undefined;
});

module.exports = mongoose.model('Graph', GraphSchema);
