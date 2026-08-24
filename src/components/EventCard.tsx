import React from 'react';
import { View, Text, Modal, Pressable, ScrollView, StyleSheet } from 'react-native';
import { BeatResult, GameState } from '../types';
import { opTitle } from '../engine/reducer';

const SOURCE_BADGE = (b: BeatResult) => {
  if (b.source === 'llm' && !b.rescueTier) return { text: '⚡ AI GAME MASTER', color: '#4d8fd1' };
  if (b.source === 'rescue') return { text: `🛟 RESCUE T${b.rescueTier}`, color: '#c93fd1' };
  return { text: '⚙ OFFLINE ENGINE', color: '#7f8ea3' };
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
            <Text style={styles.date}>WEEK {state.week} · {state.year}</Text>
          </View>
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
            <View style={{ gap: 6 }}>
              <Text style={styles.dilemmaQ}>{dilemma.text}</Text>
              {dilemma.options.map((o, i) => (
                <Pressable key={i} style={styles.option} onPress={() => onChoose(i)}>
                  <Text style={styles.optionText}>{o.label}</Text>
                </Pressable>
              ))}
            </View>
          ) : (
            <Pressable style={styles.btn} onPress={onContinue}>
              <Text style={styles.btnText}>CONTINUE ▸</Text>
            </Pressable>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(4,7,14,0.8)', justifyContent: 'center', padding: 18 },
  card: { backgroundColor: '#101625', borderColor: '#3a4a6b', borderWidth: 1, borderRadius: 14, padding: 14, gap: 10 },
  badgeRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  badgeText: { color: '#fff', fontSize: 9, fontWeight: '900', letterSpacing: 0.5 },
  date: { color: '#7f8ea3', fontSize: 10 },
  beat: { color: '#eef1f8', fontSize: 15, lineHeight: 22 },
  ops: { marginTop: 10, gap: 2, borderLeftWidth: 2, borderLeftColor: '#e6b422', paddingLeft: 8 },
  op: { color: '#aeb9cf', fontSize: 11 },
  dilemmaQ: { color: '#e6b422', fontSize: 14, fontWeight: '800', marginTop: 4 },
  option: { backgroundColor: '#1a2438', borderRadius: 8, padding: 12, borderColor: '#3a4a6b', borderWidth: 1 },
  optionText: { color: '#eef1f8', fontSize: 13, fontWeight: '600' },
  btn: { backgroundColor: '#c23', borderRadius: 8, padding: 12, alignItems: 'center', marginTop: 4 },
  btnText: { color: '#fff', fontWeight: '900', letterSpacing: 1 },
});
