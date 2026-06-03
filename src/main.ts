import "./styles/main.css";
import { NezettNezet } from "./types/index.js";
import { renderCsapatok } from "./components/csapatok.js";
import { renderJatekosok } from "./components/jatekosok.js";

// ─── App inicializálás ────────────────────────────────────────────────────────

let aktivNezet: NezettNezet = NezettNezet.Csapatok;

function navigal(nezet: NezettNezet): void {
  aktivNezet = nezet;

  // Hash routing
  window.location.hash = nezet;

  // Nav gombok frissítése
  document.querySelectorAll(".nav-gomb").forEach(g => {
    const gEl = g as HTMLElement;
    gEl.classList.toggle("aktiv", gEl.dataset.nezet === nezet);
  });

  // Nézet renderelése
  const kontener = document.getElementById("fo-tartalom")!;
  if (nezet === NezettNezet.Csapatok) {
    renderCsapatok(kontener);
  } else {
    renderJatekosok(kontener);
  }
}

function init(): void {
  // App struktúra befecskendezése
  document.getElementById("app")!.innerHTML = `
    <header id="app-header">
      <div class="header-belso">
        <a class="logo-terulet" href="#">
          <div class="logo-ikon">⚽</div>
          <div>
            <div class="logo-szoveg">MLSZ ADATBÁZIS</div>
            <div class="logo-alcim">Magyar labdarúgás · NB I</div>
          </div>
        </a>
        <nav>
          <button class="nav-gomb aktiv" data-nezet="${NezettNezet.Csapatok}">🏟️ Csapatok</button>
          <button class="nav-gomb" data-nezet="${NezettNezet.Jatekosok}">👤 Játékosok</button>
        </nav>
      </div>
    </header>

    <main id="fo-tartalom" style="min-height: calc(100vh - 70px);">
    </main>

    <div id="toast-terulet"></div>
  `;

  // Nav eseménykezelők
  document.querySelectorAll(".nav-gomb").forEach(gomb => {
    gomb.addEventListener("click", () => {
      navigal((gomb as HTMLElement).dataset.nezet as NezettNezet);
    });
  });

  // Hash alapú routing
  const hash = window.location.hash.replace("#", "") as NezettNezet;
  if (Object.values(NezettNezet).includes(hash)) {
    navigal(hash);
  } else {
    navigal(NezettNezet.Csapatok);
  }

  // Hashchange figyelő
  window.addEventListener("hashchange", () => {
    const h = window.location.hash.replace("#", "") as NezettNezet;
    if (Object.values(NezettNezet).includes(h) && h !== aktivNezet) {
      navigal(h);
    }
  });
}

init();
