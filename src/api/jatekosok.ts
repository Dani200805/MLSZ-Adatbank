import type { Jatekos, JatekosLetrehozas } from "../types/index.js";

const BASE_URL = "http://localhost:3001";

// ─── Játékosok API ────────────────────────────────────────────────────────────

export async function getJatekosok(): Promise<Jatekos[]> {
  const res = await fetch(`${BASE_URL}/jatekosok`);
  if (!res.ok) throw new Error("Nem sikerült betölteni a játékosokat.");
  return res.json() as Promise<Jatekos[]>;
}

export async function getJatekos(id: number): Promise<Jatekos> {
  const res = await fetch(`${BASE_URL}/jatekosok/${id}`);
  if (!res.ok) throw new Error("A játékos nem található.");
  return res.json() as Promise<Jatekos>;
}

export async function getJatekosokByCsapat(csapat_id: number): Promise<Jatekos[]> {
  const res = await fetch(`${BASE_URL}/jatekosok?csapat_id=${csapat_id}`);
  if (!res.ok) throw new Error("Nem sikerült betölteni a csapat játékosait.");
  return res.json() as Promise<Jatekos[]>;
}

export async function createJatekos(adat: JatekosLetrehozas): Promise<Jatekos> {
  const res = await fetch(`${BASE_URL}/jatekosok`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(adat),
  });
  if (!res.ok) throw new Error("Nem sikerült létrehozni a játékost.");
  return res.json() as Promise<Jatekos>;
}

export async function updateJatekos(id: number, adat: JatekosLetrehozas): Promise<Jatekos> {
  const res = await fetch(`${BASE_URL}/jatekosok/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...adat, id }),
  });
  if (!res.ok) throw new Error("Nem sikerült frissíteni a játékost.");
  return res.json() as Promise<Jatekos>;
}

export async function deleteJatekos(id: number): Promise<void> {
  const res = await fetch(`${BASE_URL}/jatekosok/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Nem sikerült törölni a játékost.");
}
