import type { Csapat, CsapatLetrehozas, FormValidacioHiba } from "../types/index.js";
import {
  getCsapatok, createCsapat, updateCsapat, deleteCsapat
} from "../api/csapatok.js";
import { getJatekosokByCsapat } from "../api/jatekosok.js";
import { showToast, confirmDialog, renderBetoltes, renderHiba, renderUres } from "./utils.js";
import { renderJatekosokCsapathoz } from "./jatekosok.js";

let csapatokCache: Csapat[] = [];
let aktivCsapatId: number | null = null;

// ─── Validáció ──────────────────────────────────────────────────────────────
function validateCsapat(adat: Partial<CsapatLetrehozas>): FormValidacioHiba[] {
  const hibak: FormValidacioHiba[] = [];
  if (!adat.nev?.trim()) hibak.push({ mezo: "nev", uzenet: "A csapat neve kötelező." });
  if (!adat.varos?.trim()) hibak.push({ mezo: "varos", uzenet: "A város neve kötelező." });
  if (!adat.alapitva || adat.alapitva < 1800 || adat.alapitva > 2025)
    hibak.push({ mezo: "alapitva", uzenet: "Érvényes alapítási évet adj meg (1800–2025)." });
  if (!adat.stadion?.trim()) hibak.push({ mezo: "stadion", uzenet: "A stadion neve kötelező." });
  if (!adat.befogadokepesseg || adat.befogadokepesseg < 100)
    hibak.push({ mezo: "befogadokepesseg", uzenet: "A befogadóképesség legalább 100 kell legyen." });
  if (adat.bajnoki_cimek === undefined || adat.bajnoki_cimek < 0)
    hibak.push({ mezo: "bajnoki_cimek", uzenet: "A bajnoki címek száma nem lehet negatív." });
  return hibak;
}

// ─── Csapatok listázása ──────────────────────────────────────────────────────
export async function renderCsapatok(kontener: HTMLElement): Promise<void> {
  if (aktivCsapatId !== null) {
    await renderCsapatReszlet(kontener, aktivCsapatId);
    return;
  }

  kontener.innerHTML = `
    <div class="nezet-kontener">
      <div class="oldal-fejlec">
        <div>
          <div class="oldal-cim">CSAPATOK <span>NÉZŐ</span></div>
          <div style="color: var(--szin-szurke); font-size: 0.85rem; margin-top: 0.3rem;">Magyar labdarúgó csapatok adatbázisa</div>
        </div>
        <div class="oldal-statisztika" id="csapat-statisztikak"></div>
      </div>
      <div class="eszkoztar">
        <div class="kereses-mezo">
          <span class="kereses-ikon">🔍</span>
          <input type="text" id="csapat-kereses" placeholder="Csapatnév, város keresése…">
        </div>
        <button class="gomb gomb-elsodleges" id="uj-csapat-gomb">+ Új csapat</button>
      </div>
      <div id="csapat-tartalom"></div>
    </div>
  `;

  const tartalom = kontener.querySelector<HTMLElement>("#csapat-tartalom")!;
  const statTerulet = kontener.querySelector<HTMLElement>("#csapat-statisztikak")!;

  tartalom.innerHTML = renderBetoltes();

  try {
    csapatokCache = await getCsapatok();
    renderStatisztikak(statTerulet, csapatokCache);
    renderCsapatKartyak(tartalom, csapatokCache);

    kontener.querySelector<HTMLInputElement>("#csapat-kereses")?.addEventListener("input", (e) => {
      const q = (e.target as HTMLInputElement).value.toLowerCase();
      const szurt = csapatokCache.filter(c =>
        c.nev.toLowerCase().includes(q) || c.varos.toLowerCase().includes(q)
      );
      renderCsapatKartyak(tartalom, szurt);
    });

    kontener.querySelector("#uj-csapat-gomb")?.addEventListener("click", () => {
      showCsapatModal(null, kontener);
    });

  } catch (err) {
    tartalom.innerHTML = renderHiba((err as Error).message);
  }
}

