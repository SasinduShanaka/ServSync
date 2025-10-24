// Simple admin API helpers
export async function getInsuranceTypes(){
  const res = await fetch('/api/insurance-types');
  if (!res.ok) throw new Error('Failed to load insurance types');
  return res.json();
}

export async function createInsuranceType(payload){
  const res = await fetch('/api/insurance-types', { method: 'POST', headers: { 'Content-Type':'application/json' }, body: JSON.stringify(payload) });
  if (!res.ok) throw new Error(await res.text() || 'Failed to create insurance type');
  return res.json();
}

export async function getBranches(){
  const res = await fetch('/api/branches');
  if (!res.ok) throw new Error('Failed to load branches');
  return res.json();
}

export async function createBranch(payload){
  const res = await fetch('/api/branches', { method: 'POST', headers: { 'Content-Type':'application/json' }, body: JSON.stringify(payload) });
  if (!res.ok) throw new Error(await res.text() || 'Failed to create branch');
  return res.json();
}

export async function addCounter(branchId, payload){
  const res = await fetch(`/api/branches/${branchId}/counters`, { method: 'POST', headers: { 'Content-Type':'application/json' }, body: JSON.stringify(payload) });
  if (!res.ok) throw new Error(await res.text() || 'Failed to add counter');
  return res.json();
}

export async function deleteCounter(branchId, counterId){
  const res = await fetch(`/api/branches/${branchId}/counters/${counterId}`, { method: 'DELETE' });
  if (!res.ok) throw new Error(await res.text() || 'Failed to delete counter');
  return res.json();
}
