import React from 'react';
import { View, Text, Modal, Pressable, StyleSheet } from 'react-native';
import { FreeMovePrompt, GameState } from '../types';
import { t } from '../i18n';
import { F, GOLD } from '../theme';

export function MovePromptModal({
  prompt,
  state,
  onConfirm,
  onCancel,
}: {
  prompt: FreeMovePrompt;
  state: GameState;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const regionName = t(`rg.${prompt.region}`, {}, state.regions[prompt.region]?.name ?? prompt.region);
  const affordable = state.influence >= prompt.cost;

  return (
    <Modal transparent visible animationType="fade" statusBarTranslucent>
      <View style={s.backdrop}>
        <View style={s.card}>
          {prompt.kind === 'vague' ? (
            <>
              <Text style={s.title}>⚠ {t('move.vague')}</Text>
              <Text style={s.quote}>“{prompt.text}”</Text>
              <Text style={s.reason}>{t(`move.vague.${prompt.reason ?? 'generic'}`)}</Text>
              <Text style={s.examplesH}>{t('move.examples')}</Text>
              <Text style={s.example}>1. {t('move.ex1')}</Text>
              <Text style={s.example}>2. {t('move.ex2')}</Text>
              <Text style={s.example}>3. {t('move.ex3')}</Text>
              <Pressable style={s.btnGo} onPress={onCancel}>
                <Text style={s.btnGoText}>{t('move.vaguedone')}</Text>
              </Pressable>
            </>
          ) : (
            <>
              <Text style={s.title}>{t('move.confirm')}</Text>
              <Text style={s.quote}>“{prompt.text}”</Text>
              <Text style={s.line}>📍 {t('game.target')}: {regionName}</Text>
              <Text style={s.line}>◎ {t('move.cost', { n: prompt.cost })}</Text>
              <Text style={s.line}>🎲 {t('move.odds', { n: prompt.odds })}</Text>
              <Text style={s.note}>{t('move.deduct')}</Text>
              {!affordable && <Text style={s.warn}>◎ {t('move.poor', { n: prompt.cost })}</Text>}
              <View style={s.row}>
                <Pressable style={[s.btnGo, !affordable && s.disabled]} disabled={!affordable} onPress={onConfirm}>
                  <Text style={s.btnGoText}>{t('move.gobtn')}</Text>
                </Pressable>
                <Pressable style={s.btnNo} onPress={onCancel}>
                  <Text style={s.btnNoText}>{t('move.cancel')}</Text>
                </Pressable>
              </View>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(4,7,14,0.82)', justifyContent: 'center', padding: 18 },
  card: {
    backgroundColor: '#101625', borderColor: '#3a4a6b', borderWidth: 1, borderRadius: 16, padding: 16, gap: 9,
    elevation: 12, shadowColor: '#000', shadowOpacity: 0.6, shadowRadius: 18, shadowOffset: { width: 0, height: 8 },
  },
  title: { color: GOLD, fontSize: 16, fontWeight: '900', fontFamily: F.titleBlack, letterSpacing: 1 },
  quote: { color: '#eef1f8', fontSize: 14, fontStyle: 'italic', lineHeight: 20 },
  reason: { color: '#e8875a', fontSize: 13, lineHeight: 19 },
  examplesH: { color: '#66748f', fontSize: 10, fontWeight: '900', letterSpacing: 2, marginTop: 4 },
  example: { color: '#b7c3da', fontSize: 12, lineHeight: 18 },
  line: { color: '#dde4f0', fontSize: 13, fontWeight: '700' },
  note: { color: '#8d9ab5', fontSize: 11, fontStyle: 'italic' },
  warn: { color: '#e8875a', fontSize: 12, fontWeight: '800' },
  row: { flexDirection: 'row', gap: 8, marginTop: 4 },
  btnGo: { flex: 1, backgroundColor: '#c23', borderRadius: 10, padding: 13, alignItems: 'center' },
  btnGoText: { color: '#fff', fontWeight: '900', letterSpacing: 1, fontFamily: F.titleBlack, fontSize: 14 },
  btnNo: { flex: 1, borderColor: '#3a4a6b', borderWidth: 1, borderRadius: 10, padding: 13, alignItems: 'center' },
  btnNoText: { color: '#aeb9cf', fontWeight: '800', fontSize: 13 },
  disabled: { opacity: 0.4 },
});
