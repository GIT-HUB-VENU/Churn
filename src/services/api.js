const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';

export async function fetchHealth() {
  const res = await fetch(`${API_BASE}/health`);
  if (!res.ok) throw new Error('Failed to fetch health status');
  return res.json();
}

export async function fetchDashboard() {
  const res = await fetch(`${API_BASE}/dashboard`);
  if (!res.ok) throw new Error('Failed to fetch dashboard data');
  return res.json();
}

export async function fetchMembers(params = {}) {
  const query = new URLSearchParams();
  if (params.search) query.set('search', params.search);
  if (params.riskLevel) query.set('riskLevel', params.riskLevel);
  if (params.planType) query.set('planType', params.planType);
  if (params.page) query.set('page', String(params.page));
  if (params.limit) query.set('limit', String(params.limit));
  if (params.sortBy) query.set('sortBy', params.sortBy);
  if (params.sortOrder) query.set('sortOrder', params.sortOrder);

  const res = await fetch(`${API_BASE}/members?${query.toString()}`);
  if (!res.ok) throw new Error('Failed to fetch members list');
  return res.json();
}

export async function fetchMemberDetail(memberId) {
  const res = await fetch(`${API_BASE}/members/${encodeURIComponent(memberId)}`);
  if (!res.ok) throw new Error(`Failed to fetch details for member ${memberId}`);
  return res.json();
}

export async function fetchModelMetrics() {
  const res = await fetch(`${API_BASE}/model/metrics`);
  if (!res.ok) throw new Error('Failed to fetch model metrics');
  return res.json();
}

export async function fetchModelDrivers() {
  const res = await fetch(`${API_BASE}/model/drivers`);
  if (!res.ok) throw new Error('Failed to fetch global model drivers');
  return res.json();
}

export async function fetchRetentionSummary() {
  const res = await fetch(`${API_BASE}/retention/summary`);
  if (!res.ok) throw new Error('Failed to fetch retention summary');
  return res.json();
}

export async function uploadCsvDataset(csvContent, fileName) {
  const res = await fetch(`${API_BASE}/upload-csv`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ csvContent, fileName }),
  });
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.detail || errData.error || 'Failed to upload CSV dataset');
  }
  return res.json();
}

export async function resetDefaultDataset() {
  const res = await fetch(`${API_BASE}/reset-dataset`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.detail || errData.error || 'Failed to reset to default dataset');
  }
  return res.json();
}

export async function updateRiskThresholds(lowMax, mediumMax) {
  const res = await fetch(`${API_BASE}/config/thresholds`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ lowMax, mediumMax }),
  });
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.detail || errData.error || 'Failed to update thresholds');
  }
  return res.json();
}
