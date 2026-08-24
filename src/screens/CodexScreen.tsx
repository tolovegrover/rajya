import React, { useState } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { useGame, useLang } from '../store';
import { t } from '../i18n';
import { CHARACTERS } from '../data/characters';
import { FACTIONS, PLAYER_ROLES } from '../data/factions';
import { CharacterPortrait } from '../components/CharacterPortrait';

type Tab = 'cast' | 'factions' | 'manual' | 'log';

export function CodexScreen() {
  const setScreen = useGame((g) => g.setScreen);
  const state = useGame((g) => g.state);
  const rescueLog = useGame((g) => g.rescueLog);
  const [tab, setTab] = useState<Tab>('cast');
  useLang();
  const hasGame = !!state && !state.ending;

  return (
    <View style={s.wrap}>
      <View style={s.tabs}>
        {(['cast', 'factions', 'manual', 'log'] as Tab[]).map((x) => (
          <Pressable key={x} style={[s.tab, tab === x && s.tabSel]} onPress={() => setTab(x)}>
            <Text style={[s.tabText, tab === x && { color: '#0b0f1a' }]}>{t(`codex.${x}`)}</Text>
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
                  <Text style={s.name}>{t(`char.${c.id}.name`, {}, c.name)}</Text>
                  <Text style={s.title}>{t(`char.${c.id}.title`, {}, c.title)}</Text>
                  <Text style={s.persona} numberOfLines={4}>{t(`char.${c.id}.persona`, {}, c.persona)}</Text>
                </View>
              </View>
            </View>
          ))}
        {tab === 'factions' &&
          (state ? Object.values(state.factions) : FACTIONS).map((f) => (
            <View key={f.id} style={s.card}>
              <Text style={s.name}>{t(`fac.${f.id}`, {}, f.name)}</Text>
              <Text style={s.title}>{t('codex.ledby')} {t(`char.${f.leader}.name`, {}, CHARACTERS.find((c) => c.id === f.leader)?.name ?? '—')}</Text>
              {state && (
                <View style={s.powerRow}>
                  <View style={[s.powerBar, { width: `${Math.round(f.power)}%` }]} />
                  <Text style={s.powerText}>{t('codex.power')} {Math.round(f.power)}</Text>
                </View>
              )}
            </View>
          ))}
        {tab === 'manual' && (
          <>
            <Text style={s.h}>{t('codex.howto')}</Text>
            <Text style={s.p}>{t('codex.p1')}</Text>
            <Text style={s.p}>{t('codex.p2')}</Text>
            <Text style={s.p}>{t('codex.p3')}</Text>
            <Text style={s.h}>{t('codex.winh')}</Text>
            {PLAYER_ROLES.map((r) => (
              <Text key={r.id} style={s.p}>▸ {t(`role.${r.id}.name`, {}, r.name)}: {t(`role.${r.id}.win`, {}, r.winText)}</Text>
            ))}
            <Text style={s.h}>{t('codex.endh')}</Text>
            <Text style={s.p}>{t('codex.endp')}</Text>
            <Text style={s.h}>{t('codex.aih')}</Text>
            <Text style={s.p}>{t('codex.aip')}</Text>
          </>
        )}
        {tab === 'log' && (
          <>
            {rescueLog.length === 0 && <Text style={s.p}>{t('codex.norescue')}</Text>}
            {rescueLog.map((e, i) => (
              <View key={i} style={s.card}>
                <Text style={s.logTier}>{t('codex.tier', { t: e.tier, n: e.turn })}</Text>
                <Text style={s.p}>{e.note}</Text>
                <Text style={s.logOrig}>{e.originalRequest.slice(0, 160)}…</Text>
              </View>
            ))}
          </>
        )}
      </ScrollView>
      <Pressable style={s.done} onPress={() => setScreen(hasGame ? 'game' : 'title')}>
        <Text style={s.doneText}>◂ {t('common.back')}</Text>
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
