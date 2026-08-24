import React, { useState } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { useGame } from '../store';
import { CHARACTERS } from '../data/characters';
import { FACTIONS, PLAYER_ROLES } from '../data/factions';
import { CharacterPortrait } from '../components/CharacterPortrait';

type Tab = 'cast' | 'factions' | 'manual' | 'log';

export function CodexScreen() {
  const setScreen = useGame((g) => g.setScreen);
  const state = useGame((g) => g.state);
  const rescueLog = useGame((g) => g.rescueLog);
  const [tab, setTab] = useState<Tab>('cast');
  const hasGame = !!state && !state.ending;

  return (
    <View style={s.wrap}>
      <View style={s.tabs}>
        {(['cast', 'factions', 'manual', 'log'] as Tab[]).map((t) => (
          <Pressable key={t} style={[s.tab, tab === t && s.tabSel]} onPress={() => setTab(t)}>
            <Text style={[s.tabText, tab === t && { color: '#0b0f1a' }]}>{t.toUpperCase()}</Text>
          </Pressable>
        ))}
      </View>
      <ScrollView contentContainerStyle={{ padding: 14, gap: 10, paddingBottom: 40 }}>
        {tab === 'cast' &&
          CHARACTERS.map((c) => (
            <View key={c.id} style={s.card}>
              <View style={s.castRow}>
                <CharacterPortrait spec={c.avatar} size={56} />
                <View style={{ flex: 1 }}>
                  <Text style={s.name}>{c.name}</Text>
                  <Text style={s.title}>{c.title}</Text>
                  <Text style={s.persona} numberOfLines={4}>{c.persona}</Text>
                </View>
              </View>
            </View>
          ))}
        {tab === 'factions' &&
          (state ? Object.values(state.factions) : FACTIONS).map((f) => (
            <View key={f.id} style={s.card}>
              <Text style={s.name}>{f.name}</Text>
              <Text style={s.title}>led by {CHARACTERS.find((c) => c.id === f.leader)?.name ?? '—'}</Text>
              {state && (
                <View style={s.powerRow}>
                  <View style={[s.powerBar, { width: `${Math.round(f.power)}%` }]} />
                  <Text style={s.powerText}>POWER {Math.round(f.power)}</Text>
                </View>
              )}
            </View>
          ))}
        {tab === 'manual' && (
          <>
            <Text style={s.h}>HOW TO PLAY</Text>
            <Text style={s.p}>Time flows: one week every 6 seconds. Tap a region to inspect it and set it as your TARGET — every move you make lands there and ripples to neighbours.</Text>
            <Text style={s.p}>Watch the four heats: UNREST (streets), QUOTA-HEAT (reservation war), LAND-HEAT (farmers & acquisition), ROYALIST (throne nostalgia). Unrest over 85 can erupt into riots; unrest + royalist over their thresholds can restore a throne — the region crowns its old rajya and leaves the Republic.</Text>
            <Text style={s.p}>Your actions are resolved by a deterministic engine (odds shown in the beat card), then the AI Game Master narrates what happened and adds twists — every twist is an operation the engine validates and clamps. Dilemmas pause time: choose, and live with it.</Text>
            <Text style={s.h}>WIN CONDITIONS BY ROLE</Text>
            {PLAYER_ROLES.map((r) => (
              <Text key={r.id} style={s.p}>▸ {r.name}: {r.winText}</Text>
            ))}
            <Text style={s.h}>ENDINGS</Text>
            <Text style={s.p}>The Republic Endures · Age of Rajyas · The Iron Crown · The Silence of the Sirens (military takeover at legitimacy 0) · The Kingmaker (oligarch) · The Merit Restoration (quota repealed).</Text>
            <Text style={s.h}>THE AI CONTRACT</Text>
            <Text style={s.p}>The GM may only speak in a fixed vocabulary of world operations (unrest, loyalty, royalist, separatist, heats, protests, riots, armies, crowns, elections, headlines), max 5 per beat, deltas clamped. Its refusals trigger the rescue ladder: reframe → neutral rewrite → historian transform → offline engine. The game never stalls.</Text>
          </>
        )}
        {tab === 'log' && (
          <>
            {rescueLog.length === 0 && <Text style={s.p}>No rescues yet. The Game Master has been cooperative.</Text>}
            {rescueLog.map((e, i) => (
              <View key={i} style={s.card}>
                <Text style={s.logTier}>TIER {e.tier} · TURN {e.turn}</Text>
                <Text style={s.p}>{e.note}</Text>
                <Text style={s.logOrig}>{e.originalRequest.slice(0, 160)}…</Text>
              </View>
            ))}
          </>
        )}
      </ScrollView>
      <Pressable style={s.done} onPress={() => setScreen(hasGame ? 'game' : 'title')}>
        <Text style={s.doneText}>◂ BACK</Text>
      </Pressable>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: '#0b0f1a' },
  tabs: { flexDirection: 'row', gap: 6, padding: 10, paddingTop: 40, backgroundColor: '#101625' },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 8, borderRadius: 8, backgroundColor: '#0d1322', borderColor: '#2a3650', borderWidth: 1 },
  tabSel: { backgroundColor: '#e6b422', borderColor: '#e6b422' },
  tabText: { color: '#aeb9cf', fontWeight: '900', fontSize: 10 },
  card: { backgroundColor: '#101625', borderColor: '#26324a', borderWidth: 1, borderRadius: 10, padding: 10 },
  castRow: { flexDirection: 'row', gap: 10 },
  name: { color: '#eef1f8', fontSize: 14, fontWeight: '900' },
  title: { color: '#e6b422', fontSize: 10, marginBottom: 4 },
  persona: { color: '#7f8ea3', fontSize: 11, lineHeight: 15 },
  powerRow: { height: 14, backgroundColor: '#0d1322', borderRadius: 7, marginTop: 6, justifyContent: 'center', overflow: 'hidden' },
  powerBar: { position: 'absolute', left: 0, top: 0, bottom: 0, backgroundColor: '#4d8fd1' },
  powerText: { color: '#eef1f8', fontSize: 9, fontWeight: '900', textAlign: 'center' },
  h: { color: '#e6b422', fontSize: 14, fontWeight: '900', marginTop: 8, letterSpacing: 1 },
  p: { color: '#aeb9cf', fontSize: 12, lineHeight: 18 },
  logTier: { color: '#c93fd1', fontSize: 10, fontWeight: '900', marginBottom: 4 },
  logOrig: { color: '#5f6f88', fontSize: 9, fontStyle: 'italic', marginTop: 4 },
  done: { backgroundColor: '#c23', paddingVertical: 14, alignItems: 'center' },
  doneText: { color: '#fff', fontWeight: '900', letterSpacing: 1 },
});
