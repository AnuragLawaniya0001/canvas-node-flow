const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const graphRoutes = require('./routes/graphRoutes');
const healthRoutes = require('./routes/healthRoutes');

const app = express();
const PORT = process.env.PORT || 3001;

// Connect Database
connectDB();

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Routes
app.use('/', healthRoutes);
app.use('/api', graphRoutes);

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ status: 'error', message: 'Endpoint not found' });
});

app.listen(PORT, () => {
  console.log(`[API Server] Running on port ${PORT}`);
});

module.exports = app;
