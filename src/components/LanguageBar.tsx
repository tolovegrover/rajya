import React from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { useSettings } from '../store';
import { LANGS } from '../i18n';

/** Horizontal picker for the interface language. Shown on the title screen and in AI setup. */
export function LanguageBar() {
  const lang = useSettings((s) => s.settings.lang);
  const setSettings = useSettings((s) => s.setSettings);
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.row}>
      {LANGS.map((l) => (
        <Pressable key={l.code} style={[s.chip, lang === l.code && s.sel]} onPress={() => setSettings({ lang: l.code })}>
          <Text style={[s.text, lang === l.code && { color: '#0b0f1a' }]}>{l.label}</Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  row: { gap: 6, paddingHorizontal: 2, alignItems: 'center' },
  chip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 8, backgroundColor: '#101625', borderColor: '#2a3650', borderWidth: 1 },
  sel: { backgroundColor: '#e6b422', borderColor: '#e6b422' },
  text: { color: '#aeb9cf', fontSize: 12, fontWeight: '800' },
});
