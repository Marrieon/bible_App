export type Book = {
  id: number;
  name: string;
  short: string;
};

export const BOOKS: Book[] = [
  { id: 1, name: 'Genesis', short: 'Gen' },
  { id: 2, name: 'Exodus', short: 'Exod' },
  { id: 3, name: 'Leviticus', short: 'Lev' },
  { id: 4, name: 'Numbers', short: 'Num' },
  { id: 5, name: 'Deuteronomy', short: 'Deut' },
  { id: 6, name: 'Joshua', short: 'Josh' },
  { id: 7, name: 'Judges', short: 'Judg' },
  { id: 8, name: 'Ruth', short: 'Ruth' },
  { id: 9, name: '1 Samuel', short: '1 Sam' },
  { id: 10, name: '2 Samuel', short: '2 Sam' },
  { id: 11, name: '1 Kings', short: '1 Kgs' },
  { id: 12, name: '2 Kings', short: '2 Kgs' },
  { id: 13, name: '1 Chronicles', short: '1 Chr' },
  { id: 14, name: '2 Chronicles', short: '2 Chr' },
  { id: 15, name: 'Ezra', short: 'Ezra' },
  { id: 16, name: 'Nehemiah', short: 'Neh' },
  { id: 17, name: 'Esther', short: 'Est' },
  { id: 18, name: 'Job', short: 'Job' },
  { id: 19, name: 'Psalms', short: 'Ps' },
  { id: 20, name: 'Proverbs', short: 'Prov' },
  { id: 21, name: 'Ecclesiastes', short: 'Eccl' },
  { id: 22, name: 'Song of Solomon', short: 'Song' },
  { id: 23, name: 'Isaiah', short: 'Isa' },
  { id: 24, name: 'Jeremiah', short: 'Jer' },
  { id: 25, name: 'Lamentations', short: 'Lam' },
  { id: 26, name: 'Ezekiel', short: 'Ezek' },
  { id: 27, name: 'Daniel', short: 'Dan' },
  { id: 28, name: 'Hosea', short: 'Hos' },
  { id: 29, name: 'Joel', short: 'Joel' },
  { id: 30, name: 'Amos', short: 'Amos' },
  { id: 31, name: 'Obadiah', short: 'Obad' },
  { id: 32, name: 'Jonah', short: 'Jonah' },
  { id: 33, name: 'Micah', short: 'Mic' },
  { id: 34, name: 'Nahum', short: 'Nah' },
  { id: 35, name: 'Habakkuk', short: 'Hab' },
  { id: 36, name: 'Zephaniah', short: 'Zeph' },
  { id: 37, name: 'Haggai', short: 'Hag' },
  { id: 38, name: 'Zechariah', short: 'Zech' },
  { id: 39, name: 'Malachi', short: 'Mal' },
  { id: 40, name: 'Matthew', short: 'Matt' },
  { id: 41, name: 'Mark', short: 'Mark' },
  { id: 42, name: 'Luke', short: 'Luke' },
  { id: 43, name: 'John', short: 'John' },
  { id: 44, name: 'Acts', short: 'Acts' },
  { id: 45, name: 'Romans', short: 'Rom' },
  { id: 46, name: '1 Corinthians', short: '1 Cor' },
  { id: 47, name: '2 Corinthians', short: '2 Cor' },
  { id: 48, name: 'Galatians', short: 'Gal' },
  { id: 49, name: 'Ephesians', short: 'Eph' },
  { id: 50, name: 'Philippians', short: 'Phil' },
  { id: 51, name: 'Colossians', short: 'Col' },
  { id: 52, name: '1 Thessalonians', short: '1 Thess' },
  { id: 53, name: '2 Thessalonians', short: '2 Thess' },
  { id: 54, name: '1 Timothy', short: '1 Tim' },
  { id: 55, name: '2 Timothy', short: '2 Tim' },
  { id: 56, name: 'Titus', short: 'Titus' },
  { id: 57, name: 'Philemon', short: 'Phlm' },
  { id: 58, name: 'Hebrews', short: 'Heb' },
  { id: 59, name: 'James', short: 'Jas' },
  { id: 60, name: '1 Peter', short: '1 Pet' },
  { id: 61, name: '2 Peter', short: '2 Pet' },
  { id: 62, name: '1 John', short: '1 John' },
  { id: 63, name: '2 John', short: '2 John' },
  { id: 64, name: '3 John', short: '3 John' },
  { id: 65, name: 'Jude', short: 'Jude' },
  { id: 66, name: 'Revelation', short: 'Rev' },
];

export const BOOK_BY_ID = new Map(BOOKS.map((book) => [book.id, book]));

export function getBookName(bookId: number) {
  return BOOK_BY_ID.get(bookId)?.name ?? `Book ${bookId}`;
}

export function getBookShort(bookId: number) {
  return BOOK_BY_ID.get(bookId)?.short ?? `B${bookId}`;
}
