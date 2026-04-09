import * as client from './client';

/**
 * GET /api/admin/images?orphanOnly=false
 * Returns all uploaded files annotated with linked/orphaned status.
 */
export function listImages(orphanOnly = false) {
  return client.get('/api/admin/images', { orphanOnly });
}

/**
 * DELETE /api/admin/images/{filename}
 * Permanently deletes a single file.
 */
export function deleteImage(filename) {
  return client.del(`/api/admin/images/${encodeURIComponent(filename)}`);
}

/**
 * POST /api/admin/images/bulk-delete
 * Body: { filenames: string[] }
 */
export function bulkDeleteImages(filenames) {
  return client.post('/api/admin/images/bulk-delete', { filenames });
}
