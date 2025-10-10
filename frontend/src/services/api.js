import axios from 'axios';

const API_BASE_URL = 'http://localhost:5001';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Patient API
export const patientAPI = {
  getAll: () => api.get('/patients'),
  create: (data) => api.post('/patients', data),
  update: (id, data) => api.put(`/patients/${id}`, data),
  delete: (id) => api.delete(`/patients/${id}`),
};

// Doctor API
export const doctorAPI = {
  getAll: () => api.get('/doctors'),
  create: (data) => api.post('/doctors', data),
  update: (id, data) => api.put(`/doctors/${id}`, data),
  delete: (id) => api.delete(`/doctors/${id}`),
};

// Appointment API
export const appointmentAPI = {
  getAll: () => api.get('/appointments'),
  create: (data) => api.post('/appointments', data),
  update: (id, data) => api.put(`/appointments/${id}`, data),
  delete: (id) => api.delete(`/appointments/${id}`),
};

// Consultation API
export const consultationAPI = {
  getAll: () => api.get('/consultations'),
  create: (data) => api.post('/consultations', data),
  update: (id, data) => api.put(`/consultations/${id}`, data),
  delete: (id) => api.delete(`/consultations/${id}`),
};

// Billing API
export const billingAPI = {
  getAll: () => api.get('/billing'),
  create: (data) => api.post('/billing', data),
  update: (id, data) => api.put(`/billing/${id}`, data),
  delete: (id) => api.delete(`/billing/${id}`),
};

// Queue API
export const queueAPI = {
  getAll: () => api.get('/queue'),
  create: (data) => api.post('/queue', data),
  update: (id, data) => api.put(`/queue/${id}`, data),
  delete: (id) => api.delete(`/queue/${id}`),
};

export default api;
