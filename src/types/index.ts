// ─── Enums ───────────────────────────────────────────────────────────────────

export enum Pozicio {
  Kapus = "Kapus",
  Vedo = "Védő",
  Kozeppelyas = "Középpályás",
  Csatar = "Csatár",
}

export enum NezettNezet {
  Csapatok = "csapatok",
  Jatekosok = "jatekosok",
}

// ─── Interfaces ──────────────────────────────────────────────────────────────

export interface Csapat {
  id: number;
  nev: string;
  varos: string;
  alapitva: number;
  stadion: string;
  befogadokepesseg: number;
  szin: string;
  bajnoki_cimek: number;
  logo_emoji: string;
}

export interface CsapatLetrehozas extends Omit<Csapat, "id"> {}

export interface Jatekos {
  id: number;
  nev: string;
  csapat_id: number;
  pozicio: Pozicio;
  kor: number;
  allampolgarsag: string;
  meztszam: number;
  gol: number;
  meccs: number;
  erteke_m_eur: number;
}

export interface JatekosLetrehozas extends Omit<Jatekos, "id"> {}

export interface ApiAllapot {
  betolt: boolean;
  hiba: string | null;
}

export interface FormValidacioHiba {
  mezo: string;
  uzenet: string;
}
