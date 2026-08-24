import { Faction, PlayerRole } from '../types';

export const FACTIONS: Faction[] = [
  { id: 'swaraj', name: 'Swaraj Sarkar', short: 'Swaraj', leader: 'moni', power: 58, mood: 0 },
  { id: 'kangress', name: 'Jantantra Kangress', short: 'Kangress', leader: 'raul', power: 32, mood: -20 },
  { id: 'swarna', name: 'Swarna Aandolan', short: 'Swarna', leader: 'devraj', power: 18, mood: -40 },
  { id: 'bahujan', name: 'Bahujan Mukti Morcha', short: 'Bahujan', leader: 'ramrao', power: 24, mood: 10 },
  { id: 'kisan', name: 'Kisan Mazdoor Sabha', short: 'Kisan', leader: 'thikait', power: 20, mood: -30 },
  { id: 'rajwada', name: 'Rajwada Sabha', short: 'Rajwada', leader: 'vikram', power: 10, mood: 0 },
  { id: 'dravida', name: 'Dravida Ekta Kazhagam', short: 'Dravida', leader: 'kalai', power: 22, mood: -10 },
  { id: 'media', name: 'The Studio', short: 'Studio', leader: 'aarab', power: 30, mood: 20 },
  { id: 'army', name: 'The Crown\'s Court', short: 'Army', leader: 'rudra', power: 40, mood: 0 },
  { id: 'milli', name: 'Milli Ittehad', short: 'Milli', leader: 'maulana', power: 12, mood: -15 },
];

export const PLAYER_ROLES: PlayerRole[] = [
  {
    id: 'strategist',
    name: 'Chief Strategist',
    tagline: 'Moni\'s backroom brain. Keep the Republic alive — or rewrite it in your image.',
    winText: 'Republic survives 120 weeks with Stability ≥ 60',
    influenceStart: 50,
  },
  {
    id: 'agitator',
    name: 'Swarna Agitator',
    tagline: 'Organize the anti-quota storm. Rally, fast, litigate — and march on the capital.',
    winText: 'Reservation repealed nationally, or you seize power',
    influenceStart: 35,
  },
  {
    id: 'royalist',
    name: 'Royalist Emissary',
    tagline: 'Agent of Maharaja Vikramaditya IV. Court nobles, buy legislatures, restore thrones.',
    winText: '≥ 30% of the population under restored crowns',
    influenceStart: 30,
  },
  {
    id: 'oligarch',
    name: 'Shadow Oligarch',
    tagline: 'The money behind all thrones. Fund chaos, own outcomes.',
    winText: 'Influence ≥ 70 when any ending triggers',
    influenceStart: 55,
  },
];
