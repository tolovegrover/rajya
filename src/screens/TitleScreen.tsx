import React, { useEffect } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useGame, useSettings } from '../store';
import { CharacterPortrait } from '../components/CharacterPortrait';
import { CHARACTERS } from '../data/characters';
import { LanguageBar } from '../components/LanguageBar';
import { t } from '../i18n';

export function TitleScreen() {
  const { setScreen } = useGame();
  const settings = useSettings((s) => s.settings);
  useSettings((s) => s.settings.lang);
  const load = useSettings((s) => s.load);
  useEffect(() => {
    void load();
  }, [load]);

  const cast = ['moni', 'amir', 'devraj', 'vikram', 'moomta', 'thikait'];
  const aiLabel = settings.provider === 'offline' ? t('ai.offline') : settings.provider === 'anthropic' ? 'CLAUDE' : settings.provider === 'gemini' ? 'GEMINI' : t('ai.compat');

  return (
    <View style={s.wrap}>
      <Text style={s.kicker}>{t('title.kicker')}</Text>
      <Text style={s.title}>RAJYA</Text>
      <Text style={s.subtitle}>{t('title.sub')}</Text>
      <View style={s.cast}>
        {cast.map((id) => {
          const c = CHARACTERS.find((x) => x.id === id);
          return c ? <CharacterPortrait key={id} spec={c.avatar} size={52} /> : null;
        })}
      </View>
      <Text style={s.blurb}>{t('title.blurb')}</Text>
      <LanguageBar />
      <Pressable style={s.btn} onPress={() => setScreen('disclaimer')}>
        <Text style={s.btnText}>{t('title.new')} ▸</Text>
      </Pressable>
      <Pressable style={s.btn2} onPress={() => setScreen('settings')}>
        <Text style={s.btn2Text}>{t('title.ai')} · {aiLabel}</Text>
      </Pressable>
      <Pressable style={s.btn2} onPress={() => setScreen('codex')}>
        <Text style={s.btn2Text}>{t('title.codex')}</Text>
      </Pressable>
      <Text style={s.foot}>{t('title.foot')}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: '#0b0f1a', alignItems: 'center', justifyContent: 'center', padding: 20, gap: 9 },
  kicker: { color: '#c96a3f', fontSize: 10, letterSpacing: 3, fontWeight: '800' },
  title: { color: '#e6b422', fontSize: 64, fontWeight: '900', letterSpacing: 6 },
  subtitle: { color: '#eef1f8', fontSize: 18, fontWeight: '300', letterSpacing: 8, marginBottom: 6 },
  cast: { flexDirection: 'row', gap: 6, marginVertical: 8 },
  blurb: { color: '#aeb9cf', fontSize: 12, lineHeight: 18, textAlign: 'center', maxWidth: 340, marginBottom: 10 },
  btn: { backgroundColor: '#c23', paddingHorizontal: 40, paddingVertical: 14, borderRadius: 10 },
  btnText: { color: '#fff', fontWeight: '900', letterSpacing: 2, fontSize: 14 },
  btn2: { borderColor: '#3a4a6b', borderWidth: 1, paddingHorizontal: 24, paddingVertical: 8, borderRadius: 8 },
  btn2Text: { color: '#aeb9cf', fontWeight: '700', fontSize: 11, letterSpacing: 1 },
  foot: { color: '#5f6f88', fontSize: 9, marginTop: 10 },
});
