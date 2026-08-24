import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { GameState } from '../types';
import { PLAYER_ROLES } from '../data/factions';
import { t } from '../i18n';
import { useLang } from '../store';

export function StatsBar({ state }: { state: GameState }) {
  const role = PLAYER_ROLES.find((r) => r.id === state.role);
  useLang();
  const cell = (label: string, value: string, color: string) => (
    <View style={styles.cell}>
      <Text style={styles.label}>{label}</Text>
      <Text style={[styles.value, { color }]}>{value}</Text>
    </View>
  );
  return (
    <View style={styles.bar}>
      {cell(t('stat.week'), `${state.week}·${String(state.year).slice(2)}`, '#e6b422')}
      {cell(t('stat.treasury'), `${Math.round(state.treasury)}`, '#7aa35a')}
      {cell(t('stat.legitimacy'), `${Math.round(state.legitimacy)}`, state.legitimacy > 50 ? '#4d8fd1' : '#c96a3f')}
      {cell(t('stat.stability'), `${Math.round(state.stability)}`, state.stability > 50 ? '#4d8fd1' : '#c96a3f')}
      {cell(t('stat.influence'), `${Math.round(state.influence)}`, '#c93fd1')}
      {cell('η', state.eta.toFixed(2), '#8b8b8b')}
      <View style={styles.role}>
        <Text style={styles.roleText} numberOfLines={2}>{t(`role.${state.role}.name`, {}, role?.name ?? '')}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    backgroundColor: '#101625',
    borderBottomWidth: 1,
    borderBottomColor: '#26324a',
    paddingTop: 34,
    paddingHorizontal: 6,
    paddingBottom: 6,
    alignItems: 'center',
    gap: 2,
  },
  cell: { alignItems: 'center', paddingHorizontal: 5 },
  label: { color: '#5f6f88', fontSize: 8, fontWeight: '800', letterSpacing: 0.5 },
  value: { fontSize: 13, fontWeight: '900' },
  role: { flex: 1, alignItems: 'flex-end', paddingRight: 4 },
  roleText: { color: '#e6b422', fontSize: 9, fontWeight: '800', textAlign: 'right' },
});
