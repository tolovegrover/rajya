export type Lang = 'en' | 'hi' | 'bn' | 'mr' | 'te' | 'ta' | 'gu' | 'ur' | 'kn' | 'ml' | 'pa' | 'or' | 'as';
export type Entry = { en: string } & Partial<Record<Lang, string>>;
