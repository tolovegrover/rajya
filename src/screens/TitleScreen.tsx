import React, { useEffect } from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useGame, useSettings } from '../store';
import { CharacterPortrait } from '../components/CharacterPortrait';
import { FancyButton } from '../components/FancyButton';
import { CHARACTERS } from '../data/characters';
import { LanguageBar } from '../components/LanguageBar';
import { t } from '../i18n';
import { F, GOLD, ORANGE } from '../theme';

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
    <LinearGradient colors={['#141021', '#0b0f1a', '#1a0e08']} locations={[0, 0.55, 1]} style={s.wrap}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        <Text style={s.kicker}>{t('title.kicker')}</Text>

        <View style={s.titleRow}>
          <Text style={[s.titleBig, { color: '#3a2c05', position: 'absolute', transform: [{ translateY: 4 }, { translateX: 3 }] }]}>RAJYA</Text>
          <Text style={[s.titleBig, { color: GOLD, textShadowColor: 'rgba(230,180,34,0.9)', textShadowRadius: 22 }]}>RAJYA</Text>
        </View>

        <LinearGradient
          colors={['rgba(230,180,34,0.9)', 'rgba(255,255,255,0.95)', 'rgba(230,180,34,0.9)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={s.rule}
        />
        <Text style={[s.subtitle, { fontFamily: F.deco, textShadowColor: 'rgba(255,255,255,0.4)', textShadowRadius: 10 }]}>{t('title.sub')}</Text>

        <View style={s.cast}>
          {cast.map((id) => {
            const c = CHARACTERS.find((x) => x.id === id);
            return c ? <CharacterPortrait key={id} spec={c.avatar} size={58} /> : null;
          })}
        </View>

        <Text style={s.blurb}>{t('title.blurb')}</Text>

        <View style={{ alignSelf: 'stretch', gap: 12 }}>
          <FancyButton label={`${t('title.new')}  ▸`} onPress={() => setScreen('disclaimer')} />
          <FancyButton label={`${t('title.ai')} · ${aiLabel}`} variant="gold" small onPress={() => setScreen('settings')} />
          <FancyButton label={t('title.codex')} variant="ghost" small onPress={() => setScreen('codex')} />
          <FancyButton label={`📜 ${t('title.chronicle')}`} variant="ghost" small onPress={() => setScreen('chronicle')} />
        </View>

        <LanguageBar />

        <Text style={s.foot}>{t('title.foot')}</Text>
      </ScrollView>
    </LinearGradient>
  );
}

const s = StyleSheet.create({
  wrap: { flex: 1 },
  scroll: { alignItems: 'center', justifyContent: 'center', padding: 20, gap: 12, flexGrow: 1 },
  kicker: {
    color: ORANGE,
    fontSize: 12,
    letterSpacing: 5,
    fontWeight: '900',
    fontFamily: F.titleBlack,
    textShadowColor: 'rgba(242,106,27,0.6)',
    textShadowRadius: 8,
  },
  titleRow: { height: 96, justifyContent: 'center' },
  titleBig: {
    fontFamily: F.decoBlack,
    fontSize: 76,
    letterSpacing: 8,
    textAlign: 'center',
  },
  rule: { height: 3, width: '86%', borderRadius: 2, marginTop: -4 },
  subtitle: {
    color: '#f4efe6',
    fontSize: 20,
    letterSpacing: 9,
    marginTop: 2,
  },
  cast: { flexDirection: 'row', gap: 8, marginVertical: 6 },
  blurb: { color: '#b7c3da', fontSize: 13, lineHeight: 20, textAlign: 'center', maxWidth: 360 },
  foot: { color: '#5f6f88', fontSize: 10, marginTop: 4 },
});
