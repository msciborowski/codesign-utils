# QTH Locator — zakres `@codesign-eu/utils`

> Wycinek planu dotyczący `codesign-utils`. Dokument nadrzędny (pełny kontekst, etapy frontendu i backendu):
> `hammap-web/docs/qth-locator-plan.md`.
> Data: 2026-09-18. Stan kodu: `codesign-utils` @ `55d5012` (1.0.29).
>
> **STATUS: ZROBIONE** w commicie `8247f7e` (wersja 1.1.0, czeka na `git push origin main` -> CI publikuje na npm).
> Zakres wykonany zgodnie z opisem niżej, plus jeden błąd znaleziony w trakcie — patrz sekcja na końcu.

## Rola tej biblioteki w całości

Lokatory QTH (Maidenhead) nie będą trzymane w bazie `hammap-api` — są ściśle zdefiniowane i niezmienne, więc geometria liczona jest po stronie klienta. **Ta libka jest jedynym źródłem prawdy dla reguł Maidenhead** — dla frontendu (`hammap-web`) i potencjalnie dla backendu (`hammap-api`, do liczenia bboxa). Zmiany poniżej są warunkiem wstępnym dla pozostałych dwóch repozytoriów.

Wymagania konsumentów:

- `hammap-web` potrzebuje siatki dla viewportu w precyzji **2, 4, 6 i 8** (dziś używa 2/4/6) — to ścieżka hot-path, wywoływana przy każdym `moveend`
- `hammap-api` potrzebuje wyłącznie `locator → bbox`, bez turfa

## Stan zastany

`src/services/locator/gridLocator.Service.ts` → `GridLocationService`:

| Funkcja                                       | Uwagi                                                     |
| --------------------------------------------- | --------------------------------------------------------- |
| `latLngToGrid(lat, lng, precision)`           | `GridPrecision = 2 \| 4 \| 6 \| 8` — 8 rząd już wspierany |
| `gridToLatLng(locator)`                       | środek kwadratu; **nie waliduje znaków**                  |
| `gridToPolygon(locator)`                      | `Feature<Polygon>` przez `turf.bboxPolygon`               |
| `locatorGridsForGeoJSON(feature, precision)`  | filtruje kandydatów przez `turf.booleanIntersects`        |
| `locatorGridsForBounds(bounds, precision)`    | opakowuje powyższą                                        |
| `locatorFeaturesForBounds(bounds, precision)` | `{ center, polygon, reference }[]`                        |

41 testów, próg coverage 100 %.

## Zakres prac

### 1. Nowe funkcje publiczne

| Funkcja                                                   | Po co                                                                |
| --------------------------------------------------------- | -------------------------------------------------------------------- |
| `isValidLocator(value): boolean`                          | walidacja parametru z URL (`/map/.../locator/KO02kk`) i DTO backendu |
| `normalizeLocator(value): string \| null`                 | kanoniczna postać `AA00aa00` — pole wielkimi, podkwadrat małymi      |
| `getLocatorPrecision(value): GridPrecision \| null`       | wyprowadzenie precyzji z długości                                    |
| `gridToBounds(locator): [minLng, minLat, maxLng, maxLat]` | **czysta arytmetyka, bez turfa** — jedyne, czego potrzebuje backend  |
| `getGridStep(precision)`                                  | dziś prywatne `gridStep`; przydatne publicznie                       |
| `getLocatorParent(locator): string \| null`               | nawigacja w panelu detali                                            |
| `getLocatorChildren(locator): string[]`                   | 100 dla 2→4, 576 dla 4→6, 100 dla 6→8                                |

### 2. Przepisanie `locatorGridsForBounds` na wersję arytmetyczną

Dziś iteruje po kandydatach i odsiewa je przez `turf.booleanIntersects` — dla prostokątnego viewportu to niepotrzebny koszt. `hammap-web` ma już wersję index-based (`buildLocatorGridReferences` w `src/modules/map/locator-grid.ts`), która robi to samo arytmetycznie; to jest dubel logiki do przeniesienia tutaj i skasowania tam.

`locatorGridsForGeoJSON` zostaje bez zmian (turf) — jest potrzebna dla polygonów niebędących prostokątem.

### 3. Rozbicie pliku

`gridLocator.Service.ts` ma ~230 linii i miesza czystą arytmetykę z zależnością od turfa:

- `locator/maidenhead.ts` — arytmetyka, **zero zależności**
- `locator/gridLocator.service.ts` — publiczne API; turf importowany tylko dla `gridToPolygon` / `locatorGridsForGeoJSON`

Dzięki temu `hammap-api` (NestJS/CJS) może sięgnąć po lekką ścieżkę bez ciągnięcia całego turfa.

Przy okazji: obecna nazwa pliku to `gridLocator.Service.ts` (wielkie `S`). Import jest wewnętrzny (`src/services/index.ts`), więc zmiana na `gridLocator.service.ts` nie łamie publicznego API.

### 4. Błędy brzegowe do naprawienia

- `latLngToGrid(90, 180, 2)` zwraca `'SS'` — poza zakresem Maidenhead (`A`–`R`). `clampLatitude(90)` → `adjLat = 180` → `Math.floor(180/10) = 18` → `chr(65+18) = 'S'`. To samo dla `lng = 180`. Indeks pola trzeba dociąć do 17.
- `gridToLatLng('ZZ99')` nie waliduje znaków — zwraca bzdurne współrzędne zamiast rzucić. Istotne, bo ta funkcja będzie wołana bezpośrednio z parametru URL.
- `locatorGridsForGeoJSON` używa `lon <= bbox[2]` / `lat <= bbox[3]` — przy bboxie wypadającym dokładnie na granicy kwadratu dokłada zbędną kolumnę/wiersz.

