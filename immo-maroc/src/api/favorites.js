import * as client from './client';

/** GET /api/favorites (auth required) */
export function getMyFavorites() {
  return client.get('/api/favorites');
}

/** POST /api/favorites/{propertyId} */
export function addFavorite(propertyId) {
  return client.post(`/api/favorites/${propertyId}`);
}

/** DELETE /api/favorites/{propertyId} */
export function removeFavorite(propertyId) {
  return client.del(`/api/favorites/${propertyId}`);
}
