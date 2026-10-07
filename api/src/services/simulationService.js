const axios = require('axios');

const SIMULATION_URL = process.env.SIMULATION_URL || 'http://localhost:8000';
const SIMULATION_TIMEOUT_MS = Number(process.env.SIMULATION_TIMEOUT_MS || 10000);

const toErrorEnvelope = (code, message, version = 1) => ({
  version,
  status: 'error',
  error: { code, message }
});

const forwardSimulationRequest = async (payload = {}) => {
  try {
    const response = await axios.post(`${SIMULATION_URL}/simulate`, payload, {
      timeout: SIMULATION_TIMEOUT_MS,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    return response.data;
  } catch (error) {
    const version = payload.version || 1;
    if (error.response) {
      const body = error.response.data || {};
      if (body.error) {
        return {
          ...body,
          version,
          status: body.status || 'error'
        };
      }
      return {
        version,
        status: 'error',
        error: {
          code: body.code || 'SIMULATION_ERROR',
          message: body.message || 'Simulation service returned an error'
        }
      };
    }
    if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
      return toErrorEnvelope('SIMULATION_SERVICE_UNAVAILABLE', 'Simulation service is unavailable', version);
    }
    if (error.code === 'ECONNABORTED') {
      return toErrorEnvelope('SIMULATION_TIMEOUT', 'Simulation request timed out', version);
    }
    return toErrorEnvelope('SIMULATION_ERROR', error.message || 'Error communicating with simulation engine', version);
  }
};

const checkSimulationHealth = async () => {
  try {
    const response = await axios.get(`${SIMULATION_URL}/health`, { timeout: 3000 });
    return response.data;
  } catch (err) {
    return { status: 'down', error: err.message };
  }
};

module.exports = {
  forwardSimulationRequest,
  checkSimulationHealth
};
