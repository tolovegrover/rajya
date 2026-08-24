import React from 'react';
import { View, Text, Modal, Pressable, ScrollView, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BeatResult, GameState } from '../types';
import { opTitle } from '../engine/reducer';
import { t } from '../i18n';
import { useLang } from '../store';
import { F, GOLD } from '../theme';

const SOURCE_BADGE = (b: BeatResult) => {
  if (b.source === 'llm' && !b.rescueTier) return { text: `⚡ ${t('badge.gm')}`, color: '#4d8fd1' };
  if (b.source === 'rescue') return { text: `🛟 ${t('badge.rescue', { n: b.rescueTier ?? 0 })}`, color: '#c93fd1' };
  if (b.source === 'system') return { text: `📖 ${t('badge.phase')}`, color: '#e6b422' };
  return { text: `⚙ ${t('ai.offline')}`, color: '#7f8ea3' };
};

export function EventCard({
  beat,
  state,
  onContinue,
  onChoose,
}: {
  beat: BeatResult;
  state: GameState;
  onContinue: () => void;
  onChoose: (i: number) => void;
}) {
  useLang();
  const badge = SOURCE_BADGE(beat);
  const dilemma = state.pendingDilemma;
  return (
    <Modal transparent visible animationType="fade" statusBarTranslucent>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <View style={styles.badgeRow}>
            <View style={[styles.badge, { backgroundColor: badge.color }]}>
              <Text style={styles.badgeText}>{badge.text}</Text>
            </View>
            <Text style={styles.date}>{t('card.week', { w: state.week, y: state.year })}</Text>
          </View>
          <LinearGradient colors={['rgba(230,180,34,0.55)', 'rgba(230,180,34,0.15)']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ height: 2, borderRadius: 1 }} />
          <ScrollView style={{ maxHeight: 260 }}>
            <Text style={styles.beat}>{beat.beat}</Text>
            {beat.ops.length > 0 && (
              <View style={styles.ops}>
                {beat.ops.slice(0, 5).map((o, i) => (
                  <Text key={i} style={styles.op}>▸ {opTitle(o, state)}</Text>
                ))}
              </View>
            )}
          </ScrollView>
          {dilemma ? (
            <View style={{ gap: 8 }}>
              <Text style={styles.dilemmaQ}>⚠ {dilemma.text}</Text>
              {dilemma.options.map((o, i) => (
                <Pressable key={i} style={styles.option} onPress={() => onChoose(i)}>
                  <Text style={styles.optionText}>{o.label}</Text>
                </Pressable>
              ))}
            </View>
          ) : (
            <Pressable style={styles.btn} onPress={onContinue}>
              <Text style={styles.btnText}>{t('common.continue')} ▸</Text>
            </Pressable>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(4,7,14,0.82)', justifyContent: 'center', padding: 18 },
  card: {
    backgroundColor: '#101625', borderColor: '#3a4a6b', borderWidth: 1, borderRadius: 16, padding: 16, gap: 10,
    elevation: 12, shadowColor: '#000', shadowOpacity: 0.6, shadowRadius: 18, shadowOffset: { width: 0, height: 8 },
  },
  badgeRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  badge: { paddingHorizontal: 9, paddingVertical: 4, borderRadius: 7 },
  badgeText: { color: '#fff', fontSize: 10, fontWeight: '900', letterSpacing: 1, fontFamily: F.title },
  date: { color: '#7f8ea3', fontSize: 11, fontFamily: F.title },
  beat: { color: '#eef1f8', fontSize: 16, lineHeight: 24 },
  ops: { marginTop: 10, gap: 3, borderLeftWidth: 3, borderLeftColor: GOLD, paddingLeft: 10 },
  op: { color: '#aeb9cf', fontSize: 12, fontFamily: F.title },
  dilemmaQ: { color: GOLD, fontSize: 15, fontWeight: '900', marginTop: 4, fontFamily: F.titleBlack, letterSpacing: 0.5 },
  option: {
    backgroundColor: '#1a2438', borderRadius: 10, padding: 13, borderColor: '#3a4a6b', borderWidth: 1,
  },
  optionText: { color: '#eef1f8', fontSize: 14, fontWeight: '700' },
  btn: { backgroundColor: '#c23', borderRadius: 10, padding: 13, alignItems: 'center', marginTop: 4, elevation: 4 },
  btnText: { color: '#fff', fontWeight: '900', letterSpacing: 2, fontFamily: F.titleBlack, fontSize: 15 },
});
