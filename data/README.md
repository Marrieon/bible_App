# Bible Data Import

The app reads its offline Bible text from `assets/bible.db`.

## Required table
Create a SQLite database with this table:

```
CREATE TABLE verses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  translation TEXT NOT NULL,
  book INTEGER NOT NULL,
  chapter INTEGER NOT NULL,
  verse INTEGER NOT NULL,
  verse_index INTEGER NOT NULL,
  text TEXT NOT NULL
);

CREATE UNIQUE INDEX idx_verses_unique ON verses(translation, verse_index);
CREATE INDEX idx_verses_ref ON verses(translation, book, chapter, verse);
```

## Translation codes
Use these translation codes so the app can match them:

- KJV (King James Version)
- ASV (American Standard Version)
- WEB (World English Bible)
- DRA (Douay-Rheims)

## Verse order
`verse_index` must be a sequential, 1-based index that covers the full Bible in canonical order (Genesis 1:1 = 1).
The reading plan uses this index to pick the 10 verses for each day.

## Steps
1. Build or download a SQLite database that matches the schema above.
2. Save it as `assets/bible.db` (replace the placeholder file).
3. Restart the app.

Tip: You can still preview the UI by tapping "Load sample data" on the Today screen.
