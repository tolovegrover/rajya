import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { GameState } from '../types';
import { PLAYER_ROLES } from '../data/factions';
import { t } from '../i18n';
import { phaseOf } from '../engine/resolver';
import { scoreOf } from '../engine/score';
import { useLang } from '../store';
import { F, GOLD } from '../theme';

export function StatsBar({ state }: { state: GameState }) {
  const role = PLAYER_ROLES.find((r) => r.id === state.role);
  useLang();
  const phase = phaseOf(state.turn);
  const cell = (label: string, value: string, color: string) => (
    <View style={styles.cell}>
      <Text style={styles.label}>{label}</Text>
      <Text style={[styles.value, { color, textShadowColor: 'rgba(0,0,0,0.8)', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 2 }]}>{value}</Text>
    </View>
  );
  return (
    <LinearGradient colors={['#161d2e', '#101625', '#0c1019']} style={styles.bar}>
      {cell(t('stat.week'), `${state.week}·${String(state.year).slice(2)}`, GOLD)}
      {cell(t('stat.treasury'), `${Math.round(state.treasury)}`, '#8fd06a')}
      {phase >= 1 && cell(t('stat.legitimacy'), `${Math.round(state.legitimacy)}`, state.legitimacy > 50 ? '#5aa2e8' : '#e8875a')}
      {phase >= 1 && cell(t('stat.stability'), `${Math.round(state.stability)}`, state.stability > 50 ? '#5aa2e8' : '#e8875a')}
      {cell(t('stat.influence'), `${Math.round(state.influence)}`, '#d78ae8')}
      {phase >= 1 && cell(t('stat.score'), `${scoreOf(state)}`, GOLD)}
      {phase >= 2 && cell('η', state.eta.toFixed(2), '#9aa4b8')}
      <View style={styles.role}>
        <Text style={styles.roleText} numberOfLines={2}>{t(`role.${state.role}.name`, {}, role?.name ?? '')}</Text>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#2a3650',
    paddingTop: 36,
    paddingHorizontal: 6,
    paddingBottom: 7,
    alignItems: 'flex-end',
    gap: 2,
  },
  cell: { alignItems: 'center', paddingHorizontal: 6 },
  label: { color: '#66748f', fontSize: 8, fontWeight: '800', letterSpacing: 1, marginBottom: 1 },
  value: { fontFamily: F.titleBlack, fontSize: 17, letterSpacing: 0.5 },
  role: { flex: 1, alignItems: 'flex-end', paddingRight: 4, paddingBottom: 2 },
  roleText: { color: GOLD, fontSize: 10, fontWeight: '900', textAlign: 'right', letterSpacing: 0.5 },
});
