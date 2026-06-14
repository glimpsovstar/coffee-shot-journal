# Café journal on Google Maps — design spec

**Status:** Implemented (#75)  
**Date:** 2026-06-14

## Summary

Let users see their logged cafés **inside the Google Maps app** with stars and tasting notes, using a workflow Google actually supports: **deep links per place** plus **KML export for Google My Maps**. Phase 2 (later, separate work) adds an in-app “My café map” page in Coffee Snob.

Coffee Snob already stores café coordinates, optional `googlePlaceId`, and visit shots (rating, tasting notes, drink, price). It already has Places autocomplete (`CafePlaceField`), geocoding fallback, and a static embed on café detail (`CafeMapEmbed`). This spec adds preview-on-pick, post-save actions, and journal-wide KML export.

## Goals

| Goal | Phase |
|------|-------|
| Confirm pin while adding a café (map preview when location is known) | 1 |
| Open the café in Google Maps after save (Save / directions / lists) | 1 |
| Export all cafés + journal metadata as KML for Google My Maps | 1 |
| Operator docs: import KML → see layer in Google Maps app | 1 |
| Browse cafés on a map inside Coffee Snob | 2 (out of scope here) |

## Non-goals (Phase 1)

- Automatic live sync into Google Saved places (no public API).
- Posting public Google reviews on behalf of the user.
- Editing Google Maps data from Coffee Snob (one-way export).
- New env vars beyond existing `VITE_GOOGLE_MAPS_API_KEY`.

## User flows

### Flow A — Add café visit (enhanced)

1. User types café name → Places autocomplete (existing).
2. On pick (or photo GPS suggestion), name/address/coords/`googlePlaceId` are set (existing).
3. **New:** If latitude/longitude are known, show `CafeMapEmbed` preview below address fields (same component as detail view).
4. User completes drink, notes, photos, saves (existing).
5. **New:** Success area shows:
   - **Open in Google Maps** — external link (place id preferred, else lat/lng).
   - Short hint: “Save this place in Google Maps, or export your full journal map below.”

### Flow B — Export full café map (KML)

1. User opens **Backup & restore** (or post-save link “Download café map”).
2. Clicks **Download café map (KML)**.
3. File downloads: `coffee-snob-cafes-YYYY-MM-DD.kml`.
4. User imports in [Google My Maps](https://www.google.com/maps/d/): Create map → Import → upload file.
5. In Google Maps app: **Layers** → enable the My Map layer → pins show with descriptions.

### Flow C — Refresh map after new visits

1. User logs more cafés in Coffee Snob.
2. Downloads fresh KML (replaces previous export).
3. In My Maps: delete old imported layer **or** delete the old map and import the new file (documented — My Maps duplicates pins on blind re-import).

## Architecture

```
AddCafeForm / CafePlaceField
  → selectedPlace (lat/lng, placeId)
  → CafeMapEmbed (preview)

AddCafeForm (post-save)
  → getGoogleMapsPlaceOpenUrl(cafe)  [mapsConfig]

JournalBackupPanel (+ optional AddCafeForm link)
  → buildCafeMapKml(cafes, shots)   [utils/cafeMapKml.ts]
  → downloadCafeMapKmlFile(...)
```

### New / changed modules

| Module | Responsibility |
|--------|----------------|
| `src/lib/mapsConfig.ts` | Add `getGoogleMapsPlaceOpenUrl({ googlePlaceId?, latitude, longitude, name? })` using [Maps URLs](https://developers.google.com/maps/documentation/urls/get-started) (`query_place_id` when id present). |
| `src/utils/cafeMapKml.ts` | Pure functions: aggregate café + visits, build KML XML, escape text, download helper. |
| `src/components/CafePlaceField.tsx` | Optional: pass through preview slot or parent renders preview when coords known. |
| `src/components/AddCafeForm.tsx` | Map preview; post-save actions; link to export. |
| `src/components/JournalBackupPanel.tsx` | KML export button + counts. |
| `src/components/CafeMapActions.tsx` (small) | Shared “Open in Google Maps” link/button for reuse on detail + form. |

Prefer **parent renders preview** in `AddCafeForm` when `selectedPlace` or resolved coords exist — avoids duplicating state inside `CafePlaceField`.

## KML content

One `<Placemark>` per **café** (not per visit), stable id:

- **`<name>`** — café name.
- **`<description>`** — HTML snippet (CDATA):
  - Address (if any).
  - Visit count.
  - **Latest visit:** date, drink, ★ rating, tasting notes, price, would-order-again.
  - **Café notes** (venue notes field).
  - Optional: bullet list of older visits (max 5, newest first) to keep descriptions readable.
- **`<Point><coordinates>`** — `longitude,latitude,0` (KML order).
- **`<ExtendedData>`** — `cafeId`, `googlePlaceId`, `visitCount`, `latestRating` for future tooling.
- **Placemark id** — `coffeesnob-cafe-{cafe.id}` so operators can identify duplicates in My Maps.

Aggregation uses `getShotsForCafe` + `sortShotsNewestFirst`. Cafés with zero shots still export if they exist in `cafes[]` (venue-only save).

Use `formatDrinkSummary` / existing shot formatters for drink line where applicable.

### File metadata

```xml
<Document>
  <name>Coffee Snob — Café map</name>
  <description>Exported {exportedAt}. Import into Google My Maps.</description>
  ...
</Document>
```

## UI details

### Map preview (add form)

- Show when `selectedPlace` has coords **or** after geocode would run (preview only after pick, not on every keystroke).
- Reuse `.cafe-map` styles; optional modifier `.cafe-map--preview` for slightly shorter iframe height on form.
- If Places disabled: preview still works when coords exist from geocode-on-submit path is too late — preview appears after autocomplete pick or photo GPS flow sets coords.

### Post-save success (`AddCafeForm`)

Replace or extend status message block:

```
Saved Manta Ray and your flat white.
[ Open in Google Maps ]  [ Download café map (KML) ]
Tip: Import the KML in Google My Maps to see all your cafés on Google Maps.
```

`Download café map` calls export with **full journal** (all cafés from props/hook — pass `cafes` + `shots` into `AddCafeForm` or export via callback from parent).

### Café detail

- Add `CafeMapActions` next to embed: **Open in Google Maps** (already have embed + link pattern in `CafeMapEmbed` — consolidate open link to use place id when available).

### Backup panel

- Button: **Download café map (KML)** — disabled when `cafes.length === 0`.
- Message: `Exported N cafés with visit summaries.`

## Error handling

| Case | Behavior |
|------|----------|
| No cafés | Disable export; hint on button. |
| Café missing coords | Skip in KML; log in export summary “Skipped N cafés without coordinates.” |
| Special chars in names/notes | XML escape in KML builder. |
| No `googlePlaceId` | Open URL uses lat/lng query; KML still exports pin. |
| Maps key missing | Embed preview falls back to non-key embed URL (existing); Places hint unchanged. |

## Testing

| Area | Tests |
|------|-------|
| `cafeMapKml.ts` | Escape XML; one placemark per café; description includes latest rating/notes; stable placemark id; skips bad coords; multiple visits summarized. |
| `mapsConfig` | `getGoogleMapsPlaceOpenUrl` prefers `query_place_id` when id set; falls back to coordinates. |
| `AddCafeForm` | Post-save shows Open link with correct href when mock place saved (extend existing test file if present). |
| `JournalBackupPanel` | KML button triggers download (mock `URL.createObjectURL` / anchor click). |

Run `npm run test:run` before merge.

## Documentation

| File | Update |
|------|--------|
| `README.md` | Feature bullet: export café map to Google My Maps; Open in Google Maps after visit. |
| `docs/demo-flow.md` | Short operator section: enable Places + Maps Embed API on key; KML import steps; re-export refresh strategy. |

No new env vars in `.env.example` (comment already mentions Maps key).

## SDLC

1. GitHub issue: Feature — Café journal on Google Maps (Phase 1).
2. Branch: `feature/<issue#>-cafe-google-maps-export`.
3. Implement per plan → tests → PR.

## Phase 2 (next when resuming — not implemented)

**Status:** Backlog — see [`docs/handoff.md`](../../handoff.md) § Next work.

- **Café map page** in Coffee Snob: Google Maps JavaScript API or MapLibre + journal pins, popup with stars/reviews, filter by rating.
- Optional: remember “last KML export date” and nudge when journal changed.
- Optional: hosted KML URL for power users (still manual My Maps layer).

## Open decisions (resolved)

| Question | Decision |
|----------|----------|
| Phase 1 scope | Option C: deep link + KML + preview |
| Where to browse first | Google Maps app via My Maps |
| Per-visit vs per-café pins | Per café; visits in description |
| Re-import duplicates | Document delete-old-layer; stable ids for support |
