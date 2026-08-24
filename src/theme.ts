import { StyleProp, TextStyle } from 'react-native';

export const F = {
  title: 'Cinzel_700Bold',
  titleBlack: 'Cinzel_900Black',
  deco: 'CinzelDecorative_700Bold',
  decoBlack: 'CinzelDecorative_900Black',
  deva: 'YatraOne_400Regular',
};

const DEVANAGARI = /[\u0900-\u097F\u0966-\u096F]/;

/** Display font: Yatra One when the text contains Devanagari, otherwise Cinzel. */
export function fancyFont(text: string, base: string = F.titleBlack): string {
  return DEVANAGARI.test(text) ? F.deva : base;
}

export const GOLD = '#e6b422';
export const ORANGE = '#f26a1b';
export const CRIMSON = '#c23';
export const DEEP = '#101625';

export const GLOW = (color: string = GOLD, radius: number = 6): TextStyle => ({
  textShadowColor: color,
  textShadowOffset: { width: 0, height: 0 },
  textShadowRadius: radius,
});

export const emboss = (size: number = 14): TextStyle => ({
  fontSize: size,
  fontFamily: F.titleBlack,
  color: '#f4efe6',
  letterSpacing: 1.5,
  textShadowColor: '#000',
  textShadowOffset: { width: 0, height: 2 },
  textShadowRadius: 3,
});

export const fancyStyle = (size: number, color: string = GOLD, extra?: TextStyle): StyleProp<TextStyle> => ({
  fontFamily: F.titleBlack,
  fontSize: size,
  color,
  letterSpacing: 1,
  ...extra,
});
