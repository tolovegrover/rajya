import { Movement } from '../types';

export interface BeatTemplate {
  key: string;
  movements?: Movement[];
  template: string;
  ticker: string[];
}

export const PROTEST_BEATS: BeatTemplate[] = [
  {
    key: 'swarna_rally',
    movements: ['swarna'],
    template:
      'Lakhs of students and job-seekers flooded {city} under the Swarna Aandolan banner, waving marksheets like weapons. "Merit murdered" rang across {region} as Devraj\'s volunteers enforced a bandh that the railways could not break.',
    ticker: ['{city} CHOKES AS MERIT MARCH SWELLS', 'BANDH HOLDS: EXAMS vs QUOTA ROUND 7', 'DEVRAJ: "WE WILL FAST, NOT FIRE"'],
  },
  {
    key: 'bahujan_counter',
    movements: ['bahujan'],
    template:
      'The Bahujan Mukti Morcha answered with its own sea of blue in {city}. Ramrao Ambedkari called the quota "the ladder of justice" and warned the government against climbing it with "Savarna boots". {region} braced for parallel processions.',
    ticker: ['BLUE SEA ANSWERS WHITE CAPS IN {region}', 'LADDER OF JUSTICE SPEECH GALVANIZES BASE', 'POLICE SANDWICHED BETWEEN TWO STORMS'],
  },
  {
    key: 'kisan_siege',
    movements: ['kisan'],
    template:
      'Tractors breached three toll barriers on the highways to {city}. Thikait Singh\'s Kisan Mazdoor Sabha declared the land acquisition board "an auction house of ancestry" and set up kitchen tents that could outlast any curfew.',
    ticker: ['TRACTOR TENT CITY RISES NEAR {city}', 'LAND BOARD CALLED AUCTION HOUSE OF ANCESTRY', '{region} HIGHWAYS BLEED SLOW'],
  },
  {
    key: 'students_eruption',
    movements: ['students'],
    template:
      'A cancelled paper-leak exam lit the fuse in {city}. Within a day, coaching-centre posters became barricade art and the youth of {region} discovered politics the hard way — through lathi arithmetic.',
    ticker: ['PAPER LEAK SPARKS YOUTH FIRESTORM', 'COACHING POSTERS BECOME BARRICADE ART', '{region} YOUTH DISCOVER POLITICS'],
  },
  {
    key: 'minority_vigil',
    movements: ['minority'],
    template:
      'After dusk arrests in {region}, neighbourhood vigil committees formed outside heritage sites. Maulana Salaam appealed for calm on a crackling phone line while the Home Ministry spoke of "foreign hands" it could not name.',
    ticker: ['DUSK ARRESTS, DAWN VIGILS IN {region}', 'FOREIGN HAND SEEN EVERYWHERE, NAMED NOWHERE', 'CALM APPEALS vs LOUDSPEAKERS'],
  },
  {
    key: 'majority_procession',
    movements: ['majority'],
    template:
      'A permitted procession through a forbidden street turned {city} into kindling. Saffron flags and green flags argued in a language older than the Republic, and the administration blinked first, then blamed the weather.',
    ticker: ['PROCESSION ROUTE REDRAWN IN BLOOD', '{city} ADMINISTRATION BLINKS, BLAMES HEAT', 'OLD ARGUMENT, NEW ARSON'],
  },
];

export const RIOT_BEATS: BeatTemplate[] = [
  {
    key: 'riot_general',
    template:
      'Three days of civil disturbance left {region} scarred: shops gutted along the old market lane, a curfew that tasted of smoke, and casualty lists both communities read aloud like evidence. The Studio called it "the question of the hour"; families called it by names.',
    ticker: ['CURFEW CLAMPED ON {region}', 'OLD MARKET LANE GUTTED', 'THE NATION WANTS TO KNOW: WHO LIT IT'],
  },
  {
    key: 'riot_spread',
    template:
      'The disturbance jumped state lines — a rumour on a train, a video without a date, and suddenly {region} was burning with borrowed anger. Gen. Rudra Pratap reportedly told the Cabinet that troops "are not tokens of last resort".',
    ticker: ['RUMOUR RIDES THE RAILS TO {region}', 'UNDATED VIDEO, DATED ARSON', 'ARMY CHIEF WARNING LEAKS'],
  },
];

