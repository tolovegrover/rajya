import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Text as RNText, PanResponder, Animated, Pressable, LayoutChangeEvent } from 'react-native';
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

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

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

const MIN = 1;
const MAX = 7;

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

  const scale = useRef(new Animated.Value(1)).current;
  const tx = useRef(new Animated.Value(0)).current;
  const ty = useRef(new Animated.Value(0)).current;
  const cur = useRef({ s: 1, x: 0, y: 0 });
  const saved = useRef({ s: 1, x: 0, y: 0 });
  const pinchDist = useRef(0);
  const box = useRef({ w: 0, h: 0 });
  const lastTap = useRef(0);

  const maxTx = () => ((cur.current.s - 1) * box.current.w) / 2;
  const maxTy = () => ((cur.current.s - 1) * box.current.h) / 2;

  const apply = (s: number, x: number, y: number) => {
    cur.current = { s: clamp(s, MIN, MAX), x: clamp(x, -maxTx(), maxTx()), y: clamp(y, -maxTy(), maxTy()) };
    scale.setValue(cur.current.s);
    tx.setValue(cur.current.x);
    ty.setValue(cur.current.y);
  };

  const reset = () => {
    saved.current = { s: 1, x: 0, y: 0 };
    Animated.parallel([
      Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 14, bounciness: 6 }),
      Animated.spring(tx, { toValue: 0, useNativeDriver: true, speed: 14, bounciness: 6 }),
      Animated.spring(ty, { toValue: 0, useNativeDriver: true, speed: 14, bounciness: 6 }),
    ]).start();
    cur.current = { s: 1, x: 0, y: 0 };
  };

  const responder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, g) => g.numberActiveTouches === 2 || Math.abs(g.dx) + Math.abs(g.dy) > 8,
      onPanResponderGrant: () => {
        saved.current = { ...cur.current };
        pinchDist.current = 0;
      },
      onPanResponderMove: (evt, g) => {
        const touches = evt.nativeEvent.touches;
        if (touches.length >= 2) {
          const d = Math.hypot(touches[0].pageX - touches[1].pageX, touches[0].pageY - touches[1].pageY);
          if (pinchDist.current === 0) pinchDist.current = d;
          const s = (saved.current.s * d) / Math.max(1, pinchDist.current);
          apply(s, saved.current.x, saved.current.y);
        } else {
          apply(saved.current.s, saved.current.x + g.dx, saved.current.y + g.dy);
        }
      },
      onPanResponderRelease: (evt, g) => {
        pinchDist.current = 0;
        if (Math.abs(g.dx) + Math.abs(g.dy) < 6) {
          const now = Date.now();
          if (now - lastTap.current < 300) {
            lastTap.current = 0;
            if (cur.current.s > 1.5) {
              reset();
            } else {
              const nx = clamp(((box.current.w / 2 - evt.nativeEvent.locationX) * 1.8) / 2, -1e9, 1e9);
              const ny = clamp(((box.current.h / 2 - evt.nativeEvent.locationY) * 1.8) / 2, -1e9, 1e9);
              saved.current = { s: 2.8, x: clamp(nx, -(2.8 - 1) * box.current.w / 2, (2.8 - 1) * box.current.w / 2), y: clamp(ny, -(2.8 - 1) * box.current.h / 2, (2.8 - 1) * box.current.h / 2) };
              Animated.parallel([
                Animated.spring(scale, { toValue: 2.8, useNativeDriver: true, speed: 14, bounciness: 6 }),
                Animated.spring(tx, { toValue: saved.current.x, useNativeDriver: true, speed: 14, bounciness: 6 }),
                Animated.spring(ty, { toValue: saved.current.y, useNativeDriver: true, speed: 14, bounciness: 6 }),
              ]).start();
              cur.current = saved.current;
            }
          } else {
            lastTap.current = now;
          }
        }
      },
    })
  ).current;

  const onLayout = (e: LayoutChangeEvent) => {
    box.current = { w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height };
  };

  return (
    <View style={styles.wrap} {...responder.panHandlers} onLayout={onLayout}>
      <Animated.View style={[styles.canvas, { transform: [{ translateX: tx }, { translateY: ty }, { scale }] }]}>
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
                <SvgText x={g.cityAt[0] + 5} y={g.cityAt[1] + 3} fontSize={9} fill="#cfd6e4" opacity={0.85}>{g.city}</SvgText>
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
      </Animated.View>

      <Pressable style={styles.resetBtn} onPress={reset} hitSlop={10}>
        <RNText style={styles.resetText}>⟲</RNText>
      </Pressable>
      <RNText style={styles.hint}>🔍 {t('map.hint')}</RNText>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: '#0b0f1a', overflow: 'hidden' },
  canvas: { flex: 1, width: '100%', height: '100%' },
  svg: { flex: 1, width: '100%', height: '100%' },
  resetBtn: {
    position: 'absolute', top: 10, right: 10, width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(16,22,37,0.9)', borderColor: '#3a4a6b', borderWidth: 1,
    alignItems: 'center', justifyContent: 'center', zIndex: 25,
  },
  resetText: { color: '#e6b422', fontSize: 18, fontWeight: '900' },
  hint: {
    position: 'absolute', bottom: 8, alignSelf: 'center',
    color: '#5f6f88', fontSize: 10, backgroundColor: 'rgba(11,15,26,0.7)',
    paddingHorizontal: 10, paddingVertical: 3, borderRadius: 10,
  },
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
