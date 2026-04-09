import * as client from './client';

/**
 * POST /api/sell-requests (public)
 * body: { name, phone, email, city, propertyType, purpose, price?, area?, rooms?, title?, description? }
 */
export function createSellRequest(data) {
  return client.post('/api/sell-requests', data);
}

/** GET /api/sell-requests?status= (ADMIN) */
export function getAllSellRequests(status) {
  return client.get('/api/sell-requests', status ? { status } : {});
}

/** PATCH /api/sell-requests/{id}/status */
export function updateSellRequestStatus(id, status) {
  return client.patch(`/api/sell-requests/${id}/status`, { status });
}

/** PATCH /api/sell-requests/{id}/assign — body: { agentId } */
export function assignSellRequest(id, agentId) {
  return client.patch(`/api/sell-requests/${id}/assign`, { agentId });
}
