import React, { useState } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { useGame, useSettings } from '../store';
import { PLAYER_ROLES } from '../data/factions';
import { PlayerRoleId } from '../types';

const ETA_PRESETS = [0.1, 0.3, 0.5, 0.7, 0.9];

const etaLabel = (e: number) =>
  e <= 0.15 ? 'IDEAL — governance mostly works; scandals are rare' :
  e <= 0.35 ? 'MILD — normal politics, honest coalitions mostly' :
  e <= 0.6 ? 'LIVELY — defections, stings, quota wars' :
  e <= 0.8 ? 'VOLATILE — riots proliferate, allies betray' :
  'CHAOS — the republic runs on noise; anything, anytime';

export function CampaignSetup() {
  const { newGame, setScreen } = useGame();
  const settings = useSettings((s) => s.settings);
  const setSettings = useSettings((s) => s.setSettings);
  const [role, setRole] = useState<PlayerRoleId>('strategist');
  const [eta, setEta] = useState(0.5);

  const aiLabel = settings.provider === 'offline' ? 'Offline engine (no key)' : settings.provider === 'anthropic' ? `Claude · ${settings.anthropicModel}` : settings.provider === 'gemini' ? `Gemini · ${settings.geminiModel}` : `Compatible API · ${settings.compatModel}`;

  return (
    <View style={s.wrap}>
      <ScrollView contentContainerStyle={{ padding: 18, gap: 14, paddingBottom: 40 }}>
        <Text style={s.h}>NEW CAMPAIGN</Text>

        <Text style={s.label}>1 · CHOOSE YOUR SHADOW</Text>
        {PLAYER_ROLES.map((r) => (
          <Pressable key={r.id} style={[s.roleCard, role === r.id && s.roleSel]} onPress={() => setRole(r.id)}>
            <Text style={s.roleName}>{r.name}</Text>
            <Text style={s.roleTag}>{r.tagline}</Text>
            <Text style={s.roleWin}>WIN · {r.winText}</Text>
          </Pressable>
        ))}

        <Text style={s.label}>2 · SET THE NOISE η</Text>
        <View style={s.etaRow}>
          {ETA_PRESETS.map((v) => (
            <Pressable key={v} style={[s.etaChip, Math.abs(eta - v) < 0.01 && s.etaSel]} onPress={() => setEta(v)}>
              <Text style={[s.etaText, Math.abs(eta - v) < 0.01 && { color: '#0b0f1a' }]}>{v}</Text>
            </Pressable>
          ))}
        </View>
        <Text style={s.etaDesc}>η = {eta.toFixed(2)} — {etaLabel(eta)}</Text>

        <Text style={s.label}>3 · THE NARRATOR</Text>
        <View style={s.aiCard}>
          <Text style={s.aiText}>{aiLabel}</Text>
          <Pressable style={s.aiBtn} onPress={() => setScreen('settings')}>
            <Text style={s.aiBtnText}>CONFIGURE AI / API KEYS / PERSONAS</Text>
          </Pressable>
        </View>

        <Pressable style={s.start} onPress={() => newGame(role, eta)}>
          <Text style={s.startText}>OPEN THE CAMPAIGN ▸</Text>
        </Pressable>
        <Pressable style={s.back} onPress={() => setScreen('title')}>
          <Text style={s.backText}>◂ BACK</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: '#0b0f1a' },
  h: { color: '#e6b422', fontSize: 22, fontWeight: '900', letterSpacing: 2, textAlign: 'center', marginTop: 24 },
  label: { color: '#5f6f88', fontSize: 10, fontWeight: '900', letterSpacing: 2, marginTop: 6 },
  roleCard: { backgroundColor: '#101625', borderColor: '#26324a', borderWidth: 1, borderRadius: 12, padding: 12, gap: 3 },
  roleSel: { borderColor: '#e6b422', borderWidth: 2 },
  roleName: { color: '#eef1f8', fontSize: 15, fontWeight: '900' },
  roleTag: { color: '#aeb9cf', fontSize: 11, lineHeight: 16 },
  roleWin: { color: '#4d8fd1', fontSize: 9, fontWeight: '700', letterSpacing: 0.5 },
  etaRow: { flexDirection: 'row', gap: 6 },
  etaChip: { flex: 1, alignItems: 'center', paddingVertical: 8, borderRadius: 8, backgroundColor: '#101625', borderColor: '#26324a', borderWidth: 1 },
  etaSel: { backgroundColor: '#e6b422' },
  etaText: { color: '#aeb9cf', fontWeight: '900' },
  etaDesc: { color: '#7f8ea3', fontSize: 11, fontStyle: 'italic' },
  aiCard: { backgroundColor: '#101625', borderColor: '#26324a', borderWidth: 1, borderRadius: 12, padding: 12, gap: 8, alignItems: 'center' },
  aiText: { color: '#eef1f8', fontSize: 12, fontWeight: '700' },
  aiBtn: { borderColor: '#3a4a6b', borderWidth: 1, paddingHorizontal: 14, paddingVertical: 7, borderRadius: 8 },
  aiBtnText: { color: '#aeb9cf', fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  start: { backgroundColor: '#c23', paddingVertical: 15, borderRadius: 10, alignItems: 'center', marginTop: 10 },
  startText: { color: '#fff', fontWeight: '900', letterSpacing: 2 },
  back: { alignItems: 'center', padding: 8 },
  backText: { color: '#5f6f88', fontSize: 11 },
});
