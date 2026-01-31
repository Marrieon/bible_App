export const TRANSLATIONS = ['KJV', 'ASV', 'WEB', 'DRA'] as const;

export type Translation = (typeof TRANSLATIONS)[number];

export const TRANSLATION_LABELS: Record<Translation, string> = {
  KJV: 'King James Version',
  ASV: 'American Standard Version',
  WEB: 'World English Bible',
  DRA: 'Douay-Rheims',
};

export function isTranslation(value: string): value is Translation {
  return (TRANSLATIONS as readonly string[]).includes(value);
}