function renderStatisztikak(el: HTMLElement, csapatok: Csapat[]): void {
  const osszCim = csapatok.reduce((s, c) => s + c.bajnoki_cimek, 0);
  const osszFero = csapatok.reduce((s, c) => s + c.befogadokepesseg, 0);
  el.innerHTML = `
    <div class="stat-elem"><div class="stat-szam">${csapatok.length}</div><div class="stat-cimke">Csapat</div></div>
    <div class="stat-elem"><div class="stat-szam">${osszCim}</div><div class="stat-cimke">Bajnoki cím</div></div>
    <div class="stat-elem"><div class="stat-szam">${(osszFero / 1000).toFixed(0)}K</div><div class="stat-cimke">Össz. kapacitás</div></div>
  `;
}

function renderCsapatKartyak(kontener: HTMLElement, csapatok: Csapat[]): void {
  if (csapatok.length === 0) {
    kontener.innerHTML = renderUres("Nincs megjeleníthető csapat.", "🏟️");
    return;
  }
  kontener.innerHTML = `<div class="kartya-racs">${csapatok.map(csapatKartyaHTML).join("")}</div>`;

  csapatok.forEach(c => {
    const kartya = kontener.querySelector(`[data-id="${c.id}"]`);
    kartya?.addEventListener("click", (e) => {
      const target = e.target as HTMLElement;
      if (target.closest("[data-akcio]")) return;
      aktivCsapatId = c.id;
      const foKontener = document.querySelector<HTMLElement>("#nezet-kontener")!;
      renderCsapatReszlet(foKontener, c.id);
    });
    kartya?.querySelector("[data-akcio='szerkeszt']")?.addEventListener("click", (e) => {
      e.stopPropagation();
      const foKontener = document.querySelector<HTMLElement>("#fo-tartalom")!;
      showCsapatModal(c, foKontener);
    });
    kartya?.querySelector("[data-akcio='torol']")?.addEventListener("click", async (e) => {
      e.stopPropagation();
      if (await confirmDialog(`Biztosan törlöd a(z) ${c.nev} csapatot?`)) {
        try {
          await deleteCsapat(c.id);
          csapatokCache = csapatokCache.filter(x => x.id !== c.id);
          const racs = kontener.querySelector(".kartya-racs");
          if (racs) renderCsapatKartyak(kontener, csapatokCache);
          showToast(`${c.nev} törölve.`, "siker");
        } catch (err) {
          showToast((err as Error).message, "hiba");
        }
      }
    });
  });
}

function csapatKartyaHTML(c: Csapat): string {
  return `
    <div class="csapat-kartya" data-id="${c.id}" style="--csapat-szin: ${c.szin}">
      <div class="csapat-kartya-fejlec">
        <div class="csapat-emoji">${c.logo_emoji}</div>
        <div>
          <div class="csapat-kartya-nev">${c.nev}</div>
          <div class="csapat-kartya-varos">📍 ${c.varos}</div>
        </div>
      </div>
      <div class="csapat-kartya-adatok">
        <div class="adat-elem">
          <span class="adat-cimke">Alapítva</span>
          <span class="adat-ertek">${c.alapitva}</span>
        </div>
        <div class="adat-elem">
          <span class="adat-cimke">Bajnoki cím</span>
          <span class="adat-ertek bajnoki-cimek">${c.bajnoki_cimek} 🏆</span>
        </div>
        <div class="adat-elem">
          <span class="adat-cimke">Stadion</span>
          <span class="adat-ertek" style="font-size:0.82rem">${c.stadion}</span>
        </div>
        <div class="adat-elem">
          <span class="adat-cimke">Kapacitás</span>
          <span class="adat-ertek">${c.befogadokepesseg.toLocaleString("hu")}</span>
        </div>
      </div>
      <div class="csapat-kartya-lab">
        <button class="gomb gomb-masodlagos gomb-kicsi" data-akcio="szerkeszt">✏️ Szerkeszt</button>
        <button class="gomb gomb-veszelyes gomb-kicsi" data-akcio="torol">🗑️ Töröl</button>
      </div>
    </div>
  `;
}

