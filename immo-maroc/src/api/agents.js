import * as client from './client';

/** GET /api/agents?city= (public — active agents only) */
export function getAllAgents(city) {
  return client.get('/api/agents', city ? { city } : {});
}

/** GET /api/agents/admin/all (ADMIN only — all agents including inactive) */
export function getAllAgentsAdmin() {
  return client.get('/api/agents/admin/all');
}

/** GET /api/agents/{id} */
export function getAgentById(id) {
  return client.get(`/api/agents/${id}`);
}

/** POST /api/agents (ADMIN) */
export function createAgent(data) {
  return client.post('/api/agents', data);
}

/** PUT /api/agents/{id} (ADMIN) */
export function updateAgent(id, data) {
  return client.put(`/api/agents/${id}`, data);
}

/** DELETE /api/agents/{id} (ADMIN) */
export function deleteAgent(id) {
  return client.del(`/api/agents/${id}`);
}

/** PATCH /api/agents/{id}/status (ADMIN) */
export function toggleAgentStatus(id) {
  return client.patch(`/api/agents/${id}/status`);
}

/** PUT /api/agents/me/profile (AGENT) */
export function updateMyProfile(data) {
  return client.put('/api/agents/me/profile', data);
}

/** POST /api/agents/{id}/reset-password (ADMIN) */
export function resetAgentPassword(id) {
  return client.post(`/api/agents/${id}/reset-password`);
}

/** POST /api/upload/image — upload avatar file, returns { filename, url } */
export function uploadAvatar(file) {
  const fd = new FormData();
  fd.append('file', file);
  return client.post('/api/upload/image', fd, true);
}
