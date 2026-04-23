import * as client from './client';

/**
 * GET /api/properties
 * params: page, size, city, type, purpose, status, minPrice, maxPrice, minRooms, q, sortBy, lang
 * Returns: { content: [], totalElements, totalPages, number }
 */
export function searchProperties(params = {}) {
  const cleanParams = Object.fromEntries(
    Object.entries(params).filter(([, v]) => v !== '' && v !== undefined && v !== null)
  );
  return client.get('/api/properties', cleanParams);
}

/** GET /api/properties/featured */
export function getFeaturedProperties() {
  return client.get('/api/properties/featured');
}

/** GET /api/properties/{id} */
export function getPropertyById(id) {
  return client.get(`/api/properties/${id}`);
}

/** GET /api/properties/agent/{agentId} */
export function getPropertiesByAgent(agentId) {
  return client.get(`/api/properties/agent/${agentId}`);
}

/** POST /api/upload/image — upload a single image file, returns { url, filename } */
export function uploadPropertyImage(file) {
  const fd = new FormData();
  fd.append('file', file);
  return client.post('/api/upload/image', fd, true);
}

/** POST /api/properties — JSON body */
export function createProperty(body) {
  return client.post('/api/properties', body);
}

/** PUT /api/properties/{id} — JSON body */
export function updateProperty(id, body) {
  return client.put(`/api/properties/${id}`, body);
}

/** DELETE /api/properties/{id} */
export function deleteProperty(id) {
  return client.del(`/api/properties/${id}`);
}

/** PATCH /api/properties/{id}/featured */
export function toggleFeatured(id) {
  return client.patch(`/api/properties/${id}/featured`);
}

/** PATCH /api/properties/{id}/status */
export function updatePropertyStatus(id, status) {
  return client.patch(`/api/properties/${id}/status`, { status });
}

/** PATCH /api/properties/{id}/views */
export function incrementView(id) {
  return client.patch(`/api/properties/${id}/views`);
}

/** GET /api/properties/admin/expired — listings VENDU/LOUÉ for > 30 days (ADMIN only) */
export function getExpiredListings() {
  return client.get('/api/properties/admin/expired');
}

/** Build absolute image URL from a relative path, full URL, or image object */
export function getImageUrl(img) {
  if (!img) return 'https://placehold.co/400x300?text=IMMO 21';
  if (typeof img === 'object') img = img.url || '';
  if (!img) return 'https://placehold.co/400x300?text=IMMO 21';
  if (img.startsWith('http')) return img;
  // Backend returns relative paths like "/uploads/filename.jpg"
  // Use relative URL so Nginx serves it in Docker and Vite proxy handles it in dev
  return img.startsWith('/') ? img : '/' + img;
}

/** Build absolute avatar URL (falls back to generated placeholder) */
export function getAvatarUrl(avatar) {
  if (!avatar) return 'https://ui-avatars.com/api/?background=1a3a5c&color=fff&name=Agent&size=128';
  if (avatar.startsWith('http')) return avatar;
  return avatar.startsWith('/') ? avatar : '/' + avatar;
}