// ─── Csapat részletek ─────────────────────────────────────────────────────────
async function renderCsapatReszlet(kontener: HTMLElement, id: number): Promise<void> {
  kontener.innerHTML = renderBetoltes();
  try {
    const csapat = csapatokCache.find(c => c.id === id) || await getCsapatok().then(list => list.find(c => c.id === id)!);
    const jatekosok = await getJatekosokByCsapat(id);

    kontener.innerHTML = `
      <div class="nezet-kontener">
        <button class="vissza-gomb" id="vissza-gomb">← Vissza a csapatokhoz</button>
        <div class="reszlet-panel" style="border-top: 3px solid ${csapat.szin}">
          <div class="reszlet-fejlec">
            <div class="reszlet-emoji">${csapat.logo_emoji}</div>
            <div>
              <div class="reszlet-nev">${csapat.nev}</div>
              <div class="reszlet-alcim">📍 ${csapat.varos} · Alapítva: ${csapat.alapitva}</div>
            </div>
            <div style="margin-left:auto; display:flex; gap:0.5rem;">
              <button class="gomb gomb-iktat" id="reszlet-szerkeszt">✏️ Szerkeszt</button>
            </div>
          </div>
          <div class="reszlet-stat-racs">
            <div class="reszlet-stat-elem">
              <div class="reszlet-stat-cimke">Stadion</div>
              <div style="font-family:var(--betutipus-kondenzalt); font-size:1rem; color:var(--szin-feher)">${csapat.stadion}</div>
            </div>
            <div class="reszlet-stat-elem">
              <div class="reszlet-stat-cimke">Kapacitás</div>
              <div class="reszlet-stat-ertek">${csapat.befogadokepesseg.toLocaleString("hu")}</div>
            </div>
            <div class="reszlet-stat-elem">
              <div class="reszlet-stat-cimke">Bajnoki cím</div>
              <div class="reszlet-stat-ertek arany">${csapat.bajnoki_cimek} 🏆</div>
            </div>
            <div class="reszlet-stat-elem">
              <div class="reszlet-stat-cimke">Keret mérete</div>
              <div class="reszlet-stat-ertek zold">${jatekosok.length} fő</div>
            </div>
          </div>
        </div>
        <div style="margin: 1.5rem 0 0.75rem; font-family: var(--betutipus-cim); font-size: 1.6rem; letter-spacing: 2px;">
          KERET <span style="color: var(--szin-zold)">TAGJAI</span>
        </div>
        <div id="keret-jatekosok"></div>
      </div>
    `;

    kontener.querySelector("#vissza-gomb")?.addEventListener("click", () => {
      aktivCsapatId = null;
      renderCsapatok(kontener);
    });

    kontener.querySelector("#reszlet-szerkeszt")?.addEventListener("click", () => {
      showCsapatModal(csapat, kontener);
    });

    const keretEl = kontener.querySelector<HTMLElement>("#keret-jatekosok")!;
    renderJatekosokCsapathoz(keretEl, jatekosok, csapatokCache);

  } catch (err) {
    kontener.innerHTML = renderHiba((err as Error).message);
  }
}

