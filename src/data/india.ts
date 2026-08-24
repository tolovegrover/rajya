import { Region } from '../types';
import { GEOMETRY } from './geometry';
import { t } from '../i18n';

export { GEOMETRY };

export const MAP_W = 1000;
export const MAP_H = 1000;

// Per-region stats (fictional parody values). Geometry comes from GEOMETRY (real India shapes).
interface RegionStats {
  name: string;
  rajyaName: string;
  popM: number;
  wealth: number;
  urban: number;
  hindu: number;
  muslim: number;
  other: number;
  swarna: number;
  unrest: number;
  loyalty: number;
  royalist: number;
  separatist: number;
  reservationHeat: number;
  landHeat: number;
}

export const STATS: Record<string, RegionStats> = {
  kashyapmir: { name: 'Kashyapmir', rajyaName: 'Kashyap Rajya', popM: 12, wealth: 4, urban: 28, hindu: 30, muslim: 65, other: 5, swarna: 6, unrest: 48, loyalty: 40, royalist: 18, separatist: 52, reservationHeat: 20, landHeat: 25 },
  ladvi: { name: 'Ladvi', rajyaName: 'Ladvi Rajya', popM: 0.5, wealth: 3, urban: 30, hindu: 40, muslim: 46, other: 14, swarna: 4, unrest: 25, loyalty: 55, royalist: 22, separatist: 30, reservationHeat: 10, landHeat: 20 },
  panchanad: { name: 'Panchanad', rajyaName: 'Panchanad Sarkar Raj', popM: 30, wealth: 6, urban: 37, hindu: 38, muslim: 2, other: 60, swarna: 13, unrest: 44, loyalty: 55, royalist: 15, separatist: 18, reservationHeat: 45, landHeat: 60 },
  himagiri: { name: 'Himagiri', rajyaName: 'Himagiri Raj', popM: 7, wealth: 5, urban: 28, hindu: 95, muslim: 2, other: 3, swarna: 18, unrest: 20, loyalty: 65, royalist: 14, separatist: 5, reservationHeat: 15, landHeat: 25 },
  haryali: { name: 'Haryali', rajyaName: 'Haryali Rajya', popM: 27, wealth: 7, urban: 35, hindu: 88, muslim: 7, other: 5, swarna: 18, unrest: 40, loyalty: 62, royalist: 16, separatist: 8, reservationHeat: 48, landHeat: 55 },
  indraprastha: { name: 'Indraprastha', rajyaName: 'Indraprastha Rajdhani Rajya', popM: 21, wealth: 9, urban: 97, hindu: 81, muslim: 12, other: 7, swarna: 20, unrest: 38, loyalty: 58, royalist: 12, separatist: 6, reservationHeat: 55, landHeat: 45 },
  kedarkhand: { name: 'Kedarkhand', rajyaName: 'Kedarkhand Rajya', popM: 10, wealth: 4, urban: 30, hindu: 83, muslim: 14, other: 3, swarna: 16, unrest: 32, loyalty: 60, royalist: 15, separatist: 10, reservationHeat: 30, landHeat: 35 },
  uttardesh: { name: 'Uttardesh', rajyaName: 'Awadh Rajya', popM: 235, wealth: 3, urban: 22, hindu: 80, muslim: 19, other: 1, swarna: 10, unrest: 52, loyalty: 48, royalist: 20, separatist: 6, reservationHeat: 60, landHeat: 45 },
  rajputana: { name: 'Rajputana', rajyaName: 'Rajputana Raj', popM: 78, wealth: 4, urban: 25, hindu: 88, muslim: 9, other: 3, swarna: 12, unrest: 38, loyalty: 58, royalist: 48, separatist: 8, reservationHeat: 40, landHeat: 55 },
  gurjaratra: { name: 'Gurjaratra', rajyaName: 'Gurjaratra Rajya', popM: 65, wealth: 7, urban: 43, hindu: 88, muslim: 9, other: 3, swarna: 15, unrest: 35, loyalty: 66, royalist: 22, separatist: 5, reservationHeat: 35, landHeat: 50 },
  gomantak: { name: 'Gomantak', rajyaName: 'Gomantak Rajya', popM: 1.6, wealth: 8, urban: 62, hindu: 66, muslim: 9, other: 25, swarna: 10, unrest: 25, loyalty: 60, royalist: 10, separatist: 4, reservationHeat: 15, landHeat: 30 },
  madhyadesh: { name: 'Madhyadesh', rajyaName: 'Malwa Rajya', popM: 85, wealth: 4, urban: 28, hindu: 90, muslim: 6, other: 4, swarna: 10, unrest: 38, loyalty: 60, royalist: 34, separatist: 10, reservationHeat: 45, landHeat: 55 },
  dandak: { name: 'Dandak', rajyaName: 'Dandakaranya Rajya', popM: 30, wealth: 3, urban: 23, hindu: 93, muslim: 4, other: 3, swarna: 6, unrest: 42, loyalty: 58, royalist: 18, separatist: 35, reservationHeat: 25, landHeat: 70 },
  magadh: { name: 'Magadh', rajyaName: 'Magadh Samrajya', popM: 125, wealth: 2, urban: 19, hindu: 82, muslim: 17, other: 1, swarna: 8, unrest: 58, loyalty: 45, royalist: 38, separatist: 7, reservationHeat: 55, landHeat: 65 },
  vananchal: { name: 'Vananchal', rajyaName: 'Vananchal Rajya', popM: 38, wealth: 3, urban: 24, hindu: 68, muslim: 15, other: 17, swarna: 7, unrest: 52, loyalty: 50, royalist: 16, separatist: 28, reservationHeat: 30, landHeat: 75 },
  gaurdesh: { name: 'Gaurdesh', rajyaName: 'Gaur Rajya', popM: 98, wealth: 4, urban: 31, hindu: 70, muslim: 27, other: 3, swarna: 9, unrest: 60, loyalty: 40, royalist: 15, separatist: 45, reservationHeat: 35, landHeat: 60 },
  neeladri: { name: 'Neeladri', rajyaName: 'Neeladri Rajya', popM: 0.7, wealth: 5, urban: 25, hindu: 60, muslim: 5, other: 35, swarna: 5, unrest: 25, loyalty: 62, royalist: 12, separatist: 30, reservationHeat: 10, landHeat: 20 },
  kamarupa: { name: 'Kamarupa', rajyaName: 'Kamarupa Rajya', popM: 34, wealth: 3, urban: 22, hindu: 61, muslim: 34, other: 5, swarna: 6, unrest: 50, loyalty: 42, royalist: 10, separatist: 40, reservationHeat: 25, landHeat: 45 },
  udayachal: { name: 'Udayachal', rajyaName: 'Udayachal Rajya', popM: 1.5, wealth: 3, urban: 23, hindu: 30, muslim: 2, other: 68, swarna: 3, unrest: 30, loyalty: 55, royalist: 8, separatist: 38, reservationHeat: 10, landHeat: 30 },
  meghvan: { name: 'Meghvan', rajyaName: 'Meghvan Rajya', popM: 3.2, wealth: 3, urban: 20, hindu: 15, muslim: 5, other: 80, swarna: 2, unrest: 35, loyalty: 50, royalist: 8, separatist: 45, reservationHeat: 10, landHeat: 35 },
  purvanachal: { name: 'Purvanachal', rajyaName: 'Purva Rajya Sangh', popM: 15, wealth: 3, urban: 20, hindu: 40, muslim: 12, other: 48, swarna: 4, unrest: 55, loyalty: 35, royalist: 6, separatist: 48, reservationHeat: 15, landHeat: 40 },
  kalinga: { name: 'Kalinga', rajyaName: 'Kalinga Rajya', popM: 44, wealth: 3, urban: 17, hindu: 94, muslim: 2, other: 4, swarna: 8, unrest: 45, loyalty: 55, royalist: 15, separatist: 33, reservationHeat: 35, landHeat: 60 },
  marudesh: { name: 'Marudesh', rajyaName: 'Maratha Samrajya', popM: 120, wealth: 7, urban: 45, hindu: 80, muslim: 11, other: 9, swarna: 14, unrest: 42, loyalty: 55, royalist: 38, separatist: 8, reservationHeat: 50, landHeat: 45 },
  telingana: { name: 'Telingana', rajyaName: 'Telingana Rajya', popM: 37, wealth: 6, urban: 39, hindu: 85, muslim: 13, other: 2, swarna: 12, unrest: 45, loyalty: 58, royalist: 18, separatist: 9, reservationHeat: 55, landHeat: 40 },
  andhradesam: { name: 'Andhradesam', rajyaName: 'Andhra Rajya', popM: 52, wealth: 5, urban: 29, hindu: 90, muslim: 7, other: 3, swarna: 11, unrest: 44, loyalty: 60, royalist: 14, separatist: 6, reservationHeat: 50, landHeat: 55 },
  karnata: { name: 'Karnata', rajyaName: 'Karnata Samrajya', popM: 66, wealth: 6, urban: 39, hindu: 84, muslim: 13, other: 3, swarna: 14, unrest: 38, loyalty: 60, royalist: 30, separatist: 7, reservationHeat: 50, landHeat: 50 },
  tamizhagam: { name: 'Tamizhagam', rajyaName: 'Chola Mandalam', popM: 76, wealth: 6, urban: 48, hindu: 88, muslim: 6, other: 6, swarna: 5, unrest: 36, loyalty: 62, royalist: 16, separatist: 44, reservationHeat: 35, landHeat: 45 },
  cheralam: { name: 'Cheralam', rajyaName: 'Chera Rajya', popM: 34, wealth: 6, urban: 48, hindu: 54, muslim: 27, other: 19, swarna: 8, unrest: 35, loyalty: 62, royalist: 15, separatist: 10, reservationHeat: 30, landHeat: 40 },
};

