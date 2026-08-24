import React, { useState } from 'react';
import {
  View, Text, TextInput, Pressable, ScrollView, StyleSheet, Switch,
} from 'react-native';
import { useGame, useSettings, useLang } from '../store';
import { CHARACTERS } from '../data/characters';
import { LanguageBar } from '../components/LanguageBar';
import { testConnection } from '../llm/adapters';
import { t } from '../i18n';

const COMPAT_PRESETS = [
  { label: 'opencode Zen', url: 'https://opencode.ai/zen/v1' },
  { label: 'OpenRouter', url: 'https://openrouter.ai/api/v1' },
  { label: 'OpenAI', url: 'https://api.openai.com/v1' },
  { label: 'Groq', url: 'https://api.groq.com/openai/v1' },
  { label: 'DeepSeek', url: 'https://api.deepseek.com/v1' },
  { label: 'Mistral', url: 'https://api.mistral.ai/v1' },
  { label: 'Together', url: 'https://api.together.xyz/v1' },
  { label: 'xAI Grok', url: 'https://api.x.ai/v1' },
  { label: 'Perplexity', url: 'https://api.perplexity.ai' },
  { label: 'Fireworks', url: 'https://api.fireworks.ai/inference/v1' },
  { label: 'Cerebras', url: 'https://api.cerebras.ai/v1' },
  { label: 'Sarvam (Indic)', url: 'https://api.sarvam.ai/v1' },
  { label: 'GitHub Models', url: 'https://models.inference.ai.azure.com' },
  { label: 'Ollama (local)', url: 'http://localhost:11434/v1' },
  { label: 'LM Studio', url: 'http://localhost:1234/v1' },
];

const GEMINI_MODELS = ['gemini-2.0-flash', 'gemini-2.5-flash', 'gemini-2.5-pro', 'gemini-2.0-flash-lite'];
const CLAUDE_MODELS = ['claude-sonnet-4-5', 'claude-opus-4-1', 'claude-haiku-4-5'];