// ─── Csapat modal (Create / Edit) ─────────────────────────────────────────────
function showCsapatModal(csapat: Csapat | null, kontener: HTMLElement): void {
  const szerkesztes = csapat !== null;
  const modal = document.createElement("div");
  modal.className = "modal-hatter";
  modal.innerHTML = `
    <div class="modal-doboz">
      <div class="modal-fejlec">
        <div class="modal-cim">${szerkesztes ? "SZERKESZTÉS" : "ÚJ CSAPAT"}</div>
        <button class="modal-zaro" id="modal-zaro">✕</button>
      </div>
      <div class="modal-tartalom">
        <div class="urlap-csoport">
          <label class="urlap-cimke">Csapat neve *</label>
          <input class="urlap-mezo" id="f-nev" type="text" value="${csapat?.nev ?? ""}" placeholder="pl. Ferencvárosi TC">
          <div class="urlap-hiba-uzenet" id="err-nev"></div>
        </div>
        <div class="urlap-sor">
          <div class="urlap-csoport">
            <label class="urlap-cimke">Város *</label>
            <input class="urlap-mezo" id="f-varos" type="text" value="${csapat?.varos ?? ""}" placeholder="pl. Budapest">
            <div class="urlap-hiba-uzenet" id="err-varos"></div>
          </div>
          <div class="urlap-csoport">
            <label class="urlap-cimke">Alapítva *</label>
            <input class="urlap-mezo" id="f-alapitva" type="number" value="${csapat?.alapitva ?? ""}" placeholder="1899">
            <div class="urlap-hiba-uzenet" id="err-alapitva"></div>
          </div>
        </div>
        <div class="urlap-csoport">
          <label class="urlap-cimke">Stadion neve *</label>
          <input class="urlap-mezo" id="f-stadion" type="text" value="${csapat?.stadion ?? ""}" placeholder="pl. Groupama Aréna">
          <div class="urlap-hiba-uzenet" id="err-stadion"></div>
        </div>
        <div class="urlap-sor">
          <div class="urlap-csoport">
            <label class="urlap-cimke">Befogadóképesség *</label>
            <input class="urlap-mezo" id="f-befogado" type="number" value="${csapat?.befogadokepesseg ?? ""}" placeholder="22000">
            <div class="urlap-hiba-uzenet" id="err-befogadokepesseg"></div>
          </div>
          <div class="urlap-csoport">
            <label class="urlap-cimke">Bajnoki címek *</label>
            <input class="urlap-mezo" id="f-bajnoki" type="number" value="${csapat?.bajnoki_cimek ?? 0}" min="0">
            <div class="urlap-hiba-uzenet" id="err-bajnoki_cimek"></div>
          </div>
        </div>
        <div class="urlap-sor">
          <div class="urlap-csoport">
            <label class="urlap-cimke">Csapatszín (HEX)</label>
            <input class="urlap-mezo" id="f-szin" type="text" value="${csapat?.szin ?? "#2ECC71"}" placeholder="#007A3D">
          </div>
          <div class="urlap-csoport">
            <label class="urlap-cimke">Emoji / jelkép</label>
            <input class="urlap-mezo" id="f-emoji" type="text" value="${csapat?.logo_emoji ?? "⚽"}" placeholder="🦅">
          </div>
        </div>
      </div>
      <div class="modal-lab">
        <button class="gomb gomb-masodlagos" id="modal-megse">Mégsem</button>
        <button class="gomb gomb-elsodleges" id="modal-ment">💾 Mentés</button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  const zaras = () => document.body.removeChild(modal);
  modal.querySelector("#modal-zaro")?.addEventListener("click", zaras);
  modal.querySelector("#modal-megse")?.addEventListener("click", zaras);
  modal.addEventListener("click", (e) => { if (e.target === modal) zaras(); });

  modal.querySelector("#modal-ment")?.addEventListener("click", async () => {
    const adat: Partial<CsapatLetrehozas> = {
      nev:               (modal.querySelector<HTMLInputElement>("#f-nev")!).value.trim(),
      varos:             (modal.querySelector<HTMLInputElement>("#f-varos")!).value.trim(),
      alapitva:          parseInt((modal.querySelector<HTMLInputElement>("#f-alapitva")!).value),
      stadion:           (modal.querySelector<HTMLInputElement>("#f-stadion")!).value.trim(),
      befogadokepesseg:  parseInt((modal.querySelector<HTMLInputElement>("#f-befogado")!).value),
      bajnoki_cimek:     parseInt((modal.querySelector<HTMLInputElement>("#f-bajnoki")!).value),
      szin:              (modal.querySelector<HTMLInputElement>("#f-szin")!).value.trim() || "#2ECC71",
      logo_emoji:        (modal.querySelector<HTMLInputElement>("#f-emoji")!).value.trim() || "⚽",
    };

    // Hibák törlése
    modal.querySelectorAll(".urlap-mezo").forEach(m => m.classList.remove("hiba"));
    modal.querySelectorAll(".urlap-hiba-uzenet").forEach(e => (e.textContent = ""));

    const hibak = validateCsapat(adat);
    if (hibak.length > 0) {
      hibak.forEach(h => {
        modal.querySelector<HTMLElement>(`#err-${h.mezo}`)!.textContent = h.uzenet;
        modal.querySelector<HTMLInputElement>(`#f-${h.mezo.replace("_cimek","ki").replace("befogadokepesseg","befogado")}`)?.classList.add("hiba");
      });
      return;
    }

    try {
      if (szerkesztes && csapat) {
        const frissitett = await updateCsapat(csapat.id, adat as CsapatLetrehozas);
        const idx = csapatokCache.findIndex(c => c.id === csapat.id);
        if (idx !== -1) csapatokCache[idx] = frissitett;
        showToast(`${frissitett.nev} sikeresen frissítve!`, "siker");
      } else {
        const uj = await createCsapat(adat as CsapatLetrehozas);
        csapatokCache.push(uj);
        showToast(`${uj.nev} sikeresen létrehozva!`, "siker");
      }
      zaras();
      await renderCsapatok(kontener);
    } catch (err) {
      showToast((err as Error).message, "hiba");
    }
  });
}