export function buildRegions(): Record<string, Region> {
  const out: Record<string, Region> = {};
  for (const [id, g] of Object.entries(GEOMETRY)) {
    const st = STATS[id];
    out[id] = {
      id,
      name: t(`rg.${id}`, {}, st.name),
      rajyaName: st.rajyaName,
      rings: g.rings,
      center: g.center,
      city: t(`city.${id}`, {}, g.city),
      cityAt: g.cityAt,
      neighbors: g.neighbors,
      popM: st.popM,
      wealth: st.wealth,
      urban: st.urban,
      hindu: st.hindu,
      muslim: st.muslim,
      other: st.other,
      swarna: st.swarna,
      unrest: st.unrest,
      loyalty: st.loyalty,
      royalist: st.royalist,
      separatist: st.separatist,
      reservationHeat: st.reservationHeat,
      landHeat: st.landHeat,
      curfew: false,
      kingdom: false,
      army: false,
    };
  }
  return out;
}

export const ROYAL_TITLES: Record<string, string> = {
  kashyapmir: 'Sultanate of Kashyapmir',
  ladvi: 'Raja of Ladvi',
  panchanad: 'Sarkar of Panchanad',
  himagiri: 'Raja of Himagiri',
  haryali: 'Rao of Haryali',
  indraprastha: 'Padishah of Indraprastha',
  kedarkhand: 'Raja of Kedarkhand',
  uttardesh: 'Nawab of Awadh',
  rajputana: 'Maharana of Rajputana',
  gurjaratra: 'Raja of Gurjaratra',
  madhyadesh: 'Maharaja of Malwa',
  dandak: 'Raja of Dandakaranya',
  magadh: 'Samrat of Magadh',
  vananchal: 'Raja of Vananchal',
  gaurdesh: 'Maharaja of Gaur',
  neeladri: 'Chogyal of Neeladri',
  kamarupa: 'Swargadeo of Kamarupa',
  udayachal: 'Raja of Udayachal',
  meghvan: 'Syiem of Meghvan',
  purvanachal: 'Raja of Purvardesh',
  kalinga: 'Gajapati of Kalinga',
  marudesh: 'Chhatrapati of Marudesh',
  gomantak: 'Raja of Gomantak',
  telingana: 'Raja of Telingana',
  andhradesam: 'Raja of Andhradesam',
  karnata: 'Maharaja of Karnata',
  tamizhagam: 'Chola of Tamizhagam',
  cheralam: 'Chera of Cheralam',
};

export const STARTER_HOTSPOTS = ['uttardesh', 'gaurdesh', 'haryali', 'marudesh', 'panchanad', 'magadh'];
