import type { Jatekos, JatekosLetrehozas, Csapat, FormValidacioHiba } from "../types/index.js";
import { Pozicio } from "../types/index.js";
import {
  getJatekosok, createJatekos, updateJatekos, deleteJatekos
} from "../api/jatekosok.js";
import { getCsapatok } from "../api/csapatok.js";
import { showToast, confirmDialog, renderBetoltes, renderHiba, renderUres } from "./utils.js";

let jatekosokCache: Jatekos[] = [];
let csapatokCache: Csapat[] = [];

// ─── Pozíció CSS osztály ─────────────────────────────────────────────────────
export function pozicioOsztaly(p: Pozicio): string {
  const map: Record<Pozicio, string> = {
    [Pozicio.Kapus]:        "poz-kapus",
    [Pozicio.Vedo]:         "poz-vedo",
    [Pozicio.Kozeppelyas]:  "poz-kozep",
    [Pozicio.Csatar]:       "poz-csatar",
  };
  return map[p] ?? "";
}

// ─── Validáció ──────────────────────────────────────────────────────────────
function validateJatekos(adat: Partial<JatekosLetrehozas>): FormValidacioHiba[] {
  const hibak: FormValidacioHiba[] = [];
  if (!adat.nev?.trim()) hibak.push({ mezo: "nev", uzenet: "A játékos neve kötelező." });
  if (!adat.csapat_id || adat.csapat_id < 1) hibak.push({ mezo: "csapat_id", uzenet: "Válassz csapatot." });
  if (!adat.pozicio) hibak.push({ mezo: "pozicio", uzenet: "Válassz pozíciót." });
  if (!adat.allampolgarsag?.trim()) hibak.push({ mezo: "allampolgarsag", uzenet: "Az állampolgárság kötelező." });
  if (!adat.kor || adat.kor < 14 || adat.kor > 50) hibak.push({ mezo: "kor", uzenet: "Érvényes kort adj meg (14–50)." });
  if (!adat.meztszam || adat.meztszam < 1 || adat.meztszam > 99) hibak.push({ mezo: "meztszam", uzenet: "Érvényes meztszámot adj meg (1–99)." });
  if (adat.gol === undefined || adat.gol < 0) hibak.push({ mezo: "gol", uzenet: "A gólok száma nem lehet negatív." });
  if (adat.meccs === undefined || adat.meccs < 0) hibak.push({ mezo: "meccs", uzenet: "A meccsek száma nem lehet negatív." });
  return hibak;
}

// ─── Játékosok táblázata (csapat szűrt) ──────────────────────────────────────
export function renderJatekosokCsapathoz(kontener: HTMLElement, jatekosok: Jatekos[], csapatok: Csapat[]): void {
  if (jatekosok.length === 0) {
    kontener.innerHTML = renderUres("Nincs játékos ebben a csapatban.", "👤");
    return;
  }
  kontener.innerHTML = jatekosTablaHTML(jatekosok, csapatok, false);
  kotelesSorEsemenyek(kontener, jatekosok, csapatok, false);
}

