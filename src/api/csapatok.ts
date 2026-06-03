import type { Csapat, CsapatLetrehozas } from "../types/index.js";

const BASE_URL = "http://localhost:3001";

// ─── Csapatok API ─────────────────────────────────────────────────────────────

export async function getCsapatok(): Promise<Csapat[]> {
  const res = await fetch(`${BASE_URL}/csapatok`);
  if (!res.ok) throw new Error("Nem sikerült betölteni a csapatokat.");
  return res.json() as Promise<Csapat[]>;
}

export async function getCsapat(id: number): Promise<Csapat> {
  const res = await fetch(`${BASE_URL}/csapatok/${id}`);
  if (!res.ok) throw new Error("A csapat nem található.");
  return res.json() as Promise<Csapat>;
}

export async function createCsapat(adat: CsapatLetrehozas): Promise<Csapat> {
  const res = await fetch(`${BASE_URL}/csapatok`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(adat),
  });
  if (!res.ok) throw new Error("Nem sikerült létrehozni a csapatot.");
  return res.json() as Promise<Csapat>;
}

export async function updateCsapat(id: number, adat: CsapatLetrehozas): Promise<Csapat> {
  const res = await fetch(`${BASE_URL}/csapatok/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...adat, id }),
  });
  if (!res.ok) throw new Error("Nem sikerült frissíteni a csapatot.");
  return res.json() as Promise<Csapat>;
}

export async function deleteCsapat(id: number): Promise<void> {
  const res = await fetch(`${BASE_URL}/csapatok/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Nem sikerült törölni a csapatot.");
}
