import React from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { useGame, useLang } from '../store';
import { t } from '../i18n';
import { scoreOf } from '../engine/score';
import { PLAYER_ROLES } from '../data/factions';

export function EndingScreen() {
  const state = useGame((g) => g.state);
  const setScreen = useGame((g) => g.setScreen);
  const newGame = useGame((g) => g.newGame);
  useLang();
  const thinking = useGame((g) => g.thinking);
  if (!state || !state.ending) return null;
  const role = PLAYER_ROLES.find((r) => r.id === state.role);

  return (
    <ScrollView style={s.wrap} contentContainerStyle={{ padding: 24, gap: 16, paddingTop: 80, alignItems: 'center' }}>
      <Text style={s.eyebrow}>{t('endscr.eyebrow', { w: state.week, y: state.year })}</Text>
      <Text style={s.title}>{state.ending.title}</Text>
      <Text style={s.text}>{state.ending.text}</Text>
      {thinking && <ActivityIndicator color="#e6b422" />}
      <View style={s.statsCard}>
        <Text style={s.stat}>{t('stat.score')}: {scoreOf(state)} / 1000</Text>
        <Text style={s.stat}>{t('endscr.weeks')}: {state.turn}</Text>
        <Text style={s.stat}>{t('stat.legitimacy')}: {Math.round(state.legitimacy)} · {t('stat.stability')}: {Math.round(state.stability)}</Text>
        <Text style={s.stat}>{t('endscr.royalpop')}: {state.royalPopPct}%</Text>
        <Text style={s.stat}>{t('endscr.role')}: {t(`role.${state.role}.name`, {}, role?.name ?? '')} · {t('stat.influence')} {Math.round(state.influence)}</Text>
        <Text style={s.stat}>{t('endscr.rajyas')}: {Object.values(state.regions).filter((r) => r.kingdom).map((r) => t(`rg.${r.id}`, {}, r.name)).join(', ') || t('endscr.none')}</Text>
      </View>
      <Text style={s.logTitle}>{t('endscr.how')}</Text>
      {state.eventLog.slice(-8).reverse().map((e, i) => (
        <Text key={i} style={s.logLine}>▸ {e.headline}</Text>
      ))}
      <Pressable style={s.btn} onPress={() => setScreen('setup')}>
        <Text style={s.btnText}>{t('endscr.again')} ▸</Text>
      </Pressable>
      <Pressable style={s.btn2} onPress={() => setScreen('title')}>
        <Text style={s.btn2Text}>{t('endscr.title')}</Text>
      </Pressable>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: '#0b0f1a' },
  eyebrow: { color: '#5f6f88', fontSize: 10, letterSpacing: 2, fontWeight: '800' },
  title: { color: '#e6b422', fontSize: 30, fontWeight: '900', textAlign: 'center' },
  text: { color: '#eef1f8', fontSize: 14, lineHeight: 22, textAlign: 'center' },
  statsCard: { backgroundColor: '#101625', borderColor: '#26324a', borderWidth: 1, borderRadius: 12, padding: 14, gap: 4, alignSelf: 'stretch' },
  stat: { color: '#aeb9cf', fontSize: 11 },
  logTitle: { color: '#e6b422', fontSize: 12, fontWeight: '900', letterSpacing: 1, marginTop: 8 },
  logLine: { color: '#7f8ea3', fontSize: 11 },
  btn: { backgroundColor: '#c23', paddingHorizontal: 40, paddingVertical: 14, borderRadius: 10 },
  btnText: { color: '#fff', fontWeight: '900', letterSpacing: 1 },
  btn2: { borderColor: '#3a4a6b', borderWidth: 1, paddingHorizontal: 24, paddingVertical: 8, borderRadius: 8, marginBottom: 30 },
  btn2Text: { color: '#aeb9cf', fontWeight: '800', fontSize: 11 },
});
