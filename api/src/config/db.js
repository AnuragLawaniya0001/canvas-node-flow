const mongoose = require('mongoose');

const connectDB = async () => {
  const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/graph_engine';
  try {
    await mongoose.connect(mongoURI);
    console.log(`[MongoDB] Connected successfully to ${mongoURI}`);
  } catch (err) {
    console.error(`[MongoDB] Connection error: ${err.message}`);
    // Non-fatal logging so app remains operational
  }
};

module.exports = connectDB;
