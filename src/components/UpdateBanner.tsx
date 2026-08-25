import React from 'react';
import { View, Text, Pressable, Linking, StyleSheet, Platform } from 'react-native';
import Constants from 'expo-constants';
import { checkForUpdate, Update } from '../update';
import { useLang } from '../store';
import { t } from '../i18n';

/** Sits on the title screen and speaks up only when a newer build has been published. */
export function UpdateBanner() {
  const [update, setUpdate] = React.useState<Update | null>(null);
  useLang();

  React.useEffect(() => {
    if (Platform.OS === 'web') return;              // the web build is always the latest
    const current = (Constants.expoConfig as { version?: string } | null)?.version ?? '0.0';
    let alive = true;
    void checkForUpdate(current).then((u) => alive && setUpdate(u));
    return () => { alive = false; };
  }, []);

  if (!update) return null;
  return (
    <Pressable style={s.wrap} onPress={() => Linking.openURL(update.url).catch(() => undefined)}>
      <View style={{ flex: 1 }}>
        <Text style={s.title}>{t('upd.title', { v: update.version })}</Text>
        <Text style={s.note}>{t('upd.note')}</Text>
      </View>
      <View style={s.btn}><Text style={s.btnText}>{t('upd.get')}</Text></View>
    </Pressable>
  );
}

const s = StyleSheet.create({
  wrap: {
    flexDirection: 'row', alignItems: 'center', gap: 10, alignSelf: 'stretch',
    backgroundColor: 'rgba(230,180,34,0.12)', borderColor: '#e6b42288', borderWidth: 1,
    borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10,
  },
  title: { color: '#e6b422', fontSize: 12, fontWeight: '900' },
  note: { color: '#aeb9cf', fontSize: 10, marginTop: 1 },
  btn: { backgroundColor: '#e6b422', borderRadius: 8, paddingHorizontal: 14, paddingVertical: 8 },
  btnText: { color: '#0b0f1a', fontSize: 11, fontWeight: '900', letterSpacing: 1 },
});
