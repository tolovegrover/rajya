import React from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { useGame } from '../store';
import { PLAYER_ROLES } from '../data/factions';

export function EndingScreen() {
  const state = useGame((g) => g.state);
  const setScreen = useGame((g) => g.setScreen);
  const newGame = useGame((g) => g.newGame);
  if (!state || !state.ending) return null;
  const role = PLAYER_ROLES.find((r) => r.id === state.role);

  return (
    <ScrollView style={s.wrap} contentContainerStyle={{ padding: 24, gap: 16, paddingTop: 80, alignItems: 'center' }}>
      <Text style={s.eyebrow}>THE CAMPAIGN ENDS · WEEK {state.week} · {state.year}</Text>
      <Text style={s.title}>{state.ending.title}</Text>
      <Text style={s.text}>{state.ending.text}</Text>
      <View style={s.statsCard}>
        <Text style={s.stat}>WEEKS SURVIVED: {state.turn}</Text>
        <Text style={s.stat}>LEGITIMACY: {Math.round(state.legitimacy)} · STABILITY: {Math.round(state.stability)}</Text>
        <Text style={s.stat}>POPULATION UNDER CROWNS: {state.royalPopPct}%</Text>
        <Text style={s.stat}>YOUR ROLE: {role?.name} · INFLUENCE {Math.round(state.influence)}</Text>
        <Text style={s.stat}>REGIONS RESTORED AS RAJYAS: {Object.values(state.regions).filter((r) => r.kingdom).map((r) => r.name).join(', ') || 'none'}</Text>
      </View>
      <Text style={s.logTitle}>HOW IT HAPPENED</Text>
      {state.eventLog.slice(-8).reverse().map((e, i) => (
        <Text key={i} style={s.logLine}>▸ {e.headline}</Text>
      ))}
      <Pressable style={s.btn} onPress={() => setScreen('setup')}>
        <Text style={s.btnText}>RUN IT AGAIN ▸</Text>
      </Pressable>
      <Pressable style={s.btn2} onPress={() => setScreen('title')}>
        <Text style={s.btn2Text}>MAIN TITLE</Text>
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