export function SettingsScreen() {
  const setScreen = useGame((g) => g.setScreen);
  const hasGame = !!useGame((g) => g.state && !g.state.ending);
  const { settings, setSettings, setPersona } = useSettings();
  const [expandedChar, setExpandedChar] = useState<string | null>(null);
  const [personaDraft, setPersonaDraft] = useState('');
  const [probe, setProbe] = useState('');
  const rescueLog = useGame((g) => g.rescueLog);
  useLang();

  const input = (extra: object = {}) => ({
    color: '#eef1f8', backgroundColor: '#0d1322', borderColor: '#2a3650', borderWidth: 1,
    borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8, fontSize: 13, ...extra,
  });

  const runTest = async () => {
    setProbe(t('set.testing'));
    const r = await testConnection(settings);
    setProbe(`${r.ok ? '✅' : '⚠️'} ${r.detail}`);
  };

  const modelChips = (models: string[], value: string, onPick: (m: string) => void) => (
    <View style={s.row}>
      {models.map((m) => (
        <Pressable key={m} style={[s.chip, value === m && s.chipSel]} onPress={() => onPick(m)}>
          <Text style={[s.chipText, value === m && { color: '#0b0f1a' }]}>{m.replace(/^(gemini|claude)-/, '')}</Text>
        </Pressable>
      ))}
    </View>
  );

  return (
    <View style={s.wrap}>
      <ScrollView contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 48 }}>
        <Text style={s.h}>{t('set.uilang')}</Text>
        <LanguageBar />
        <Text style={s.note}>{t('set.uilangnote')}</Text>

        <Text style={s.h}>{t('title.ai')}</Text>

        <View style={s.row}>
          {(['offline', 'anthropic', 'gemini', 'openai-compat'] as const).map((p) => (
            <Pressable key={p} style={[s.chip, settings.provider === p && s.chipSel]} onPress={() => { setSettings({ provider: p }); setProbe(''); }}>
              <Text style={[s.chipText, settings.provider === p && { color: '#0b0f1a' }]}>
                {p === 'offline' ? t('ai.offline') : p === 'anthropic' ? 'CLAUDE' : p === 'gemini' ? 'GEMINI' : t('ai.compat')}
              </Text>
            </Pressable>
          ))}
        </View>

        {settings.provider === 'offline' && <Text style={s.note}>{t('set.offlinenote')}</Text>}

        {settings.provider === 'anthropic' && (
          <>
            <Text style={s.label}>ANTHROPIC · {t('set.apikey')}</Text>
            <TextInput value={settings.anthropicKey} onChangeText={(v) => setSettings({ anthropicKey: v })} secureTextEntry placeholder="sk-ant-…" placeholderTextColor="#5f6f88" style={input()} autoCapitalize="none" autoCorrect={false} />
            <Text style={s.label}>{t('set.mainmodel')}</Text>
            {modelChips(CLAUDE_MODELS, settings.anthropicModel, (m) => setSettings({ anthropicModel: m }))}
            <TextInput value={settings.anthropicModel} onChangeText={(v) => setSettings({ anthropicModel: v })} style={input()} autoCapitalize="none" autoCorrect={false} placeholder="claude-sonnet-4-5" />
            <Text style={s.label}>{t('set.flashmodel')}</Text>
            <TextInput value={settings.flashModel} onChangeText={(v) => setSettings({ flashModel: v })} style={input()} autoCapitalize="none" autoCorrect={false} placeholder="claude-haiku-4-5" />
          </>
        )}

        {settings.provider === 'gemini' && (
          <>
            <Text style={s.label}>GOOGLE AI STUDIO / GEMINI · {t('set.apikey')}</Text>
            <TextInput value={settings.geminiKey} onChangeText={(v) => setSettings({ geminiKey: v })} secureTextEntry placeholder="AIza…" placeholderTextColor="#5f6f88" style={input()} autoCapitalize="none" autoCorrect={false} />
            <Text style={s.label}>{t('set.mainmodel')}</Text>
            {modelChips(GEMINI_MODELS, settings.geminiModel, (m) => setSettings({ geminiModel: m }))}
            <TextInput value={settings.geminiModel} onChangeText={(v) => setSettings({ geminiModel: v })} style={input()} autoCapitalize="none" autoCorrect={false} placeholder="gemini-2.0-flash" />
            <Text style={s.label}>{t('set.flashmodel')}</Text>
            <TextInput value={settings.flashModel} onChangeText={(v) => setSettings({ flashModel: v })} style={input()} autoCapitalize="none" autoCorrect={false} placeholder="gemini-2.0-flash-lite" />
          </>
        )}

        {settings.provider === 'openai-compat' && (
          <>
            <Text style={s.label}>{t('set.baseurl')}</Text>
            <View style={s.row}>
              {COMPAT_PRESETS.map((p) => (
                <Pressable key={p.label} style={[s.chip, settings.compatBaseUrl === p.url && s.chipSel]} onPress={() => setSettings({ compatBaseUrl: p.url })}>
                  <Text style={[s.chipText, settings.compatBaseUrl === p.url && { color: '#0b0f1a' }]}>{p.label}</Text>
                </Pressable>
              ))}
            </View>
            <TextInput value={settings.compatBaseUrl} onChangeText={(v) => setSettings({ compatBaseUrl: v })} style={input()} autoCapitalize="none" autoCorrect={false} />
            <Text style={s.label}>{t('set.apikey')}</Text>
            <TextInput value={settings.compatKey} onChangeText={(v) => setSettings({ compatKey: v })} secureTextEntry style={input()} autoCapitalize="none" autoCorrect={false} />
            <Text style={s.label}>{t('set.mainmodel')}</Text>
            <TextInput value={settings.compatModel} onChangeText={(v) => setSettings({ compatModel: v })} style={input()} autoCapitalize="none" autoCorrect={false} placeholder="gpt-4o-mini / llama-3.3-70b / …" />
            <Text style={s.label}>{t('set.flashmodel')}</Text>
            <TextInput value={settings.flashModel} onChangeText={(v) => setSettings({ flashModel: v })} style={input()} autoCapitalize="none" autoCorrect={false} />
          </>
        )}

        {settings.provider !== 'offline' && (
          <>
            <Pressable style={s.testBtn} onPress={() => void runTest()}>
              <Text style={s.testText}>{t('set.test')}</Text>
            </Pressable>
            {!!probe && <Text style={s.note}>{probe}</Text>}
          </>
        )}

        <Text style={s.label}>{t('set.narration')}</Text>
        <TextInput
          value={settings.language}
          onChangeText={(v) => setSettings({ language: v })}
          style={input()}
          placeholder={t('set.narrationph')}
          placeholderTextColor="#5f6f88"
        />
        <Text style={s.note}>{t('set.narrationnote')}</Text>

        <Text style={s.label}>{t('set.directive')}</Text>
        <TextInput
          value={settings.gmDirective}
          onChangeText={(v) => setSettings({ gmDirective: v })}
          multiline
          style={input({ minHeight: 70, textAlignVertical: 'top' })}
          placeholder={t('set.directiveph')}
          placeholderTextColor="#5f6f88"
        />

        <View style={s.row}>
          <Text style={s.label}>{t('set.rescue')}</Text>
          <Switch value={settings.rescue} onValueChange={(v) => setSettings({ rescue: v })} />
        </View>
        <Text style={s.note}>{t('set.rescuenote')}</Text>

        <Text style={s.h}>{t('set.personas')}</Text>
        <Text style={s.note}>{t('set.personanote')}</Text>
        {CHARACTERS.map((c) => {
          const isExp = expandedChar === c.id;
          const persona = settings.personaOverrides[c.id] ?? t(`char.${c.id}.persona`, {}, c.persona);
          return (
            <View key={c.id} style={s.charCard}>
              <Pressable onPress={() => { setExpandedChar(isExp ? null : c.id); setPersonaDraft(persona); }}>
                <Text style={s.charName}>
                  {t(`char.${c.id}.name`, {}, c.name)} <Text style={s.charTitle}>· {t(`char.${c.id}.title`, {}, c.title)}</Text>
                </Text>
                {!isExp && <Text style={s.charPeek} numberOfLines={1}>{persona}</Text>}
              </Pressable>
              {isExp && (
                <>
                  <TextInput value={personaDraft} onChangeText={setPersonaDraft} multiline style={input({ minHeight: 110, textAlignVertical: 'top', marginTop: 8 })} />
                  <View style={[s.row, { marginTop: 8 }]}>
                    <Pressable style={s.saveBtn} onPress={() => { setPersona(c.id, personaDraft.trim() || persona); setExpandedChar(null); }}>
                      <Text style={s.saveText}>{t('set.save')}</Text>
                    </Pressable>
                    {settings.personaOverrides[c.id] && (
                      <Pressable style={s.resetBtn} onPress={() => { setPersona(c.id, ''); setPersonaDraft(t(`char.${c.id}.persona`, {}, c.persona)); }}>
                        <Text style={s.resetText}>{t('set.reset')}</Text>
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
            <Text style={s.h}>{t('set.log')}</Text>
            {rescueLog.slice(0, 8).map((e, i) => (
              <View key={i} style={s.logRow}>
                <Text style={s.logTier}>T{e.tier} · W{e.turn}</Text>
                <Text style={s.logNote} numberOfLines={2}>{e.note}</Text>
              </View>
            ))}
          </>
        )}

        <Pressable style={s.done} onPress={() => setScreen(hasGame ? 'game' : 'title')}>
          <Text style={s.doneText}>{t('common.done')} ▸</Text>
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
  testBtn: { borderColor: '#4d8fd1', borderWidth: 1, borderRadius: 8, paddingVertical: 10, alignItems: 'center' },
  testText: { color: '#4d8fd1', fontWeight: '900', fontSize: 11, letterSpacing: 1 },
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
