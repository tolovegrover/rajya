import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, ActivityIndicator, StyleSheet } from 'react-native';
import { Character, AvatarSpec, AvatarHat, FactionId } from '../types';
import { FACTIONS } from '../data/factions';
import { CharacterPortrait } from './CharacterPortrait';
import { generatePersona } from '../llm/personaGen';
import { useSettings } from '../store';
import { t } from '../i18n';
import { LANGS } from '../i18n';

const HATS: { key: AvatarHat; label: string }[] = [
  { key: 'none', label: '🙂' },
  { key: 'pagdi', label: '👳' },
  { key: 'cap', label: '🎩' },
  { key: 'crown', label: '👑' },
  { key: 'armycap', label: '🪖' },
  { key: 'muffler', label: '🧣' },
  { key: 'topknot', label: '🪢' },
  { key: 'saffronhood', label: '🟠' },
  { key: 'coiffure', label: '💇' },
  { key: 'whitestreak', label: '⬜' },
  { key: 'scarf', label: '🧵' },
];

const SKINS = ['#e8b98a', '#e0a878', '#c98e5c', '#a06b3f', '#7c4f2a'];
const KURTAS = ['#f4efe6', '#3d4c63', '#f26a1b', '#2c5f8a', '#3f7a44', '#1c1f26', '#e8e0f0', '#f4dd9c'];
const HATCOLORS = ['#f0e6c8', '#e6b422', '#c9553d', '#2a2a2a', '#3f7a44', '#d33'];
const BEARDS: { key: AvatarSpec['beard']; label: string }[] = [
  { key: 'none', label: 'n' },
  { key: 'stubble', label: 's' },
  { key: 'dark', label: 'd' },
  { key: 'white', label: 'w' },
];

const newAvatar = (): AvatarSpec => ({
  skin: '#e8b98a', kurta: '#3d4c63', hat: 'none', hatColor: '#e6b422', beard: 'none', glasses: false, tilak: false, female: false,
});

export function CharacterStudio() {
  const { settings, addCharacter, removeCharacter } = useSettings();
  const [form, setForm] = useState<Character | null>(null);
  const [inspiration, setInspiration] = useState('');
  const [generating, setGenerating] = useState(false);
  const [genBadge, setGenBadge] = useState<'llm' | 'offline' | null>(null);

  const llmLang = settings.language.trim() || (LANGS.find((l) => l.code === settings.lang)?.llm ?? 'Hindi');

  const avatar = form?.avatar ?? newAvatar();
  const setAvatar = (patch: Partial<AvatarSpec>) => setForm((f) => (f ? { ...f, avatar: { ...f.avatar, ...patch } } : f));

  const doGenerate = async () => {
    if (!form) return;
    setGenerating(true);
    setGenBadge(null);
    const res = await generatePersona(settings, {
      name: form.name || 'the new leader',
      title: form.title || 'a rising figure',
      faction: FACTIONS.find((f) => f.id === form.faction)?.name ?? form.faction,
      inspiration: inspiration.trim() || undefined,
      language: llmLang,
    });
    setForm((f) => (f ? { ...f, persona: res.text } : f));
    setGenBadge(res.source);
    setGenerating(false);
  };

  const chip = (active: boolean) => [st.chip, active && st.chipOn];

  return (
    <View style={{ gap: 10 }}>
      <Text style={st.h}>{t('char.customcast')}</Text>
      <Text style={st.note}>{t('char.inspirenote')}</Text>

      {settings.customCharacters.map((c) => (
        <View key={c.id} style={st.card}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <CharacterPortrait spec={c.avatar} size={48} />
            <View style={{ flex: 1 }}>
              <Text style={st.name}>{c.name}</Text>
              <Text style={st.title}>{c.title}</Text>
            </View>
            <Pressable style={st.delBtn} onPress={() => removeCharacter(c.id)}>
              <Text style={st.delText}>{t('char.delete')}</Text>
            </Pressable>
          </View>
        </View>
      ))}
      {settings.customCharacters.length === 0 && <Text style={st.note}>{t('char.customnone')}</Text>}

      {form === null ? (
        <Pressable
          style={st.addBtn}
          onPress={() => setForm({ id: `custom_${Date.now().toString(36)}`, name: '', title: '', faction: 'kangress', persona: '', avatar: newAvatar(), alive: true, mood: 0 })}
        >
          <Text style={st.addText}>{t('char.add')}</Text>
        </Pressable>
      ) : (
        <View style={st.card}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <CharacterPortrait spec={avatar} size={64} />
            <View style={{ flex: 1, gap: 6 }}>
              <TextInput value={form.name} onChangeText={(v) => setForm({ ...form, name: v })} placeholder={t('char.newname')} placeholderTextColor="#5f6f88" style={st.input} />
              <TextInput value={form.title} onChangeText={(v) => setForm({ ...form, title: v })} placeholder={t('char.newtitle')} placeholderTextColor="#5f6f88" style={st.input} />
            </View>
          </View>

          <Text style={st.label}>{t('char.faction')}</Text>
          <View style={st.row}>
            {FACTIONS.map((f) => (
              <Pressable key={f.id} style={chip(form.faction === f.id)} onPress={() => setForm({ ...form, faction: f.id as FactionId })}>
                <Text style={[st.chipText, form.faction === f.id && { color: '#0b0f1a' }]}>{f.short}</Text>
              </Pressable>
            ))}
          </View>

          <Text style={st.label}>{t('char.inspire')}</Text>
          <TextInput value={inspiration} onChangeText={setInspiration} placeholder={t('char.inspireph')} placeholderTextColor="#5f6f88" style={st.input} />

          <View style={st.row}>
            <Text style={st.label}>{t('char.persona')}</Text>
            <Pressable style={[st.genBtn, generating && { opacity: 0.5 }]} onPress={() => void doGenerate()} disabled={generating}>
              {generating ? <ActivityIndicator size="small" color="#fff" /> : <Text style={st.genText}>⚡ {t('char.generate')}</Text>}
            </Pressable>
          </View>
          {genBadge && (
            <Text style={st.genBadge}>{genBadge === 'llm' ? t('char.generated') : t('char.offlinepersona')}</Text>
          )}
          <TextInput
            value={form.persona}
            onChangeText={(v) => setForm({ ...form, persona: v })}
            multiline
            style={[st.input, { minHeight: 100, textAlignVertical: 'top' }]}
            placeholderTextColor="#5f6f88"
          />

          <Text style={st.label}>{t('char.look')}</Text>
          <View style={st.row}>{HATS.map((h) => (
            <Pressable key={h.key} style={chip(avatar.hat === h.key)} onPress={() => setAvatar({ hat: h.key })}>
              <Text style={st.chipText}>{h.label}</Text>
            </Pressable>
          ))}</View>
          <View style={st.row}>{SKINS.map((c) => (
            <Pressable key={c} style={[st.swatch, { backgroundColor: c }, avatar.skin === c && st.swatchOn]} onPress={() => setAvatar({ skin: c })} />
          ))}</View>
          <View style={st.row}>{KURTAS.map((c) => (
            <Pressable key={c} style={[st.swatch, { backgroundColor: c }, avatar.kurta === c && st.swatchOn]} onPress={() => setAvatar({ kurta: c })} />
          ))}</View>
          <View style={st.row}>
            {BEARDS.map((b) => (
              <Pressable key={b.key} style={chip(avatar.beard === b.key)} onPress={() => setAvatar({ beard: b.key })}>
                <Text style={[st.chipText, avatar.beard === b.key && { color: '#0b0f1a' }]}>🧔{b.label}</Text>
              </Pressable>
            ))}
            <Pressable style={chip(avatar.glasses)} onPress={() => setAvatar({ glasses: !avatar.glasses })}>
              <Text style={[st.chipText, avatar.glasses && { color: '#0b0f1a' }]}>👓</Text>
            </Pressable>
            <Pressable style={chip(avatar.tilak)} onPress={() => setAvatar({ tilak: !avatar.tilak })}>
              <Text style={[st.chipText, avatar.tilak && { color: '#0b0f1a' }]}>🟥</Text>
            </Pressable>
            <Pressable style={chip(avatar.female)} onPress={() => setAvatar({ female: !avatar.female })}>
              <Text style={[st.chipText, avatar.female && { color: '#0b0f1a' }]}>♀</Text>
            </Pressable>
          </View>

          <View style={st.row}>
            <Pressable style={st.saveBtn} onPress={() => { addCharacter(form); setForm(null); setInspiration(''); setGenBadge(null); }}>
              <Text style={st.saveText}>{t('char.savechar')}</Text>
            </Pressable>
            <Pressable style={st.delBtn} onPress={() => setForm(null)}>
              <Text style={st.delText}>{t('common.back')}</Text>
            </Pressable>
          </View>
        </View>
      )}
    </View>
  );
}

