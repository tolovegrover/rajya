import React, { useState } from 'react';
import {
  View, Text, TextInput, Pressable, ScrollView, StyleSheet, Switch,
} from 'react-native';
import { useGame, useSettings, DEFAULT_SETTINGS } from '../store';
import { CHARACTERS } from '../data/characters';

const COMPAT_PRESETS = [
  { label: 'opencode Zen', url: 'https://opencode.ai/zen/v1' },
  { label: 'OpenRouter', url: 'https://openrouter.ai/api/v1' },
  { label: 'LM Studio (local)', url: 'http://localhost:1234/v1' },
];

export function SettingsScreen() {
  const setScreen = useGame((g) => g.setScreen);
  const hasGame = !!useGame((g) => g.state && !g.state.ending);
  const { settings, setSettings, setPersona } = useSettings();
  const [expandedChar, setExpandedChar] = useState<string | null>(null);
  const [personaDraft, setPersonaDraft] = useState('');
  const rescueLog = useGame((g) => g.rescueLog);

  const input = (extra: object = {}) => ({
    color: '#eef1f8', backgroundColor: '#0d1322', borderColor: '#2a3650', borderWidth: 1,
    borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8, fontSize: 13, ...extra,
  });

  return (
    <View style={s.wrap}>
      <ScrollView contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 48 }}>
        <Text style={s.h}>AI SETUP</Text>

        <View style={s.row}>
          {(['offline', 'anthropic', 'openai-compat'] as const).map((p) => (
            <Pressable key={p} style={[s.chip, settings.provider === p && s.chipSel]} onPress={() => setSettings({ provider: p })}>
              <Text style={[s.chipText, settings.provider === p && { color: '#0b0f1a' }]}>
                {p === 'offline' ? 'OFFLINE' : p === 'anthropic' ? 'CLAUDE' : 'COMPATIBLE'}
              </Text>
            </Pressable>
          ))}
        </View>

        {settings.provider === 'offline' && (
          <Text style={s.note}>
            No key, no problem: the procedural engine runs the whole game — beats, dilemmas and
            endings — from the same world rules. The AI layers only add narration and twists.
          </Text>
        )}

        {settings.provider === 'anthropic' && (
          <>
            <Text style={s.label}>ANTHROPIC API KEY (stored on this device only)</Text>
            <TextInput value={settings.anthropicKey} onChangeText={(v) => setSettings({ anthropicKey: v })} secureTextEntry placeholder="sk-ant-…" placeholderTextColor="#5f6f88" style={input()} autoCapitalize="none" autoCorrect={false} />
            <Text style={s.label}>MAIN MODEL (beats & dilemmas)</Text>
            <TextInput value={settings.anthropicModel} onChangeText={(v) => setSettings({ anthropicModel: v })} style={input()} autoCapitalize="none" autoCorrect={false} placeholder="claude-sonnet-4-5" />
            <Text style={s.label}>FLASH MODEL (ambient ticker, optional)</Text>
            <TextInput value={settings.flashModel} onChangeText={(v) => setSettings({ flashModel: v })} style={input()} autoCapitalize="none" autoCorrect={false} placeholder="claude-haiku-4-5" />
          </>
        )}

        {settings.provider === 'openai-compat' && (
          <>
            <Text style={s.label}>BASE URL (any OpenAI-compatible endpoint)</Text>
            <View style={s.row}>
              {COMPAT_PRESETS.map((p) => (
                <Pressable key={p.label} style={[s.chip, settings.compatBaseUrl === p.url && s.chipSel]} onPress={() => setSettings({ compatBaseUrl: p.url })}>
                  <Text style={[s.chipText, settings.compatBaseUrl === p.url && { color: '#0b0f1a' }]}>{p.label}</Text>
                </Pressable>
              ))}
            </View>
            <TextInput value={settings.compatBaseUrl} onChangeText={(v) => setSettings({ compatBaseUrl: v })} style={input()} autoCapitalize="none" autoCorrect={false} />
            <Text style={s.label}>API KEY (opencode / OpenRouter / local — device only)</Text>
            <TextInput value={settings.compatKey} onChangeText={(v) => setSettings({ compatKey: v })} secureTextEntry style={input()} autoCapitalize="none" autoCorrect={false} />
            <Text style={s.label}>MAIN MODEL</Text>
            <TextInput value={settings.compatModel} onChangeText={(v) => setSettings({ compatModel: v })} style={input()} autoCapitalize="none" autoCorrect={false} placeholder="claude-sonnet-4-5 / gpt-4o-mini / …" />
            <Text style={s.label}>FLASH MODEL (ambient)</Text>
            <TextInput value={settings.flashModel} onChangeText={(v) => setSettings({ flashModel: v })} style={input()} autoCapitalize="none" autoCorrect={false} placeholder="any cheap model" />
          </>
        )}

        <Text style={s.label}>GAME LANGUAGE</Text>
        <View style={s.row}>
          {['English', 'Hinglish', 'Hindi'].map((l) => (
            <Pressable key={l} style={[s.chip, settings.language.startsWith(l) && s.chipSel]} onPress={() => setSettings({ language: l })}>
              <Text style={[s.chipText, settings.language.startsWith(l) && { color: '#0b0f1a' }]}>{l.toUpperCase()}</Text>
            </Pressable>
          ))}
        </View>

        <Text style={s.label}>GAME MASTER DIRECTIVE (your custom instructions)</Text>
        <TextInput
          value={settings.gmDirective}
          onChangeText={(v) => setSettings({ gmDirective: v })}
          multiline
          style={input({ minHeight: 70, textAlignVertical: 'top' })}
          placeholder="e.g. make media omnipotent, lean into satire, never kill Moni…"
          placeholderTextColor="#5f6f88"
        />

        <View style={s.row}>
          <Text style={s.label}>REFUSAL RESCUE LADDER</Text>
          <Switch value={settings.rescue} onValueChange={(v) => setSettings({ rescue: v })} />
        </View>
        <Text style={s.note}>
          When on: refused or invalid AI replies are retried as fiction-editor reframe → neutral
          rewrite → historian transform → offline engine, so a beat is never lost to political
          correctness. Log below.
        </Text>

        <Text style={s.h}>CHARACTER AI · PERSONAS</Text>
        <Text style={s.note}>Each leader runs on their own instruction block. Rewrite anyone; the voice is yours.</Text>
        {CHARACTERS.map((c) => {
          const isExp = expandedChar === c.id;
          return (
            <View key={c.id} style={s.charCard}>
              <Pressable onPress={() => { setExpandedChar(isExp ? null : c.id); setPersonaDraft(settings.personaOverrides[c.id] ?? c.persona); }}>
                <Text style={s.charName}>{c.name} <Text style={s.charTitle}>· {c.title}</Text></Text>
                {!isExp && <Text style={s.charPeek} numberOfLines={1}>{settings.personaOverrides[c.id] ?? c.persona}</Text>}
              </Pressable>
              {isExp && (
                <>
                  <TextInput value={personaDraft} onChangeText={setPersonaDraft} multiline style={input({ minHeight: 110, textAlignVertical: 'top', marginTop: 8 })} />
                  <View style={[s.row, { marginTop: 8 }]}>
                    <Pressable style={s.saveBtn} onPress={() => { setPersona(c.id, personaDraft.trim() || c.persona); setExpandedChar(null); }}>
                      <Text style={s.saveText}>SAVE PERSONA</Text>
                    </Pressable>
                    {settings.personaOverrides[c.id] && (
                      <Pressable style={s.resetBtn} onPress={() => { setPersona(c.id, ''); setPersonaDraft(c.persona); }}>
                        <Text style={s.resetText}>RESET</Text>
                      </Pressable>
                    )}
                  </View>
                </>
              )}
            </View>
          );
        })}

        {rescueLog.length > 0 && (
          <>
            <Text style={s.h}>RESCUE LOG</Text>
            {rescueLog.slice(0, 8).map((e, i) => (
              <View key={i} style={s.logRow}>
                <Text style={s.logTier}>T{e.tier} · W{e.turn}</Text>
                <Text style={s.logNote} numberOfLines={2}>{e.note}</Text>
              </View>
            ))}
          </>
        )}

        <Pressable style={s.done} onPress={() => setScreen(hasGame ? 'game' : 'title')}>
          <Text style={s.doneText}>DONE ▸</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: '#0b0f1a' },
  h: { color: '#e6b422', fontSize: 16, fontWeight: '900', letterSpacing: 1, marginTop: 8 },
  label: { color: '#5f6f88', fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  note: { color: '#7f8ea3', fontSize: 11, lineHeight: 16 },
  row: { flexDirection: 'row', gap: 6, alignItems: 'center', flexWrap: 'wrap' },
  chip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 8, backgroundColor: '#101625', borderColor: '#2a3650', borderWidth: 1 },
  chipSel: { backgroundColor: '#e6b422', borderColor: '#e6b422' },
  chipText: { color: '#aeb9cf', fontSize: 10, fontWeight: '900' },
  charCard: { backgroundColor: '#101625', borderColor: '#26324a', borderWidth: 1, borderRadius: 10, padding: 10 },
  charName: { color: '#eef1f8', fontSize: 13, fontWeight: '900' },
  charTitle: { color: '#5f6f88', fontSize: 10, fontWeight: '400' },
  charPeek: { color: '#7f8ea3', fontSize: 10, marginTop: 2 },
  saveBtn: { backgroundColor: '#c23', borderRadius: 8, paddingHorizontal: 14, paddingVertical: 8 },
  saveText: { color: '#fff', fontWeight: '900', fontSize: 10 },
  resetBtn: { borderColor: '#3a4a6b', borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8 },
  resetText: { color: '#aeb9cf', fontWeight: '800', fontSize: 10 },
  logRow: { flexDirection: 'row', gap: 8, alignItems: 'center', backgroundColor: '#101625', borderRadius: 8, padding: 8 },
  logTier: { color: '#c93fd1', fontSize: 10, fontWeight: '900' },
  logNote: { color: '#aeb9cf', fontSize: 10, flex: 1 },
  done: { backgroundColor: '#c23', paddingVertical: 14, borderRadius: 10, alignItems: 'center' },
  doneText: { color: '#fff', fontWeight: '900', letterSpacing: 1 },
});
