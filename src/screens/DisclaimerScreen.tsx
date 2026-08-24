import React from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { useGame, useLang } from '../store';
import { t } from '../i18n';

export function DisclaimerScreen() {
  const setScreen = useGame((g) => g.setScreen);
  useLang();
  return (
    <View style={s.wrap}>
      <ScrollView contentContainerStyle={{ gap: 14, paddingVertical: 30 }}>
        <Text style={s.h}>{t('disc.h')}</Text>
        <Text style={s.p}>{t('disc.p1')}</Text>
        <Text style={s.p}>{t('disc.p2')}</Text>
        <Text style={s.p}>{t('disc.p3')}</Text>
        <Pressable style={s.btn} onPress={() => setScreen('setup')}>
          <Text style={s.btnText}>{t('disc.btn')} ▸</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: '#0b0f1a', paddingHorizontal: 24 },
  h: { color: '#e6b422', fontSize: 18, fontWeight: '900', letterSpacing: 2, textAlign: 'center', marginTop: 16 },
  p: { color: '#aeb9cf', fontSize: 13, lineHeight: 20 },
  btn: { backgroundColor: '#c23', paddingVertical: 14, borderRadius: 10, alignItems: 'center', marginTop: 8, marginBottom: 24 },
  btnText: { color: '#fff', fontWeight: '900', letterSpacing: 1 },
});