### 5. Testy

Utrzymać próg 100 % coverage. Dodać:

- bieguny i antymeridian (`AA00aa00`, `RR99xx99`, `lat = ±90`, `lng = ±180`)
- round-trip 8 rzędu: `latLng → grid → latLng` w granicach połowy kroku
- walidacja złych wejść: `'KO0'`, `'ZZ99'`, `'KO02zz'`, `'ko02KK'`, spacje, pusty string
- `locatorGridsForBounds` dla bounds przecinających ±180°
- `getLocatorChildren` — liczności 100 / 576 / 100
- `gridToBounds` — zgodność z `gridToPolygon` dla wszystkich czterech precyzji

### 6. Wersja i publikacja

Minor bump → **1.1.0**. Same dodatki, brak breaking change. Publikacja **przed** pracą w `hammap-web` i `hammap-api` — oba repo czekają na to API.

`hammap-web` ma dziś `"@codesign-eu/utils": "^1.0.26"`, więc po publikacji wystarczy `npm update` / bump zakresu.

## Czego tu nie robimy

Zgodnie z `AGENTS.md` — libka zostaje produktowo neutralna. Nie trafiają tutaj:

- formaty URL `hammap.io`
- typy warstw mapy, `MapSelectionKind`, flagi obiektów
- cokolwiek, co wie o parkach, gminach czy DXCC

---

## Co faktycznie weszło (commit `8247f7e`, wersja 1.1.0)

### Trzeci błąd, znaleziony w trakcie implementacji

Poza dwoma opisanymi wyżej (`'SS'` na biegunie, brak walidacji w `gridToLatLng`) okazało się, że `locatorGridsForBounds`
i `locatorGridsForGeoJSON` **kotwiczyły przemiatanie w rogu bounding boxa zamiast w siatce Maidenhead**:

```js
for (let lon = bbox[0]; lon <= bbox[2]; lon += step.lng) {
  ...latLngToGrid(lat + step.lat / 2, lon + step.lng / 2, precision)
```

Dla viewportu `-5..-4` / `50..51` przy precyzji 4 zwracało to `['IO80', 'IO81']` — a kwadrat `IO70`, który faktycznie
pokrywa `-6..-4`, wypadał w całości. Skutkiem była brakująca zachodnia kolumna i południowy wiersz siatki przy każdym
viewporcie niewyrównanym do granicy kwadratu. Po poprawce ten sam viewport zwraca `['IO70', 'IO71', 'IO80', 'IO81']`.

To był zarazem **żywy błąd renderowania w `hammap-web`** dla precyzji 4 i 6 (precyzja 2 szła własną, poprawną ścieżką).

### Zmiany w API

Nowe (wszystkie dostępne i w `GridLocationService`, i w subpath `@codesign-eu/utils/maidenhead`):

`isValidLocator`, `normalizeLocator`, `getLocatorPrecision`, `gridToBounds`, `getGridStep`, `getLocatorParent`,
`getLocatorChildren`, `countLocatorGridsForBounds`.

`countLocatorGridsForBounds` jest odpowiedzią na limit z Etapu 2.3 planu nadrzędnego — pozwala zmierzyć viewport
w O(1) zanim cokolwiek się zaalokuje. Dla świata przy precyzji 8 to 1 866 240 000 kwadratów.

### Struktura

- `src/services/locator/maidenhead.ts` — arytmetyka, zero zależności
- `src/services/locator/gridLocator.service.ts` — `GridLocationService`; turf tylko dla `gridToPolygon`
  i `locatorGridsForGeoJSON`
- `src/maidenhead.ts` — entry point subpath, re-eksport bez turfa
- `vite.config.ts` — dwa entry pointy, `package.json` — mapa `exports`

### Weryfikacja subpath pod NestJS (decyzja 3.3 planu backendu)

Smoke-test wykonany na zbudowanym `dist`:

```
require('./dist/maidenhead.cjs')  -> OK, 11 eksportów
gridToBounds('IO91')              -> [-2, 51, 0, 52]
turf w require.cache              -> false
```

**Opcja (a) z planu backendu jest potwierdzona.** `hammap-api` może zrobić
`require('@codesign-eu/utils/maidenhead')` i dostać arytmetykę lokatorów bez ładowania turfa.

### Podatności

`vitest` 3 -> 4.1.11 i `@testing-library/jest-dom` 6 -> 7. `npm audit`: **0 podatności**.

Uwaga: `npm install` na npm 10 wywraca się w tym repo (`Cannot read properties of null (reading 'edgesOut')` —
błąd arborista przy peer-depsach vitesta). Na npm 11 przechodzi czysto, a CI i tak używa node 24. Lokalnie:
`npx npm@11 install`.

### Pokrycie testami

`src/services/locator/` — **100 %** (statements / branches / functions / lines), 102 testy w dwóch plikach.

Uwaga niezwiązana z tą zmianą: `npm run test:coverage` i tak kończy się błędem progu, bo usługi `astro` są poniżej
100 % (`astroCoordinates` 60 % branchy, `astroUtils` 73 %, `astroCalendar` 96 %). To stan zastany sprzed tej zmiany —
`npm run check` nie uruchamia coverage, więc próg nikogo nie blokował.
