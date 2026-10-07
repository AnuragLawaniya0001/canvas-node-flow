import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

export const simulateGraphApi = async (payload, signal) => {
  try {
    const response = await apiClient.post('/api/simulate', payload, { signal });
    return response.data;
  } catch (error) {
    if (axios.isCancel(error)) {
      return { canceled: true };
    }
    if (error.response) {
      return error.response.data;
    }
    return {
      version: payload.version,
      status: 'error',
      errorCode: 'API_CONNECTION_ERROR',
      message: 'Failed to connect to Node API server'
    };
  }
};

const normalizeSuccessResponse = (payload) => {
  if (payload && payload.status === 'success') {
    return payload;
  }

  if (Array.isArray(payload)) {
    return { status: 'success', data: payload };
  }

  if (payload && typeof payload === 'object' && payload.data !== undefined) {
    return { status: 'success', data: payload.data };
  }

  return { status: 'success', data: payload };
};

export const saveGraphApi = async (graphData) => {
  const response = await apiClient.post('/api/graphs', graphData);
  return normalizeSuccessResponse(response.data);
};

export const listGraphsApi = async () => {
  const response = await apiClient.get('/api/graphs');
  return normalizeSuccessResponse(response.data);
};

export const getGraphApi = async (id) => {
  const response = await apiClient.get(`/api/graphs/${id}`);
  return normalizeSuccessResponse(response.data);
};

export const updateGraphApi = async (id, graphData) => {
  const response = await apiClient.put(`/api/graphs/${id}`, graphData);
  return normalizeSuccessResponse(response.data);
};

export const deleteGraphApi = async (id) => {
  const response = await apiClient.delete(`/api/graphs/${id}`);
  return normalizeSuccessResponse(response.data);
};

export const checkHealthApi = async () => {
  try {
    const response = await apiClient.get('/health', { timeout: 3000 });
    return response.data;
  } catch (err) {
    return { status: 'down', error: err.message };
  }
};
