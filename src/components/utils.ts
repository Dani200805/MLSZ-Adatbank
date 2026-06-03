// ─── Segédfüggvények ──────────────────────────────────────────────────────────

export function renderBetoltes(): string {
  return `
    <div class="betoltes-terulet">
      <div class="betoltes-porgeto"></div>
      <div style="font-family:var(--betutipus-kondenzalt); letter-spacing: 2px; font-size: 0.85rem;">BETÖLTÉS…</div>
    </div>
  `;
}

export function renderHiba(uzenet: string): string {
  return `
    <div class="hiba-uzenet-terulet">
      <span style="font-size:1.25rem">⚠️</span>
      <div>
        <div style="font-weight:700; margin-bottom:0.2rem;">Hiba történt</div>
        <div style="font-size:0.85rem; opacity:0.8">${uzenet}</div>
        <div style="font-size:0.8rem; margin-top:0.5rem; opacity:0.6">Ellenőrizd, hogy a JSON Server fut-e: <code>npx json-server server/db.json --port 3001</code></div>
      </div>
    </div>
  `;
}

export function renderUres(szoveg: string, emoji = "📭"): string {
  return `
    <div class="ures-allapot">
      <div class="ures-allapot-ikon">${emoji}</div>
      <div class="ures-allapot-szoveg">${szoveg}</div>
    </div>
  `;
}

export function showToast(uzenet: string, tipusa: "siker" | "hiba" | "info" = "info"): void {
  const terulet = document.getElementById("toast-terulet")!;
  const ikonok = { siker: "✅", hiba: "❌", info: "ℹ️" };
  const toast = document.createElement("div");
  toast.className = `toast toast-${tipusa}`;
  toast.innerHTML = `<span>${ikonok[tipusa]}</span><span>${uzenet}</span>`;
  terulet.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transition = "opacity 0.3s";
    setTimeout(() => terulet.removeChild(toast), 300);
  }, 3200);
}

export async function confirmDialog(uzenet: string): Promise<boolean> {
  return new Promise((resolve) => {
    const modal = document.createElement("div");
    modal.className = "modal-hatter";
    modal.innerHTML = `
      <div class="modal-doboz" style="max-width: 380px;">
        <div class="modal-fejlec">
          <div class="modal-cim" style="font-size:1.4rem">MEGERŐSÍTÉS</div>
        </div>
        <div class="modal-tartalom" style="padding: 1.5rem 1.75rem;">
          <p style="color:var(--szin-feher); line-height:1.6">${uzenet}</p>
        </div>
        <div class="modal-lab">
          <button class="gomb gomb-masodlagos" id="confirm-nem">Mégsem</button>
          <button class="gomb gomb-veszelyes" id="confirm-igen">🗑️ Törlés</button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
    modal.querySelector("#confirm-igen")?.addEventListener("click", () => {
      document.body.removeChild(modal);
      resolve(true);
    });
    modal.querySelector("#confirm-nem")?.addEventListener("click", () => {
      document.body.removeChild(modal);
      resolve(false);
    });
  });
}