// ─── Összes játékos nézet ─────────────────────────────────────────────────────
export async function renderJatekosok(kontener: HTMLElement): Promise<void> {
  kontener.innerHTML = `
    <div class="nezet-kontener">
      <div class="oldal-fejlec">
        <div>
          <div class="oldal-cim">JÁTÉKOSOK <span>NÉZŐ</span></div>
          <div style="color: var(--szin-szurke); font-size: 0.85rem; margin-top: 0.3rem;">NB I játékosok adatbázisa</div>
        </div>
        <div class="oldal-statisztika" id="jatekos-statisztikak"></div>
      </div>
      <div class="eszkoztar">
        <div class="kereses-mezo">
          <span class="kereses-ikon">🔍</span>
          <input type="text" id="jatekos-kereses" placeholder="Játékos neve, állampolgárság…">
        </div>
        <select class="szuro-select" id="pozicio-szuro">
          <option value="">Minden pozíció</option>
          ${Object.values(Pozicio).map(p => `<option value="${p}">${p}</option>`).join("")}
        </select>
        <select class="szuro-select" id="csapat-szuro">
          <option value="">Minden csapat</option>
        </select>
        <button class="gomb gomb-elsodleges" id="uj-jatekos-gomb">+ Új játékos</button>
      </div>
      <div id="jatekos-tartalom"></div>
    </div>
  `;

  const tartalom = kontener.querySelector<HTMLElement>("#jatekos-tartalom")!;
  const statTerulet = kontener.querySelector<HTMLElement>("#jatekos-statisztikak")!;
  const csapatSzuro = kontener.querySelector<HTMLSelectElement>("#csapat-szuro")!;

  tartalom.innerHTML = renderBetoltes();

  try {
    [jatekosokCache, csapatokCache] = await Promise.all([getJatekosok(), getCsapatok()]);

    // Csapat szűrő feltöltése
    csapatokCache.forEach(c => {
      const opt = document.createElement("option");
      opt.value = String(c.id);
      opt.textContent = c.nev;
      csapatSzuro.appendChild(opt);
    });

    renderJatekosStatisztikak(statTerulet, jatekosokCache);
    renderJatekosTabla(tartalom, jatekosokCache, csapatokCache);

    const szures = () => {
      const q = kontener.querySelector<HTMLInputElement>("#jatekos-kereses")!.value.toLowerCase();
      const poz = kontener.querySelector<HTMLSelectElement>("#pozicio-szuro")!.value as Pozicio | "";
      const csId = parseInt(kontener.querySelector<HTMLSelectElement>("#csapat-szuro")!.value);
      const szurt = jatekosokCache.filter(j =>
        (!q || j.nev.toLowerCase().includes(q) || j.allampolgarsag.toLowerCase().includes(q)) &&
        (!poz || j.pozicio === poz) &&
        (!csId || j.csapat_id === csId)
      );
      renderJatekosTabla(tartalom, szurt, csapatokCache);
    };

    kontener.querySelector("#jatekos-kereses")?.addEventListener("input", szures);
    kontener.querySelector("#pozicio-szuro")?.addEventListener("change", szures);
    kontener.querySelector("#csapat-szuro")?.addEventListener("change", szures);

    kontener.querySelector("#uj-jatekos-gomb")?.addEventListener("click", () => {
      showJatekosModal(null, kontener);
    });

  } catch (err) {
    tartalom.innerHTML = renderHiba((err as Error).message);
  }
}

function renderJatekosStatisztikak(el: HTMLElement, jatekosok: Jatekos[]): void {
  const osszGol = jatekosok.reduce((s, j) => s + j.gol, 0);
  const atlagKor = jatekosok.length > 0 ? (jatekosok.reduce((s,j) => s + j.kor, 0) / jatekosok.length).toFixed(1) : 0;
  el.innerHTML = `
    <div class="stat-elem"><div class="stat-szam">${jatekosok.length}</div><div class="stat-cimke">Játékos</div></div>
    <div class="stat-elem"><div class="stat-szam">${osszGol}</div><div class="stat-cimke">Össz. gól</div></div>
    <div class="stat-elem"><div class="stat-szam">${atlagKor}</div><div class="stat-cimke">Átlagéletkor</div></div>
  `;
}

function renderJatekosTabla(kontener: HTMLElement, jatekosok: Jatekos[], csapatok: Csapat[]): void {
  if (jatekosok.length === 0) {
    kontener.innerHTML = renderUres("Nincs találat a szűrési feltételekre.", "🔍");
    return;
  }
  kontener.innerHTML = jatekosTablaHTML(jatekosok, csapatok, true);
  kotelesSorEsemenyek(kontener, jatekosok, csapatok, true);
}

function jatekosTablaHTML(jatekosok: Jatekos[], csapatok: Csapat[], mutatCsapatot: boolean): string {
  return `
    <div class="jatekos-tabla">
      <div class="tabla-fejlec">
        <div class="tabla-fejlec-cella">#</div>
        <div class="tabla-fejlec-cella">Név</div>
        ${mutatCsapatot ? `<div class="tabla-fejlec-cella">Csapat</div>` : ""}
        <div class="tabla-fejlec-cella">Pozíció</div>
        <div class="tabla-fejlec-cella">Kor</div>
        <div class="tabla-fejlec-cella">Gól</div>
        <div class="tabla-fejlec-cella">Meccs</div>
        <div class="tabla-fejlec-cella">Érték (M€)</div>
        <div class="tabla-fejlec-cella">Műveletek</div>
      </div>
      ${jatekosok.map(j => {
        const csapat = csapatok.find(c => c.id === j.csapat_id);
        return `
          <div class="jatekos-sor" data-id="${j.id}">
            <div class="meztszam">${j.meztszam}</div>
            <div>
              <div class="jatekos-nev-cella">${j.nev}</div>
              <div class="csapat-neve-label">🌍 ${j.allampolgarsag}</div>
            </div>
            ${mutatCsapatot ? `<div style="font-size:0.82rem; color:var(--szin-szurke)">${csapat?.nev ?? "–"}</div>` : ""}
            <div><span class="pozicio-jelveny ${pozicioOsztaly(j.pozicio)}">${j.pozicio}</span></div>
            <div class="stat-szam-cella">${j.kor}</div>
            <div class="stat-szam-cella gol-szam">${j.gol} ⚽</div>
            <div class="stat-szam-cella">${j.meccs}</div>
            <div class="ertek-cella">${j.erteke_m_eur.toFixed(1)}</div>
            <div class="muvelet-gombok">
              <button class="gomb gomb-masodlagos gomb-kicsi" data-akcio="szerkeszt" data-id="${j.id}">✏️</button>
              <button class="gomb gomb-veszelyes gomb-kicsi" data-akcio="torol" data-id="${j.id}">🗑️</button>
            </div>
          </div>
        `;
      }).join("")}
    </div>
  `;
}

