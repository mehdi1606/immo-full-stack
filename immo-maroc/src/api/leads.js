import * as client from './client';

/** POST /api/leads (public) — body: { name, phone, email, message, propertyId } */
export function createLead(data) {
  return client.post('/api/leads', data);
}

/** GET /api/leads/mine?status= (AGENT) */
export function getMyLeads(status) {
  return client.get('/api/leads/mine', status ? { status } : {});
}

/** GET /api/leads?status= (ADMIN) */
export function getAllLeads(status) {
  return client.get('/api/leads', status ? { status } : {});
}

/** PATCH /api/leads/{id}/status — body: { status } */
export function updateLeadStatus(id, status) {
  return client.patch(`/api/leads/${id}/status`, { status });
}
