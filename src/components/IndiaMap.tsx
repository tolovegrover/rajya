import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Text as RNText } from 'react-native';
import Svg, { Polygon, Circle, Text as SvgText, Line, G, Defs, Pattern } from 'react-native-svg';
import { GEOMETRY, MAP_W, MAP_H } from '../data/india';
import { MapFx, GameState } from '../types';
import { t } from '../i18n';

const usePulse = (periodMs: number) => {
  const [p, setP] = useState(0);
  useEffect(() => {
    const iv = setInterval(() => setP((v) => (v + 0.14) % 1), periodMs / 8);
    return () => clearInterval(iv);
  }, [periodMs]);
  return p;
};

const unrestFill = (u: number, kingdom: boolean): string => {
  if (kingdom) return '#8a6d14';
  if (u < 25) return '#1d3a2a';
  if (u < 40) return '#2c4a2c';
  if (u < 55) return '#4d4a20';
  if (u < 70) return '#6b4416';
  if (u < 85) return '#8a3016';
  return '#a12216';
};

const PulseMarker = ({ x, y, kind, phase, size }: { x: number; y: number; kind: string; phase: number; size: number }) => {
  const pulse = 0.75 + Math.abs(Math.sin(phase * Math.PI)) * 0.5;
  const c =
    kind === 'riot' ? '#ff5722' : kind === 'protest' ? '#e8e0f0' : kind === 'army' ? '#7aa35a' : kind === 'election' ? '#4d8fd1' : '#e6b422';
  const r = (size * (kind === 'riot' ? 3.2 : 2.6)) * pulse;
  return (
    <G>
      <Circle cx={x} cy={y} r={r} fill={c} opacity={0.25} />
      <Circle cx={x} cy={y} r={r * 0.55} fill={c} opacity={0.9} />
      {kind === 'crown' && <SvgText x={x} y={y + 4} fontSize={12} fill="#ffe08a" textAnchor="middle">♛</SvgText>}
      {kind === 'riot' && <SvgText x={x} y={y + 4} fontSize={11} textAnchor="middle">🔥</SvgText>}
      {kind === 'protest' && <SvgText x={x} y={y + 4} fontSize={11} textAnchor="middle">✊</SvgText>}
      {kind === 'army' && <SvgText x={x} y={y + 4} fontSize={11} textAnchor="middle">🎖</SvgText>}
      {kind === 'election' && <SvgText x={x} y={y + 4} fontSize={11} textAnchor="middle">🗳</SvgText>}
    </G>
  );
};

export function IndiaMap({
  state,
  fx,
  selected,
  onSelect,
}: {
  state: GameState;
  fx: MapFx[];
  selected: string | null;
  onSelect: (id: string) => void;
}) {
  const phase = usePulse(1200);
  const riotPhase = usePulse(500);

  return (
    <View style={styles.wrap}>
      <Svg viewBox={`0 0 ${MAP_W} ${MAP_H}`} style={styles.svg} preserveAspectRatio="xMidYMid meet">
        <Defs>
          <Pattern id="curfewHatch" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <Line x1="0" y1="0" x2="0" y2="8" stroke="#ffffff55" strokeWidth="2" />
          </Pattern>
        </Defs>
        {Object.entries(GEOMETRY).map(([id, g]) => {
          const live = state.regions[id];
          if (!live) return null;
          const isSel = selected === id;
          const fill = unrestFill(live.unrest, live.kingdom);
          return (
            <G key={id}>
              {g.rings.map((ring, i) => {
                const pts = ring.map((p) => `${p[0]},${p[1]}`).join(' ');
                return (
                  <G key={i}>
                    <Polygon
                      points={pts}
                      fill={fill}
                      stroke={isSel ? '#ffffff' : '#0b0f1a'}
                      strokeWidth={isSel ? 3 : 1.5}
                      onPress={() => onSelect(id)}
                    />
                    {live.curfew && <Polygon points={pts} fill="url(#curfewHatch)" pointerEvents="none" />}
                  </G>
                );
              })}
              {live.kingdom && <SvgText x={g.center[0]} y={g.center[1] - 14} fontSize={18} textAnchor="middle" fill="#ffe08a">♛</SvgText>}
              {live.army && <Circle cx={g.cityAt[0] + 12} cy={g.cityAt[1] - 12} r={5} fill="#7aa35a" stroke="#0b0f1a" strokeWidth={1} />}
              <Circle cx={g.cityAt[0]} cy={g.cityAt[1]} r={3} fill="#dfe3ee" opacity={0.9} />
              <SvgText x={g.cityAt[0] + 5} y={g.cityAt[1] + 3} fontSize={9} fill="#cfd6e4" opacity={0.85}>{live.city}</SvgText>
            </G>
          );
        })}
        {fx
          .filter((f) => (f.kind === 'protest' || f.kind === 'riot' ? state.turn - f.born <= 3 : true))
          .map((f) => {
            const g = GEOMETRY[f.region];
            const live = state.regions[f.region];
            if (!g || !live) return null;
            const ph = f.kind === 'riot' ? riotPhase : phase;
            if (f.kind === 'army' && f.from) {
              const from = GEOMETRY[f.from];
              if (from && state.turn - f.born <= 2) {
                return (
                  <Line
                    key={f.id}
                    x1={from.center[0]}
                    y1={from.center[1]}
                    x2={g.center[0]}
                    y2={g.center[1]}
                    stroke="#7aa35a"
                    strokeWidth={3}
                    strokeDasharray="8 6"
                  />
                );
              }
            }
            return <PulseMarker key={f.id} x={g.center[0]} y={g.center[1] - 20} kind={f.kind === 'army' ? 'army' : f.kind} phase={ph} size={f.size ?? 2} />;
          })}
        {Object.values(state.regions)
          .filter((r) => r.kingdom)
          .map((r) => {
            const g = GEOMETRY[r.id];
            return g ? <PulseMarker key={`king-${r.id}`} x={g.center[0]} y={g.center[1] - 30} kind="crown" phase={phase} size={2} /> : null;
          })}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: '#0b0f1a' },
  svg: { flex: 1, width: '100%', height: '100%' },
});

export const MapLegend = () => (
  <View style={{ flexDirection: 'row', gap: 10, paddingHorizontal: 8, paddingVertical: 2 }}>
    <RNText style={{ color: '#7f8ea3', fontSize: 9 }}>▉ {t('leg.calm')}</RNText>
    <RNText style={{ color: '#7f8ea3', fontSize: 9 }}>▉ {t('leg.tense')}</RNText>
    <RNText style={{ color: '#a12216', fontSize: 9 }}>▉ {t('leg.burning')}</RNText>
    <RNText style={{ color: '#e6b422', fontSize: 9 }}>♛ {t('leg.rajya')}</RNText>
    <RNText style={{ color: '#7aa35a', fontSize: 9 }}>🎖 {t('game.army')}</RNText>
    <RNText style={{ color: '#ffffff88', fontSize: 9 }}>▨ {t('game.curfew')}</RNText>
  </View>
);
