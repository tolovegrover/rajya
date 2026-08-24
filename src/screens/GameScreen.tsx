import React, { useEffect } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { useGame, useLang } from '../store';
import { t } from '../i18n';
import { IndiaMap, MapLegend } from '../components/IndiaMap';
import { StatsBar } from '../components/StatsBar';
import { NewsTicker } from '../components/NewsTicker';
import { DialogueBox } from '../components/DialogueBox';
import { EventCard } from '../components/EventCard';
import { ACTIONS, phaseOf } from '../engine/resolver';

export function GameScreen() {
  const {
    state, fx, ticker, thinking, beat, pendingBeats, dialogueQueue, lastAmbient, selectedRegion, targetRegion,
    runTick, doAction, dismissBeat, dismissAmbient, chooseDilemma, popDialogue, selectRegion, setTarget, setPaused, setScreen,
    rescueLog,
  } = useGame();
  useLang();

  useEffect(() => {
    const iv = setInterval(() => runTick(), 6000);
    return () => clearInterval(iv);
  }, [runTick]);

  useEffect(() => {
    setPaused(!!beat || thinking || pendingBeats.length > 0);
  }, [beat, thinking, pendingBeats.length, setPaused]);

  useEffect(() => {
    if (!lastAmbient) return;
    const t = setTimeout(() => dismissAmbient(), 8000);
    return () => clearTimeout(t);
  }, [lastAmbient, dismissAmbient]);

  if (!state) return null;
  const sel = selectedRegion ? state.regions[selectedRegion] : null;
  const phase = phaseOf(state.turn);
  const actions = (ACTIONS[state.role] ?? []).filter((a) => (a.phase ?? 0) <= phase);

  return (
    <View style={s.wrap}>
      <StatsBar state={state} />
      <View style={{ flex: 1 }}>
        <IndiaMap state={state} fx={fx} selected={selectedRegion ?? targetRegion} onSelect={(id) => selectRegion(id)} />
        <MapLegend />
        {thinking && (
          <View style={s.thinking}>
            <ActivityIndicator color="#e6b422" size="small" />
            <Text style={s.thinkingText}>{t('game.thinking')}</Text>
          </View>
        )}
        <DialogueBox lines={dialogueQueue} state={state} onDismiss={popDialogue} />
        {lastAmbient && !beat && (
          <Pressable style={s.ambient} onPress={dismissAmbient}>
            <Text style={s.ambientIcon}>📌</Text>
            <Text style={s.ambientText} numberOfLines={2}>{lastAmbient.headline}</Text>
          </Pressable>
        )}
      </View>

      {sel && (
        <View style={s.infoBar}>
          <View style={{ flex: 1 }}>
            <Text style={s.infoName}>{sel.kingdom ? '♛ ' : ''}{t(`rg.${sel.id}`, {}, sel.name)} · {t(`city.${sel.id}`, {}, sel.city)}</Text>
            <Text style={s.infoStats}>
              {t('game.unrest')} {Math.round(sel.unrest)}
              {phase >= 1 ? ` · ${t('game.quota')} ${Math.round(sel.reservationHeat)} · ${t('game.land')} ${Math.round(sel.landHeat)}` : ''}
              {phase >= 2 ? ` · ${t('game.royalist')} ${Math.round(sel.royalist)}` : ''}
              {sel.curfew ? ` · ${t('game.curfew')}` : ''}{sel.army ? ` · ${t('game.army')}` : ''}
            </Text>
          </View>
          {targetRegion === sel.id ? (
            <View style={s.targetOn}><Text style={s.targetOnText}>◎ {t('game.target')}</Text></View>
          ) : (
            <Pressable style={s.targetBtn} onPress={() => setTarget(sel.id)}>
              <Text style={s.targetBtnText}>{t('game.settarget')}</Text>
            </Pressable>
          )}
          <Pressable onPress={() => selectRegion(null)}><Text style={s.closeInfo}>✕</Text></Pressable>
        </View>
      )}

      <View style={s.actions}>
        <ScrollView horizontal contentContainerStyle={{ gap: 8, paddingHorizontal: 8 }} showsHorizontalScrollIndicator={false}>
          {actions.map((a) => (
            <Pressable
              key={a.id}
              style={[s.actionBtn, (a.usesInfluence ? state.influence : state.treasury) < a.cost && s.actionDisabled]}
              onPress={() => void doAction(a.id)}
              disabled={thinking || !!beat || !!state.ending}
            >
              <Text style={s.actionIcon}>{a.icon}</Text>
              <Text style={s.actionLabel}>{t(`act.${a.id}`, {}, a.label)}</Text>
              <Text style={s.actionCost}>{a.usesInfluence ? `◎${a.cost}` : `💰${a.cost}`}</Text>
            </Pressable>
          ))}
        </ScrollView>
        <View style={s.footRow}>
          <Pressable onPress={() => setScreen('codex')}><Text style={s.footBtn}>{t('game.codex')}</Text></Pressable>
          <Pressable onPress={() => setScreen('chronicle')}><Text style={s.footBtn}>📜 {t('game.chronicle')}</Text></Pressable>
          <Pressable onPress={() => setScreen('settings')}><Text style={s.footBtn}>{t('title.ai')}</Text></Pressable>
          {pendingBeats.length > 0 && <Text style={s.pending}>📜 +{pendingBeats.length}</Text>}
          <Text style={s.target}>{t('game.target')}: {t(`rg.${targetRegion}`, {}, state.regions[targetRegion]?.name ?? '—')}</Text>
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
  ambient: {
    position: 'absolute', top: 8, left: 12, right: 60, flexDirection: 'row', gap: 6, alignItems: 'center',
    backgroundColor: 'rgba(16,22,37,0.95)', borderColor: '#3a4a6b', borderWidth: 1, borderRadius: 12,
    paddingHorizontal: 12, paddingVertical: 8, zIndex: 24,
  },
  ambientIcon: { fontSize: 14 },
  ambientText: { flex: 1, color: '#b7c3da', fontSize: 12, fontWeight: '700' },
  pending: { color: '#d78ae8', fontSize: 10, fontWeight: '900' },
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