export const ROYAL_BEATS: BeatTemplate[] = [
  {
    key: 'royal_courted',
    template:
      'In the durbar hall of a faded palace, the Rajwada Sabha gathered relics, swords and MLAs. Vikramaditya IV smiled the smile of a man whose patience is a dynasty and remarked that the Republic was "a lovely experiment — on loan".',
    ticker: ['SWORDS POLISHED, MLAS COURTED', 'A DYNASTY\'S PATIENCE NEVER ENDS', 'THRONE ROOM HUMS AGAIN'],
  },
  {
    key: 'royal_restore',
    template:
      'The gates of the old fort opened for the first time in decades. In {region}, the Maharaja\'s standard rose over the secretariat as crowds — paid, devout, or simply tired — chanted for a king. The Republic\'s flag came down at sunset, folded, some say, with surprising care.',
    ticker: ['THE OLD FORT OPENS: {region} CROWNS ITS RAJA', 'REPUBLIC FLAG FOLDED "WITH CARE"', 'DELHI CALLS IT THEATRE; HISTORY CALLS IT A TURN'],
  },
];

export const ECONOMY_BEATS: BeatTemplate[] = [
  {
    key: 'market_slide',
    template:
      'Bond yields sniffed the smoke on the horizon. Investor notes began using the word "uncertainty" with alarming creativity, and the Treasury quietly postponed the deficit arithmetic nobody wanted to read.',
    ticker: ['YIELDS SNIFF SMOKE, DIVE', '"UNCERTAINTY" CREATIVE USE AWARD', 'DEFICIT ARITHMETIC POSTPONED'],
  },
  {
    key: 'scheme_giveaway',
    template:
      'A new scheme landed in {region}: cylinders, cylinders, cylinders. Economists fainted in installments; the Treasury printed reassurance; the crowd cheered, which is also an economic indicator.',
    ticker: ['CYLINDERS FOR ALL, ARITHMETIC FOR NONE', 'ECONOMISTS FAINT IN INSTALLMENTS', '{region} CHEERS: ALSO AN INDICATOR'],
  },
];

export const SCANDAL_BEATS: BeatTemplate[] = [
  {
    key: 'defection_wave',
    template:
      'Resort season opened early this year. Under the gentle hospitality of sea-facing hotels, MLAs of {region} discovered the true meaning of party discipline — and its price. The Speaker counted sheep; the sheep counted offers.',
    ticker: ['RESORT POLITICS RETURNS TO {region}', 'SHEEP COUNT OFFERS, SPEAKER COUNTS SHEEP', 'HORSE-TRADE AT DOLPHIN-SAFE RATES'],
  },
  {
    key: 'sting_media',
    template:
      'The Studio aired a sting so explosive that even its anchors paused for breath — twice. A minister\'s aide was seen accepting what appeared to be a briefcase, in what appeared to be a shot recreated by sources. The nation, as usual, wanted to know.',
    ticker: ['STING OF THE SEASON: BRIEFCATE GATE', 'ANCHOR PAUSES — TWICE', 'NATION STILL WANTS TO KNOW'],
  },
];

export const CHAOS_BEATS: BeatTemplate[] = [
  {
    key: 'absurd_twist',
    template:
      'No scriptwriter would have dared: a fugitive godman endorsed the Maharaja, a film star announced a fast, and a committee was formed to study the committee studying the unrest. In {region}, reality applied for creative credit.',
    ticker: ['FUGITIVE GODMAN BACKS THE CROWN', 'COMMITTEE TO STUDY COMMITTEE FORMED', 'REALITY SEEKS CREDIT, IS REFUSED'],
  },
  {
    key: 'betrayal',
    template:
      'The oldest ally blinked first. In a midnight press conference in {region}, a partner of two decades discovered "issues of conscience" that perfectly matched a better portfolio offer. Loyalty, it turns out, also has a market rate.',
    ticker: ['MIDNIGHT CONSCIENCE DISCOVERED', 'LOYALTY LISTS ON THE EXCHANGE', 'OLDEST ALLY, NEWEST PRICE'],
  },
];

export const AMBIENT_LINES: string[] = [
  'The Republic took a breath, counted its institutions, and found most of them still there.',
  'Moni inaugurated something long and shiny; Amir Sahab listened to something quiet and long.',
  'A committee submitted a report that was read by everyone and believed by no one.',
  'In {region}, the price of onions did what politics could not: unite the streets.',
  'The Studio found a new enemy of the nation; auditions for the next continue.',
  'Monsoon spared {region}; the Finance Ministry did not.',
  'Vikramaditya IV attended a school function; the children asked about the crown. He smiled like a sunset.',
];
