import client from "./client";

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------
export const authApi = {
  login: (username, password) => client.post("/auth/login/", { username, password }),
  refresh: (refresh) => client.post("/auth/refresh/", { refresh }),
  me: () => client.get("/auth/me/"),
};

// ---------------------------------------------------------------------------
// Lookup / catalogue
// ---------------------------------------------------------------------------
export const consultationTypesApi = {
  list: (params) => client.get("/consultation-types/", { params }),
  create: (data) => client.post("/consultation-types/", data),
  update: (id, data) => client.patch(`/consultation-types/${id}/`, data),
  remove: (id) => client.delete(`/consultation-types/${id}/`),
};

export const icd10Api = {
  list: (params) => client.get("/icd10-codes/", { params }),
  create: (data) => client.post("/icd10-codes/", data),
  update: (id, data) => client.patch(`/icd10-codes/${id}/`, data),
  remove: (id) => client.delete(`/icd10-codes/${id}/`),
};

export const diagnosisNotesApi = {
  list: (params) => client.get("/diagnosis-notes/", { params }),
  create: (data) => client.post("/diagnosis-notes/", data),
  update: (id, data) => client.patch(`/diagnosis-notes/${id}/`, data),
  remove: (id) => client.delete(`/diagnosis-notes/${id}/`),
};

export const medicinesApi = {
  list: (params) => client.get("/medicines/", { params }),
  lowStock: () => client.get("/medicines/low_stock/"),
  create: (data) => client.post("/medicines/", data),
  update: (id, data) => client.patch(`/medicines/${id}/`, data),
  remove: (id) => client.delete(`/medicines/${id}/`),
};

// ---------------------------------------------------------------------------
// Users (admin)
// ---------------------------------------------------------------------------
export const usersApi = {
  list: (params) => client.get("/users/", { params }),
  create: (data) => client.post("/users/", data),
  update: (id, data) => client.patch(`/users/${id}/`, data),
  remove: (id) => client.delete(`/users/${id}/`),
};

// ---------------------------------------------------------------------------
// Patients
// ---------------------------------------------------------------------------
export const patientsApi = {
  list: (params) => client.get("/patients/", { params }),
  get: (id) => client.get(`/patients/${id}/`),
  create: (data) => client.post("/patients/", data),
  update: (id, data) => client.patch(`/patients/${id}/`, data),
};

// ---------------------------------------------------------------------------
// Visits
// ---------------------------------------------------------------------------
export const visitsApi = {
  list: (params) => client.get("/visits/", { params }),
  get: (id) => client.get(`/visits/${id}/`),
  create: (data) => client.post("/visits/", data),
  queue: () => client.get("/visits/queue/"),
  billingReady: () => client.get("/visits/billing_ready/"),
};

// ---------------------------------------------------------------------------
// Triage
// ---------------------------------------------------------------------------
export const triageApi = {
  create: (data) => client.post("/triages/", data),
};

// ---------------------------------------------------------------------------
// Consultations
// ---------------------------------------------------------------------------
export const consultationsApi = {
  list: (params) => client.get("/consultations/", { params }),
  get: (id) => client.get(`/consultations/${id}/`),
  create: (data) => client.post("/consultations/", data),
  update: (id, data) => client.patch(`/consultations/${id}/`, data),
  complete: (id) => client.post(`/consultations/${id}/complete/`),
};

export const consultationNotesApi = {
  create: (data) => client.post("/consultation-notes/", data),
  remove: (id) => client.delete(`/consultation-notes/${id}/`),
};

export const prescriptionsApi = {
  create: (data) => client.post("/prescriptions/", data),
  dispense: (id) => client.post(`/prescriptions/${id}/dispense/`),
};

// ---------------------------------------------------------------------------
// Payments / Walk-in sales
// ---------------------------------------------------------------------------
export const paymentsApi = {
  create: (data) => client.post("/payments/", data),
  list: (params) => client.get("/payments/", { params }),
};

export const walkInSalesApi = {
  list: (params) => client.get("/walkin-sales/", { params }),
  create: (data) => client.post("/walkin-sales/", data),
};

// ---------------------------------------------------------------------------
// Analytics
// ---------------------------------------------------------------------------
export const analyticsApi = {
  admin: (days = 14) => client.get("/analytics/admin/", { params: { days } }),
  doctor: (days = 14) => client.get("/analytics/doctor/", { params: { days } }),
  nurse: (days = 14) => client.get("/analytics/nurse/", { params: { days } }),
};