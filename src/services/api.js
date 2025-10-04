import axios from 'axios';
import {
  adminLoginUrl,
  employeeLoginUrl,
  superAdminLoginUrl,
  salonsUrl,
  salonsListUrl,
  appointmentsUrl,
  appointUrl,
  schedulesUrl,
  servicesUrl,
  employeesUrl,
  messagesUrl
} from '../apiUrls.js';

// Axios client with auth header injection
const client = axios.create();

client.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  const headers = { ...(config.headers || {}) };
  // Do not force JSON for FormData uploads; let browser set boundary
  const isFormData = typeof FormData !== 'undefined' && config?.data instanceof FormData;
  if (!isFormData && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }
  if (token) headers['Authorization'] = `Bearer ${token}`;
  config.headers = headers;
  return config;
});

const unwrap = (resp) => resp?.data?.data ?? resp?.data;
const toError = (error) => {
  const err = new Error(error?.response?.data?.message || error?.message || 'Request failed');
  err.status = error?.response?.status;
  err.data = error?.response?.data;
  throw err;
};

// ===== Auth =====
export const loginAdmin = async (payload) => client.post(adminLoginUrl, payload).then(unwrap).catch(toError);
export const loginEmployee = async (payload) => client.post(employeeLoginUrl, payload).then(unwrap).catch(toError);
export const loginSuperAdmin = async (payload) => client.post(superAdminLoginUrl, payload).then(unwrap).catch(toError);

// ===== Salons =====
export const getSalons = async () => client.get(salonsListUrl).then(unwrap).catch(toError);
export const getSalonById = async (id) => client.get(`${salonsUrl}/${id}`).then(unwrap).catch(toError);
export const updateSalon = async (id, payload) => client.put(`${salonsUrl}/${id}`, payload).then(unwrap).catch(toError);

// ===== Appointments =====
export const getAppointments = async () => client.get(appointmentsUrl).then(unwrap).catch(toError);
export const createAppointment = async (payload) => client.post(appointUrl, payload).then(unwrap).catch(toError);
export const updateAppointment = async (id, payload) => client.put(`${appointmentsUrl}/${id}`, payload).then(unwrap).catch(toError);
export const deleteAppointment = async (id) => client.delete(`${appointmentsUrl}/${id}`).then(unwrap).catch(toError);

// ===== Schedules =====
export const getSchedules = async () => client.get(schedulesUrl).then(unwrap).catch(toError);
export const getGroupedSchedules = async () => client.get(`${schedulesUrl}/grouped/by-date`).then(unwrap).catch(toError);
export const createSchedule = async (payload) => client.post(schedulesUrl, payload).then(unwrap).catch(toError);
export const updateSchedule = async (id, payload) => client.put(`${schedulesUrl}/${id}`, payload).then(unwrap).catch(toError);
export const deleteSchedule = async (id) => client.delete(`${schedulesUrl}/${id}`).then(unwrap).catch(toError);

// ===== Employees =====
export const getEmployees = async () => client.get(employeesUrl).then(unwrap).catch(toError);
export const createEmployee = async (payload) => client.post(employeesUrl, payload).then(unwrap).catch(toError);
export const updateEmployee = async (id, payload) => client.put(`${employeesUrl}/${id}`, payload).then(unwrap).catch(toError);
export const deleteEmployee = async (id) => client.delete(`${employeesUrl}/${id}`).then(unwrap).catch(toError);

// ===== Services =====
export const getServices = async () => client.get(servicesUrl).then(unwrap).catch(toError);
export const createService = async (payload) => client.post(servicesUrl, payload).then(unwrap).catch(toError);
export const updateService = async (id, payload) => client.put(`${servicesUrl}/${id}`, payload).then(unwrap).catch(toError);
export const deleteService = async (id) => client.delete(`${servicesUrl}/${id}`).then(unwrap).catch(toError);

// ===== Messages (backend not fully implemented) =====
export const getMessages = async () => client.get(messagesUrl).then(unwrap).catch(toError);
export const sendMessage = async (payload) => client.post(messagesUrl, payload).then(unwrap).catch(toError);

export default client;