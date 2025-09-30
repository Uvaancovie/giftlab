"use server";

export async function getAmrodProducts() {
  const api = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080';
  const res = await fetch(`${api}/amrod/products`, { cache: 'no-store' });
  if (!res.ok) {
    // try to read server error message
    let text = await res.text().catch(()=>'');
    try { const j = JSON.parse(text); text = j.error || text; } catch(_) {}
    console.error('amrod products fetch failed:', res.status, text);
    return [];
  }
  const j = await res.json();
  return j.products ?? [];
}
