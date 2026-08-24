import React from 'react';
import { View, Text, Pressable, Linking, StyleSheet, Platform } from 'react-native';
import Constants from 'expo-constants';
import { useGame, useSettings } from '../store';
import { t, getLang } from '../i18n';

// Set this to the address you want players to write to. Empty = the email button stays hidden
// and GitHub issues is the only channel.
export const SUPPORT_EMAIL = '';
const ISSUES_URL = 'https://github.com/tolovegrover/rajya/issues/new';

/** What we attach to a report: enough to reproduce, never a key. */
function diagnostics(): string {
  const { settings } = useSettings.getState();
  const { state, rescueLog } = useGame.getState();
  const version = (Constants.expoConfig as { version?: string } | null)?.version ?? '?';
  return [
    `Rajya ${version} · ${Platform.OS}`,
    `language: ${getLang()} · narration: ${settings.language || 'same as interface'}`,
    `provider: ${settings.provider} · model: ${settings.anthropicModel || settings.geminiModel || settings.compatModel || '-'}`,
    state ? `campaign: ${state.role} · week ${state.week}/${state.year} · η ${state.eta} · turn ${state.turn}` : 'campaign: none',
    rescueLog.length ? `last rescue: T${rescueLog[0].tier} ${rescueLog[0].note}` : 'rescues: none',
    '',
    '--- what happened? ---',
    '',
  ].join('\n');
}

export function SupportBlock() {
  const setScreen = useGame((g) => g.setScreen);
  const open = (url: string) => Linking.openURL(url).catch(() => undefined);
  const body = encodeURIComponent(diagnostics());

  return (
    <>
      <Text style={s.h}>{t('sup.h')}</Text>
      <Text style={s.note}>{t('sup.note')}</Text>
      <View style={s.row}>
        <Pressable style={s.btn} onPress={() => open(`${ISSUES_URL}?body=${body}`)}>
          <Text style={s.btnText}>{t('sup.report')}</Text>
        </Pressable>
        {!!SUPPORT_EMAIL && (
          <Pressable style={s.btn} onPress={() => open(`mailto:${SUPPORT_EMAIL}?subject=Rajya%20support&body=${body}`)}>
            <Text style={s.btnText}>{t('sup.email')}</Text>
          </Pressable>
        )}
        <Pressable style={s.btn} onPress={() => setScreen('codex')}>
          <Text style={s.btnText}>{t('sup.manual')}</Text>
        </Pressable>
      </View>
    </>
  );
}

const s = StyleSheet.create({
  h: { color: '#e6b422', fontSize: 16, fontWeight: '900', letterSpacing: 1, marginTop: 8 },
  note: { color: '#7f8ea3', fontSize: 11, lineHeight: 16 },
  row: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  btn: { borderColor: '#3a4a6b', borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 9 },
  btnText: { color: '#aeb9cf', fontSize: 10, fontWeight: '900', letterSpacing: 0.5 },
});