const st = StyleSheet.create({
  h: { color: '#e6b422', fontSize: 15, fontWeight: '900', letterSpacing: 1, marginTop: 6 },
  note: { color: '#7f8ea3', fontSize: 11, lineHeight: 16 },
  card: { backgroundColor: '#101625', borderColor: '#26324a', borderWidth: 1, borderRadius: 12, padding: 10, gap: 8 },
  name: { color: '#eef1f8', fontSize: 14, fontWeight: '900' },
  title: { color: '#5f6f88', fontSize: 10 },
  label: { color: '#5f6f88', fontSize: 10, fontWeight: '900', letterSpacing: 1, marginTop: 2 },
  row: { flexDirection: 'row', gap: 5, flexWrap: 'wrap', alignItems: 'center' },
  input: {
    color: '#eef1f8', backgroundColor: '#0d1322', borderColor: '#2a3650', borderWidth: 1,
    borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8, fontSize: 13,
  },
  chip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, backgroundColor: '#0d1322', borderColor: '#2a3650', borderWidth: 1 },
  chipOn: { backgroundColor: '#e6b422', borderColor: '#e6b422' },
  chipText: { color: '#aeb9cf', fontSize: 10, fontWeight: '900' },
  swatch: { width: 26, height: 26, borderRadius: 13, borderWidth: 2, borderColor: '#0d1322' },
  swatchOn: { borderColor: '#ffffff' },
  addBtn: { borderColor: '#e6b422', borderWidth: 1, borderRadius: 10, padding: 12, alignItems: 'center' },
  addText: { color: '#e6b422', fontWeight: '900', letterSpacing: 1 },
  genBtn: { backgroundColor: '#7c3aed', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, flexDirection: 'row', gap: 4 },
  genText: { color: '#fff', fontWeight: '900', fontSize: 11 },
  genBadge: { color: '#a78bfa', fontSize: 10, fontStyle: 'italic' },
  saveBtn: { backgroundColor: '#c23', borderRadius: 8, paddingHorizontal: 16, paddingVertical: 9 },
  saveText: { color: '#fff', fontWeight: '900', fontSize: 11 },
  delBtn: { borderColor: '#3a4a6b', borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8 },
  delText: { color: '#c96a3f', fontWeight: '800', fontSize: 10 },
});
