import React, { useEffect } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { useGame } from '../store';
import { IndiaMap, MapLegend } from '../components/IndiaMap';
import { StatsBar } from '../components/StatsBar';
import { NewsTicker } from '../components/NewsTicker';
import { DialogueBox } from '../components/DialogueBox';
import { EventCard } from '../components/EventCard';
import { ACTIONS } from '../engine/resolver';
import { REGIONS } from '../data/india';

export function GameScreen() {
  const {
    state, fx, ticker, thinking, beat, dialogueQueue, selectedRegion, targetRegion,
    runTick, doAction, dismissBeat, chooseDilemma, popDialogue, selectRegion, setTarget, setPaused, setScreen,
    rescueLog,
  } = useGame();

  useEffect(() => {
    const iv = setInterval(() => runTick(), 6000);
    return () => clearInterval(iv);
  }, [runTick]);

  useEffect(() => {
    setPaused(!!beat || thinking);
  }, [beat, thinking, setPaused]);

  if (!state) return null;
  const sel = selectedRegion ? state.regions[selectedRegion] : null;
  const actions = ACTIONS[state.role] ?? [];

  return (
    <View style={s.wrap}>
      <StatsBar state={state} />
      <View style={{ flex: 1 }}>
        <IndiaMap state={state} fx={fx} selected={selectedRegion ?? targetRegion} onSelect={(id) => selectRegion(id)} />
        <MapLegend />
        {thinking && (
          <View style={s.thinking}>
            <ActivityIndicator color="#e6b422" size="small" />
            <Text style={s.thinkingText}>GAME MASTER IS WRITING HISTORY…</Text>
          </View>
        )}
        <DialogueBox lines={dialogueQueue} state={state} onDismiss={popDialogue} />
      </View>

      {sel && (
        <View style={s.infoBar}>
          <View style={{ flex: 1 }}>
            <Text style={s.infoName}>{sel.kingdom ? '♛ ' : ''}{sel.name} · {sel.city}</Text>
            <Text style={s.infoStats}>
              UNREST {Math.round(sel.unrest)} · QUOTA-HEAT {Math.round(sel.reservationHeat)} · LAND {Math.round(sel.landHeat)} · ROYALIST {Math.round(sel.royalist)}{sel.curfew ? ' · CURFEW' : ''}{sel.army ? ' · ARMY' : ''}
            </Text>
          </View>
          {targetRegion === sel.id ? (
            <View style={s.targetOn}><Text style={s.targetOnText}>◎ TARGET</Text></View>
          ) : (
            <Pressable style={s.targetBtn} onPress={() => setTarget(sel.id)}>
              <Text style={s.targetBtnText}>SET TARGET</Text>
            </Pressable>
          )}
          <Pressable onPress={() => selectRegion(null)}><Text style={s.closeInfo}>✕</Text></Pressable>
        </View>
      )}

      <View style={s.actions}>
        <ScrollView horizontal contentContainerStyle={{ gap: 6, paddingHorizontal: 8 }} showsHorizontalScrollIndicator={false}>
          {actions.map((a) => (
            <Pressable
              key={a.id}
              style={[s.actionBtn, (a.usesInfluence ? state.influence : state.treasury) < a.cost && s.actionDisabled]}
              onPress={() => void doAction(a.id)}
              disabled={thinking || !!beat || !!state.ending}
            >
              <Text style={s.actionIcon}>{a.icon}</Text>
              <Text style={s.actionLabel}>{a.label}</Text>
              <Text style={s.actionCost}>{a.usesInfluence ? `◎${a.cost}` : `💰${a.cost}`}</Text>
            </Pressable>
          ))}
        </ScrollView>
        <View style={s.footRow}>
          <Pressable onPress={() => setScreen('codex')}><Text style={s.footBtn}>CODEX</Text></Pressable>
          <Pressable onPress={() => setScreen('settings')}><Text style={s.footBtn}>AI SETUP</Text></Pressable>
          <Text style={s.target}>TARGET: {state.regions[targetRegion]?.name ?? '—'}</Text>
          {rescueLog.length > 0 && <Text style={s.rescue}>🛟 {rescueLog.length}</Text>}
        </View>
      </View>

      <NewsTicker headlines={ticker} />

      {beat && (
        <EventCard beat={beat} state={state} onContinue={dismissBeat} onChoose={(i) => { chooseDilemma(i); dismissBeat(); }} />
      )}
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: '#0b0f1a' },
  thinking: {
    position: 'absolute', top: 10, alignSelf: 'center', flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: 'rgba(16,22,37,0.92)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, borderWidth: 1, borderColor: '#e6b42255', zIndex: 20,
  },
  thinkingText: { color: '#e6b422', fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  infoBar: {
    flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#101625ee',
    paddingHorizontal: 10, paddingVertical: 6, borderTopWidth: 1, borderTopColor: '#26324a',
  },
  infoName: { color: '#eef1f8', fontSize: 12, fontWeight: '900' },
  infoStats: { color: '#7f8ea3', fontSize: 9, marginTop: 2 },
  targetBtn: { borderColor: '#e6b422', borderWidth: 1, borderRadius: 6, paddingHorizontal: 10, paddingVertical: 6 },
  targetBtnText: { color: '#e6b422', fontSize: 9, fontWeight: '900' },
  targetOn: { backgroundColor: '#e6b422', borderRadius: 6, paddingHorizontal: 10, paddingVertical: 6 },
  targetOnText: { color: '#0b0f1a', fontSize: 9, fontWeight: '900' },
  closeInfo: { color: '#5f6f88', fontSize: 14, paddingHorizontal: 4 },
  actions: { backgroundColor: '#0d1322', borderTopWidth: 1, borderTopColor: '#26324a', paddingVertical: 6 },
  actionBtn: {
    width: 92, alignItems: 'center', paddingVertical: 8, borderRadius: 10, backgroundColor: '#141b2b', borderColor: '#2a3650', borderWidth: 1, gap: 2,
  },
  actionDisabled: { opacity: 0.4 },
  actionIcon: { fontSize: 16 },
  actionLabel: { color: '#eef1f8', fontSize: 9, fontWeight: '800', textAlign: 'center' },
  actionCost: { color: '#7f8ea3', fontSize: 9 },
  footRow: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 10, paddingTop: 6 },
  footBtn: { color: '#4d8fd1', fontSize: 10, fontWeight: '800' },
  target: { flex: 1, textAlign: 'right', color: '#e6b422', fontSize: 10, fontWeight: '800' },
  rescue: { color: '#c93fd1', fontSize: 10, fontWeight: '800' },
});
