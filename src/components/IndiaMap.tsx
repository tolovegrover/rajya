import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Text as RNText, Pressable } from 'react-native';
import Svg, { Polygon, Circle, Text as SvgText, Line, G, Defs, Pattern, Rect } from 'react-native-svg';
import { REGIONS, MAP_W, MAP_H } from '../data/india';
import { MapFx, GameState } from '../types';

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

const MovementColor: Record<string, string> = {
  swarna: '#f0e6c8',
  bahujan: '#4d8fd1',
  kisan: '#3f7a44',
  students: '#c93fd1',
  minority: '#2a9d8f',
  majority: '#f26a1b',
  mixed: '#cccccc',
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
  const curfewPattern = 'curfewHatch';

  return (
    <View style={styles.wrap}>
      <Svg viewBox={`0 0 ${MAP_W} ${MAP_H}`} style={styles.svg} preserveAspectRatio="xMidYMid meet">
        <Defs>
          <Pattern id={curfewPattern} width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <Line x1="0" y1="0" x2="0" y2="8" stroke="#ffffff55" strokeWidth="2" />
          </Pattern>
        </Defs>
        {REGIONS.map((r) => {
          const live = state.regions[r.id];
          const isSel = selected === r.id;
          const pts = r.poly.map((p) => `${p[0]},${p[1]}`).join(' ');
          return (
            <G key={r.id}>
              <Polygon
                points={pts}
                fill={unrestFill(live.unrest, live.kingdom)}
                stroke={isSel ? '#ffffff' : '#0b0f1a'}
                strokeWidth={isSel ? 3 : 1.5}
                onPress={() => onSelect(r.id)}
              />
              {live.curfew && <Polygon points={pts} fill={`url(#${curfewPattern})`} pointerEvents="none" />}
              {live.kingdom && <SvgText x={r.center[0]} y={r.center[1] - 14} fontSize={18} textAnchor="middle" fill="#ffe08a">♛</SvgText>}
              {live.army && <Circle cx={r.cityAt[0] + 12} cy={r.cityAt[1] - 12} r={5} fill="#7aa35a" stroke="#0b0f1a" strokeWidth={1} />}
              <Circle cx={r.cityAt[0]} cy={r.cityAt[1]} r={3} fill="#dfe3ee" opacity={0.9} />
              <SvgText x={r.cityAt[0] + 5} y={r.cityAt[1] + 3} fontSize={9} fill="#cfd6e4" opacity={0.85}>{r.city}</SvgText>
            </G>
          );
        })}
        {fx
          .filter((f) => (f.kind === 'protest' || f.kind === 'riot' ? state.turn - f.born <= 3 : true))
          .map((f) => {
            const rg = state.regions[f.region] ?? REGIONS.find((r) => r.id === f.region);
            if (!rg) return null;
            const ph = f.kind === 'riot' ? riotPhase : phase;
            if (f.kind === 'army' && f.from) {
              const from = state.regions[f.from];
              if (from && state.turn - f.born <= 2) {
                return (
                  <G key={f.id}>
                    <Line x1={from.center[0]} y1={from.center[1]} x2={rg.center[0]} y2={rg.center[1]} stroke="#7aa35a" strokeWidth={3} strokeDasharray="8 6" />
                  </G>
                );
              }
            }
            return <PulseMarker key={f.id} x={rg.center[0]} y={rg.center[1] - 20} kind={f.kind === 'army' ? 'army' : f.kind} phase={ph} size={f.size ?? 2} />;
          })}
        {Object.values(state.regions)
          .filter((r) => r.kingdom)
          .map((r) => (
            <PulseMarker key={`king-${r.id}`} x={r.center[0]} y={r.center[1] - 30} kind="crown" phase={phase} size={2} />
          ))}
        <Rect x={0} y={0} width={0} height={0} fill="none" />
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
    <RNText style={{ color: '#7f8ea3', fontSize: 9 }}>▉ calm</RNText>
    <RNText style={{ color: '#7f8ea3', fontSize: 9 }}>▉ tense</RNText>
    <RNText style={{ color: '#a12216', fontSize: 9 }}>▉ burning</RNText>
    <RNText style={{ color: '#e6b422', fontSize: 9 }}>♛ rajya</RNText>
    <RNText style={{ color: '#7aa35a', fontSize: 9 }}>🎖 army</RNText>
    <RNText style={{ color: '#ffffff88', fontSize: 9 }}>▨ curfew</RNText>
  </View>
);