function kotelesSorEsemenyek(kontener: HTMLElement, jatekosok: Jatekos[], csapatok: Csapat[], frissitFoNezet: boolean): void {
  kontener.querySelectorAll("[data-akcio='szerkeszt']").forEach(gomb => {
    gomb.addEventListener("click", (e) => {
      e.stopPropagation();
      const id = parseInt((gomb as HTMLElement).dataset.id!);
      const jatekos = jatekosok.find(j => j.id === id);
      if (jatekos) {
        const foKontener = document.querySelector<HTMLElement>(frissitFoNezet ? "#fo-tartalom" : "#nezet-kontener") ?? document.querySelector<HTMLElement>("#fo-tartalom")!;
        showJatekosModal(jatekos, foKontener);
      }
    });
  });

  kontener.querySelectorAll("[data-akcio='torol']").forEach(gomb => {
    gomb.addEventListener("click", async (e) => {
      e.stopPropagation();
      const id = parseInt((gomb as HTMLElement).dataset.id!);
      const jatekos = jatekosok.find(j => j.id === id);
      if (!jatekos) return;
      if (await confirmDialog(`Biztosan törlöd ${jatekos.nev} játékost?`)) {
        try {
          await deleteJatekos(id);
          jatekosokCache = jatekosokCache.filter(j => j.id !== id);
          showToast(`${jatekos.nev} törölve.`, "siker");
          if (frissitFoNezet) {
            renderJatekosTabla(kontener, jatekosokCache.filter(j =>
              jatekosok.some(orig => orig.id === j.id) || j.id !== id
            ), csapatok);
            const foKontener = document.querySelector<HTMLElement>("#fo-tartalom")!;
            await renderJatekosok(foKontener);
          } else {
            const frissitett = jatekosok.filter(j => j.id !== id);
            renderJatekosokCsapathoz(kontener, frissitett, csapatok);
          }
        } catch (err) {
          showToast((err as Error).message, "hiba");
        }
      }
    });
  });
}

