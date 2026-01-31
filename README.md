# Bible App

Offline Bible app with daily 10-verse reading plan, multi-translation support, search, bookmarks, highlights, notes, reminders, and optional cloud sync.

## Quick start
1. Install dependencies:
   - In WSL (recommended): `npm install`
2. Start Expo:
   - `npx expo start`

## Offline Bible data
The app reads an SQLite file at `assets/bible.db`.
See `data/README.md` for schema and import guidance.

Tip: You can tap "Load sample data" on the Today screen to preview the UI without real text.

## Cloud sync (optional)
Set these env variables (see `.env.example`):
- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`

## Notes
- Expo SDK 54 expects Node 20+ for tooling. The WSL Node here is v18; upgrading will reduce warnings.
