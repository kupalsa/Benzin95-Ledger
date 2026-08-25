# Benzin95 Ledger

Private fuel-check ledger with monthly totals, separate monthly PDF reports, and GitHub-backed device synchronization.

## Repositories

- Frontend: `kupalsa/Benzin95-Ledger`
- Private data: `kupalsa/Benzin95-Ledger-Data`

## Sync

Checks are stored in the private data repository:

- `data/ledger.json` holds the check index and metadata.
- `checks/YYYY-MM/` holds original check images.
- On a new device, select **Sync** and enter a fine-grained GitHub token that has **Contents: read and write** permission for `Benzin95-Ledger-Data` only.
- The token is never committed or sent through chat. It stays in that browser session unless **Keep on this device** is selected.

## Use

1. Connect Sync before adding checks.
2. Add a camera or gallery image, date, total, and optional note.
3. The monthly total updates automatically.
4. Use **Export PDF** next to a month to download one report: summary first page, then that month’s check images.