// ─── Játékos modal (Create / Edit) ───────────────────────────────────────────
export function showJatekosModal(jatekos: Jatekos | null, kontener: HTMLElement): void {
  const szerkesztes = jatekos !== null;
  const modal = document.createElement("div");
  modal.className = "modal-hatter";

  const csapatOptions = csapatokCache.map(c =>
    `<option value="${c.id}" ${jatekos?.csapat_id === c.id ? "selected" : ""}>${c.nev}</option>`
  ).join("");

  const pozOptions = Object.values(Pozicio).map(p =>
    `<option value="${p}" ${jatekos?.pozicio === p ? "selected" : ""}>${p}</option>`
  ).join("");

  modal.innerHTML = `
    <div class="modal-doboz">
      <div class="modal-fejlec">
        <div class="modal-cim">${szerkesztes ? "SZERKESZTÉS" : "ÚJ JÁTÉKOS"}</div>
        <button class="modal-zaro" id="modal-zaro">✕</button>
      </div>
      <div class="modal-tartalom">
        <div class="urlap-csoport">
          <label class="urlap-cimke">Játékos neve *</label>
          <input class="urlap-mezo" id="f-nev" type="text" value="${jatekos?.nev ?? ""}" placeholder="pl. Varga Barnabás">
          <div class="urlap-hiba-uzenet" id="err-nev"></div>
        </div>
        <div class="urlap-sor">
          <div class="urlap-csoport">
            <label class="urlap-cimke">Csapat *</label>
            <select class="urlap-mezo szuro-select" id="f-csapat_id">
              <option value="">– Válassz –</option>
              ${csapatOptions}
            </select>
            <div class="urlap-hiba-uzenet" id="err-csapat_id"></div>
          </div>
          <div class="urlap-csoport">
            <label class="urlap-cimke">Pozíció *</label>
            <select class="urlap-mezo szuro-select" id="f-pozicio">
              <option value="">– Válassz –</option>
              ${pozOptions}
            </select>
            <div class="urlap-hiba-uzenet" id="err-pozicio"></div>
          </div>
        </div>
        <div class="urlap-sor">
          <div class="urlap-csoport">
            <label class="urlap-cimke">Kor *</label>
            <input class="urlap-mezo" id="f-kor" type="number" value="${jatekos?.kor ?? ""}" min="14" max="50">
            <div class="urlap-hiba-uzenet" id="err-kor"></div>
          </div>
          <div class="urlap-csoport">
            <label class="urlap-cimke">Meztszám *</label>
            <input class="urlap-mezo" id="f-meztszam" type="number" value="${jatekos?.meztszam ?? ""}" min="1" max="99">
            <div class="urlap-hiba-uzenet" id="err-meztszam"></div>
          </div>
        </div>
        <div class="urlap-csoport">
          <label class="urlap-cimke">Állampolgárság *</label>
          <input class="urlap-mezo" id="f-allampolgarsag" type="text" value="${jatekos?.allampolgarsag ?? ""}" placeholder="pl. Magyar">
          <div class="urlap-hiba-uzenet" id="err-allampolgarsag"></div>
        </div>
        <div class="urlap-sor">
          <div class="urlap-csoport">
            <label class="urlap-cimke">Gólok *</label>
            <input class="urlap-mezo" id="f-gol" type="number" value="${jatekos?.gol ?? 0}" min="0">
            <div class="urlap-hiba-uzenet" id="err-gol"></div>
          </div>
          <div class="urlap-csoport">
            <label class="urlap-cimke">Mérkőzések *</label>
            <input class="urlap-mezo" id="f-meccs" type="number" value="${jatekos?.meccs ?? 0}" min="0">
            <div class="urlap-hiba-uzenet" id="err-meccs"></div>
          </div>
        </div>
        <div class="urlap-csoport">
          <label class="urlap-cimke">Piaci érték (M€)</label>
          <input class="urlap-mezo" id="f-ertek" type="number" step="0.1" value="${jatekos?.erteke_m_eur ?? 0.5}" min="0">
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
    const adat: Partial<JatekosLetrehozas> = {
      nev:             (modal.querySelector<HTMLInputElement>("#f-nev")!).value.trim(),
      csapat_id:       parseInt((modal.querySelector<HTMLSelectElement>("#f-csapat_id")!).value),
      pozicio:         (modal.querySelector<HTMLSelectElement>("#f-pozicio")!).value as Pozicio,
      allampolgarsag:  (modal.querySelector<HTMLInputElement>("#f-allampolgarsag")!).value.trim(),
      kor:             parseInt((modal.querySelector<HTMLInputElement>("#f-kor")!).value),
      meztszam:        parseInt((modal.querySelector<HTMLInputElement>("#f-meztszam")!).value),
      gol:             parseInt((modal.querySelector<HTMLInputElement>("#f-gol")!).value),
      meccs:           parseInt((modal.querySelector<HTMLInputElement>("#f-meccs")!).value),
      erteke_m_eur:    parseFloat((modal.querySelector<HTMLInputElement>("#f-ertek")!).value) || 0.5,
    };

    modal.querySelectorAll(".urlap-mezo").forEach(m => m.classList.remove("hiba"));
    modal.querySelectorAll(".urlap-hiba-uzenet").forEach(e => (e.textContent = ""));

    const hibak = validateJatekos(adat);
    if (hibak.length > 0) {
      hibak.forEach(h => {
        const errEl = modal.querySelector<HTMLElement>(`#err-${h.mezo}`);
        if (errEl) errEl.textContent = h.uzenet;
        const mezoEl = modal.querySelector<HTMLElement>(`#f-${h.mezo}`);
        if (mezoEl) mezoEl.classList.add("hiba");
      });
      return;
    }

    try {
      if (szerkesztes && jatekos) {
        const frissitett = await updateJatekos(jatekos.id, adat as JatekosLetrehozas);
        const idx = jatekosokCache.findIndex(j => j.id === jatekos.id);
        if (idx !== -1) jatekosokCache[idx] = frissitett;
        showToast(`${frissitett.nev} sikeresen frissítve!`, "siker");
      } else {
        const uj = await createJatekos(adat as JatekosLetrehozas);
        jatekosokCache.push(uj);
        showToast(`${uj.nev} sikeresen létrehozva!`, "siker");
      }
      zaras();
      const foKontener = document.querySelector<HTMLElement>("#fo-tartalom")!;
      await renderJatekosok(foKontener);
    } catch (err) {
      showToast((err as Error).message, "hiba");
    }
  });
}
