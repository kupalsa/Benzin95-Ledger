# Benzin95 Ledger

A minimal private web app for saving Benzin 95 fuel-check photos by purchase month, confirming monthly totals, exporting an archive, and reviewing confirmed spending in a calendar.

## Visual direction

- **Background image concept:** a quiet overhead paper-and-concrete texture—referencing a fuel check on a forecourt, but never using a real check as wallpaper.
- **Palette:** Deep Petrol `#193430`, Paper Cream `#F4F0E7`, Warm Clay `#C96E4B`, Moss `#759176`, Sand `#DED5C4`.
- **Typography:** Fraunces for human, ledger-like figures; Manrope for operational UI; DM Mono for small archive labels.

The current implementation renders the background as a subtle paper-grain texture so no personal receipt image is exposed in the UI.

## Storage & privacy

Checks and original images are stored in **IndexedDB in the browser on this device**. Nothing is uploaded to a server. This is intentionally private but is **not synced** across browsers or devices. Use **Export archive** for a portable ZIP backup.

## Run locally

```bash
python3 -m http.server 4173
```

Then open `http://localhost:4173`.

## What it does

- Camera or gallery image intake
- Defaults the filing month from the confirmed purchase date; date can be changed before saving
- Saves amount and optional station note alongside the original image
- Monthly archive with current total and explicit **Calculate total** confirmation
- ZIP export: checks only, or checks plus detailed/monthly CSV files
- Calendar shows only month totals that were explicitly calculated
