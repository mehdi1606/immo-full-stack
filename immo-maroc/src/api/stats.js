/**
 * Stats API — all endpoints require ADMIN role
 * Backend: GET /api/stats/*
 */
import * as client from './client';

/** Overview KPIs: totalListings, activeListings, totalAgents, activeAgents,
 *  totalSold, totalRented, totalViews, newListingsThisMonth */
export function getStatsOverview() {
  return client.get('/api/stats/overview');
}

/** Monthly listing counts: [{ month, year, count }] */
export function getStatsByMonth() {
  return client.get('/api/stats/by-month');
}

/** Listings per city: [{ city, count }] */
export function getStatsByCity() {
  return client.get('/api/stats/by-city');
}

/** Listings per property type: [{ type, count }] */
export function getStatsByType() {
  return client.get('/api/stats/by-type');
}

/** Top agents by listing count: [AgentSummaryResponse] */
export function getTopAgents() {
  return client.get('/api/stats/top-agents');
}
