export async function getSession(sessionId){
  const res = await fetch(`/api/sessions/${sessionId}`);
  if (!res.ok) throw new Error(`GET /api/sessions/${sessionId} failed: ${res.status}`);
  return res.json();
}
