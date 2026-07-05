# Rendelési rendszer — beüzemelési lépések (Realtime Database verzió)

A rendelési rendszer a **Firebase Realtime Database**-t használja a
menü másolatához és a beérkező rendelésekhez — ez egy másik
adatbázis-termék, mint a Firestore, ugyanabban a Firebase projektben, és
**ingyenes (Spark) csomagon is elérhető**. A meglévő Firestore adatokhoz
(`categories`, `products`, `reviews`, `settings`) ez a rész **egyáltalán
nem nyúl**.

## 1. Hozd létre a Realtime Database-t

1. Nyisd meg a [Firebase Console](https://console.firebase.google.com)-t →
   `enzohajm` projekt → bal oldali menü → **Realtime Database**.
2. Kattints a **"Adatbázis létrehozása"** gombra.
3. Válassz régiót (pl. `europe-west1` — Belgium, ha nincs kifejezett
   preferenciád, ez a legközelebbi EU régió).
4. Biztonsági módban válaszd a **"Zárolt mód"**-ot (locked mode) — a
   tényleges szabályokat úgyis felülírjuk a 3. lépésben.
5. Miután létrejött, a Console tetején látni fogod az adatbázis URL-jét,
   valami ilyesmi formában:
   `https://enzohajm-default-rtdb.europe-west1.firebasedatabase.app`

## 2. Írd be a saját adatbázis-URL-edet a kódba

Ez a lépés **kötelező**, mert a régiótól függően a placeholder URL, amit
a kódba írtam (`europe-west1`), nem biztos, hogy egyezik a tiéddel.

Két helyen kell módosítani, mindkét helyen a `databaseURL` sort:

- `public-site/js/orders-firebase-config.js`
- `admin-static/admin.js` (a `firebaseConfig` objektumban)

Cseréld ki erre a sorra a saját, Console-ban látott URL-edet:
```js
databaseURL: "https://SAJÁT-URL-ED-IDE.firebasedatabase.app"
```

## 3. Töltsd fel a biztonsági szabályokat

A repo már tartalmazza (`database.rules.json`), a `firebase.json` pedig
hivatkozik rá. Ha van Firebase CLI-d és be vagy lépve (`firebase login`):

```
firebase deploy --only database
```

Ha nincs Firebase CLI-d, kézzel is bemásolható: Firebase Console →
Realtime Database → **Rules** fül → illeszd be a `database.rules.json`
tartalmát → Publikálás.

A szabályok logikája:
- A menü-másolatot (`order_menu/...`) bárki olvashatja, de csak
  bejelentkezett admin írhatja.
- Egy új rendelést (`orders/...`) bárki (bejelentkezés nélkül is)
  létrehozhat, de meglévő rendelést csak admin tud olvasni, módosítani
  vagy törölni — vásárló nem férhet hozzá mások (vagy akár a saját)
  korábbi rendeléseihez.

## 4. Első menü-szinkronizálás

Lépj be az admin felületre → **Rendelések** menüpont → kattints a
**"Menü szinkronizálása"** gombra. Ez átmásolja a jelenlegi menüt
(kategóriák + termékek) a Firestore-ból a Realtime Database-be — enélkül
a `rendeles.html` oldalon üres lesz a menü.

**Fontos:** ha ezután módosítasz a menün (ár, új termék, stb.), újra rá
kell kattintani erre a gombra, hogy a rendelési oldal is frissüljön —
ez egy kézi, kattintásos szinkronizálás, nem automatikus.

## Hogyan működik ezután?

- **Vásárlók**: `rendeles.html` oldalon összeállítják a kosarukat,
  kiválasztják az átvétel módját (helyszíni / házhozszállítás) és a
  fizetés módját (készpénz / kártya — mindkettő csak
  átvételkor/kiszállításkor történik), megadják a nevüket és
  telefonszámukat, majd elküldik a rendelést.
- **Ti**: az admin felület **Rendelések** oldalán valós időben megjelenik
  minden új rendelés (hangjelzéssel is), és egy kattintással állíthatjátok
  a státuszát (Új → Folyamatban → Kész / Lemondva).
- Nincs online fizetés — a fizetés mindig a helyszínen / kiszállításkor
  történik, ahogy kérted.
