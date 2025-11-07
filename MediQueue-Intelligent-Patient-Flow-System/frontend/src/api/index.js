const BASE_URL = "http://127.0.0.1:5050";

export const fetchPatients = async () => {
  const res = await fetch(`${BASE_URL}/patients`);
  return res.json();
};

export const fetchDoctors = async () => {
  const res = await fetch(`${BASE_URL}/doctors`);
  return res.json();
};

export const fetchAppointments = async () => {
  const res = await fetch(`${BASE_URL}/appointments`);
  return res.json();
};

export const fetchQueue = async () => {
  const res = await fetch(`${BASE_URL}/queue`);
  return res.json();
};

export const fetchConsultations = async () => {
  const res = await fetch(`${BASE_URL}/consultations`);
  return res.json();
};

export const fetchBilling = async () => {
  const res = await fetch(`${BASE_URL}/billing`);
  return res.json();
};
