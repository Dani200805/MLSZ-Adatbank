# ⚽ MLSZ Adatbázis

> Magyar labdarúgó csapatok és játékosok nyilvántartó rendszere – NB I

## 📋 Projekt leírás

Webalkalmazás az NB I csapatok és játékosaik kezeléséhez. A rendszer lehetővé teszi a csapatok és játékosok teljes CRUD kezelését egy modern, reszponzív felületen keresztül.

## 🛠️ Technológiák

| Technológia | Verzió | Szerepe |
|---|---|---|
| **JSON Server** | ^0.17 | Backend REST API (mock szerver) |
| **Vite** | ^5.0 | Build eszköz, dev szerver |
| **TypeScript** | ^5.3 | Típusbiztonság, strict mód |
| **HTML5 + CSS3** | – | Megjelenés, reszponzív dizájn |

## 🚀 Telepítés és futtatás

### Előfeltételek
- Node.js 18+
- npm 9+

### Lépések

```bash
# 1. Projekt klónozása / kicsomagolása
cd mlsz-adatbazis

# 2. Függőségek telepítése
npm install

# 3. JSON Server indítása (külön terminálablakban)
npm run server
# → http://localhost:3001

# 4. Vite dev szerver indítása (másik terminálban)
npm run dev
# → http://localhost:5173
```

## ✨ Főbb funkciók

### Csapatok
- 📋 **Listázás** – Kártyanézetben, kereséssel és szűréssel
- 🔍 **Részletek** – Csapat adatai + keret tagjai
- ➕ **Létrehozás** – Validált űrlapon keresztül
- ✏️ **Szerkesztés** – Meglévő adatok módosítása
- 🗑️ **Törlés** – Megerősítő dialógussal

### Játékosok
- 📊 **Táblázatos nézet** – Pozíció, gólok, mérkőzések, piaci érték
- 🔍 **Szűrés** – Név, pozíció, csapat szerint
- ➕ **Létrehozás** – Teljes validációval
- ✏️ **Szerkesztés** – Inline módosítás
- 🗑️ **Törlés** – Visszaigazolással

## 📁 Projekt struktúra

```
mlsz-adatbazis/
├── server/
│   └── db.json              ← JSON Server adatbázis
├── src/
│   ├── api/
│   │   ├── csapatok.ts      ← Csapat API hívások
│   │   └── jatekosok.ts     ← Játékos API hívások
│   ├── types/
│   │   └── index.ts         ← TypeScript interfészek, enumok
│   ├── components/
│   │   ├── csapatok.ts      ← Csapatok UI komponens
│   │   ├── jatekosok.ts     ← Játékosok UI komponens
│   │   └── utils.ts         ← Segédfüggvények
│   ├── styles/
│   │   └── main.css         ← Főstílus
│   └── main.ts              ← Belépési pont, routing
├── index.html
├── package.json
├── tsconfig.json
└── vite.config.ts
```

## 🔗 API végpontok

| Metódus | Végpont | Leírás |
|---|---|---|
| GET | `/csapatok` | Összes csapat |
| GET | `/csapatok/:id` | Egy csapat |
| POST | `/csapatok` | Új csapat |
| PUT | `/csapatok/:id` | Csapat frissítése |
| DELETE | `/csapatok/:id` | Csapat törlése |
| GET | `/jatekosok` | Összes játékos |
| GET | `/jatekosok/:id` | Egy játékos |
| GET | `/jatekosok?csapat_id=1` | Csapat játékosai |
| POST | `/jatekosok` | Új játékos |
| PUT | `/jatekosok/:id` | Játékos frissítése |
| DELETE | `/jatekosok/:id` | Játékos törlése |

## 👥 Csapattagok

| Név | GitHub |
|---|---|
| – | – |

## 📝 Megjegyzések

- A TypeScript strict mód be van kapcsolva, `any` típus tiltott
- Hash alapú routing (`#csapatok`, `#jatekosok`)
- Reszponzív: mobil (360px+), tablet (768px+), asztali (1200px+)
- Toast értesítések minden művelet után
