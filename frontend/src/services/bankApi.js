export async function getBanks(search = '', limit = 50){
  const q = search ? `?search=${encodeURIComponent(search)}&limit=${limit}` : `?limit=${limit}`;
  const res = await fetch(`/api/banks${q}`, { credentials: 'include' });
  if (!res.ok) throw new Error(await res.text() || 'Failed to load banks');
  return res.json();
}

export async function getBranches(bankId, search = '', limit = 100){
  if (!bankId) return [];
  const q = search ? `?search=${encodeURIComponent(search)}&limit=${limit}` : `?limit=${limit}`;
  const res = await fetch(`/api/banks/${bankId}/branches${q}`, { credentials: 'include' });
  if (!res.ok) throw new Error(await res.text() || 'Failed to load branches');
  return res.json();
}
