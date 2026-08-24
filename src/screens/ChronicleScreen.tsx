import React, { useEffect } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useGame, useSettings } from '../store';
import { useLang } from '../store';
import { t } from '../i18n';
import { GameEvent } from '../types';
import { displayName } from '../llm/prompts';
import { CHARACTERS } from '../data/characters';
import { F, GOLD, ORANGE } from '../theme';
import { GoldHeader } from '../components/FancyButton';

const KIND_ICON: Record<GameEvent['kind'], string> = {
  beat: '📰',
  dialogue: '💬',
  decision: '⚖️',
  week: '📅',
  headline: '📌',
  ending: '🏁',
};

export function ChronicleScreen() {
  useLang();
  const setScreen = useGame((g) => g.setScreen);
  const state = useGame((g) => g.state);
  const lastChronicle = useGame((g) => g.lastChronicle);
  const settings = useSettings((s) => s.settings);
  const hasGame = !!state && !state.ending;

  useEffect(() => {
    if (hasGame) return;
    AsyncStorage.getItem('rajya_last_chronicle_v1')
      .then((raw) => {
        if (raw) {
          try {
            const parsed = JSON.parse(raw) as GameEvent[];
            if (Array.isArray(parsed) && parsed.length) useGame.setState({ lastChronicle: parsed });
          } catch {
            /* keep empty */
          }
        }
      })
      .catch(() => undefined);
  }, [hasGame]);

  const log: GameEvent[] = hasGame && state ? state.eventLog : (lastChronicle ?? []);
  const reversed = [...log].reverse();

  const speakerName = (id: string) => {
    const c = state?.characters[id] ?? CHARACTERS.find((x) => x.id === id);
    return c ? displayName(settings, c) : id;
  };

  let lastWeek = -1;
  const rows: React.ReactNode[] = [];
  for (const e of reversed) {
    if (e.week !== lastWeek) {
      lastWeek = e.week;
      rows.push(
        <View key={`w${e.week}`} style={s.weekBar}>
          <Text style={s.weekText}>{t('chron.week', { w: e.week, y: 2026 + Math.floor(e.turn / 52) })}</Text>
        </View>
      );
    }
    rows.push(
      <View key={`e${e.turn}-${rows.length}`} style={[s.card, e.kind === 'ending' && s.endCard]}>
        <View style={s.headRow}>
          <Text style={s.icon}>{KIND_ICON[e.kind]}</Text>
          <Text style={s.headline} numberOfLines={2}>{e.headline}</Text>
        </View>
        {!!e.beat && <Text style={s.beat}>{e.beat}</Text>}
        {e.dialogue?.map((d, i) => (
          <Text key={i} style={s.dline}>
            <Text style={s.dname}>{speakerName(d.char)}:</Text> "{d.line}"
          </Text>
        ))}
        {e.ops?.map((o, i) => (
          <Text key={i} style={s.op}>▸ {o}</Text>
        ))}
      </View>
    );
  }

  return (
    <View style={s.wrap}>
      <View style={s.top}>
        <GoldHeader text={hasGame ? t('chron.title') : t('chron.last')} size={20} />
        <Text style={s.sub}>{hasGame ? t('chron.sub') : t('chron.lastsaved')}</Text>
      </View>
      <ScrollView contentContainerStyle={{ padding: 12, gap: 8, paddingBottom: 60 }}>
        {rows.length === 0 ? (
          <Text style={s.empty}>{t('chron.empty')}</Text>
        ) : (
          rows
        )}
      </ScrollView>
      <Pressable style={s.back} onPress={() => setScreen(hasGame ? 'game' : 'title')}>
        <Text style={s.backText}>◂ {t('common.back')}</Text>
      </Pressable>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: '#0b0f1a' },
  top: { alignItems: 'center', paddingTop: 52, paddingBottom: 8, gap: 3 },
  sub: { color: '#66748f', fontSize: 10 },
  weekBar: {
    marginTop: 8, marginBottom: 2, alignSelf: 'center',
    backgroundColor: '#1a2438', borderRadius: 14, paddingHorizontal: 16, paddingVertical: 4,
    borderWidth: 1, borderColor: '#2a3650',
  },
  weekText: { color: ORANGE, fontSize: 11, fontWeight: '900', letterSpacing: 1, fontFamily: F.title },
  card: {
    backgroundColor: '#101625', borderColor: '#26324a', borderWidth: 1, borderRadius: 12, padding: 10, gap: 4,
  },
  endCard: { borderColor: GOLD, borderWidth: 2 },
  headRow: { flexDirection: 'row', gap: 6, alignItems: 'flex-start' },
  icon: { fontSize: 13 },
  headline: { flex: 1, color: GOLD, fontSize: 12, fontWeight: '900', fontFamily: F.title },
  beat: { color: '#dde4f0', fontSize: 13, lineHeight: 19, marginTop: 2 },
  dline: { color: '#b7c3da', fontSize: 12, lineHeight: 18, fontStyle: 'italic' },
  dname: { color: '#e6b422', fontWeight: '800', fontStyle: 'normal' },
  op: { color: '#8d9ab5', fontSize: 11 },
  empty: { color: '#66748f', fontSize: 13, textAlign: 'center', marginTop: 60 },
  back: { backgroundColor: '#c23', paddingVertical: 14, alignItems: 'center' },
  backText: { color: '#fff', fontWeight: '900', letterSpacing: 1, fontFamily: F.titleBlack },
});
