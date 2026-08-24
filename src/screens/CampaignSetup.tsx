import React, { useState } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useGame, useSettings, useLang } from '../store';
import { t } from '../i18n';
import { PLAYER_ROLES } from '../data/factions';
import { PlayerRoleId } from '../types';
import { FancyButton, GoldHeader } from '../components/FancyButton';
import { F, GOLD, ORANGE } from '../theme';

const ETA_PRESETS = [0.1, 0.3, 0.5, 0.7, 0.9];

const etaLabel = (e: number) =>
  e <= 0.15 ? t('eta.ideal') : e <= 0.35 ? t('eta.mild') : e <= 0.6 ? t('eta.lively') : e <= 0.8 ? t('eta.volatile') : t('eta.chaos');

export function CampaignSetup() {
  const { newGame, setScreen } = useGame();
  const settings = useSettings((s) => s.settings);
  useLang();
  const [role, setRole] = useState<PlayerRoleId>('strategist');
  const [eta, setEta] = useState(0.5);

  const aiLabel = settings.provider === 'offline' ? t('setup.offline') : settings.provider === 'anthropic' ? `Claude · ${settings.anthropicModel}` : settings.provider === 'gemini' ? `Gemini · ${settings.geminiModel}` : `Compatible API · ${settings.compatModel}`;

  return (
    <View style={s.wrap}>
      <ScrollView contentContainerStyle={{ padding: 18, gap: 14, paddingBottom: 40 }}>
        <GoldHeader text={t('setup.h')} size={26} style={{ textAlign: 'center', marginTop: 22 }} />

        <Text style={s.label}>{t('setup.step1')}</Text>
        {PLAYER_ROLES.map((r) => (
          <Pressable key={r.id} onPress={() => setRole(r.id)}>
            <LinearGradient
              colors={role === r.id ? (['#3a2c05', '#241c07'] as const) : (['#131a2a', '#0e1420'] as const)}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[s.roleCard, role === r.id && s.roleSel]}
            >
              <Text style={[s.roleName, { textShadowColor: 'rgba(0,0,0,0.7)', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 3 }]}>
                {role === r.id ? '👑 ' : ''}{t(`role.${r.id}.name`, {}, r.name)}
              </Text>
              <Text style={s.roleTag}>{t(`role.${r.id}.tag`, {}, r.tagline)}</Text>
              <Text style={s.roleWin}>🏆 {t('setup.win')} · {t(`role.${r.id}.win`, {}, r.winText)}</Text>
            </LinearGradient>
          </Pressable>
        ))}

        <Text style={s.label}>{t('setup.step2')}</Text>
        <View style={s.etaRow}>
          {ETA_PRESETS.map((v) => (
            <Pressable
              key={v}
              style={[s.etaChip, Math.abs(eta - v) < 0.01 && s.etaSel]}
              onPress={() => setEta(v)}
            >
              <Text style={[s.etaText, Math.abs(eta - v) < 0.01 && { color: '#0b0f1a' }]}>{v}</Text>
            </Pressable>
          ))}
        </View>
        <Text style={[s.etaDesc, { fontFamily: F.title, fontSize: 13 }]}>η {eta.toFixed(2)} — {etaLabel(eta)}</Text>

        <Text style={s.label}>{t('setup.step3')}</Text>
        <View style={s.aiCard}>
          <Text style={s.aiText}>{aiLabel}</Text>
          <Pressable style={s.aiBtn} onPress={() => setScreen('settings')}>
            <Text style={s.aiBtnText}>{t('setup.configure')}</Text>
          </Pressable>
        </View>

        <FancyButton label={`${t('setup.start')}  ▸`} onPress={() => newGame(role, eta)} />
        <Pressable style={s.back} onPress={() => setScreen('title')}>
          <Text style={s.backText}>◂ {t('common.back')}</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: '#0b0f1a' },
  label: { color: ORANGE, fontSize: 11, fontWeight: '900', letterSpacing: 3, marginTop: 6, fontFamily: F.title },
  roleCard: { borderColor: '#26324a', borderWidth: 1, borderRadius: 14, padding: 14, gap: 4 },
  roleSel: { borderColor: GOLD, borderWidth: 2, elevation: 8, shadowColor: GOLD, shadowOpacity: 0.35, shadowRadius: 10, shadowOffset: { width: 0, height: 0 } },
  roleName: { color: '#f4efe6', fontSize: 19, fontWeight: '900', fontFamily: F.titleBlack, letterSpacing: 1 },
  roleTag: { color: '#aeb9cf', fontSize: 12, lineHeight: 17 },
  roleWin: { color: '#5aa2e8', fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
  etaRow: { flexDirection: 'row', gap: 6 },
  etaChip: { flex: 1, alignItems: 'center', paddingVertical: 12, borderRadius: 10, backgroundColor: '#101625', borderColor: '#26324a', borderWidth: 1 },
  etaSel: { backgroundColor: GOLD, borderColor: GOLD, elevation: 5 },
  etaText: { color: '#aeb9cf', fontWeight: '900', fontFamily: F.titleBlack, fontSize: 16 },
  etaDesc: { color: '#8d9ab5', fontStyle: 'italic' },
  aiCard: { backgroundColor: '#101625', borderColor: '#26324a', borderWidth: 1, borderRadius: 14, padding: 14, gap: 10, alignItems: 'center' },
  aiText: { color: '#eef1f8', fontSize: 13, fontWeight: '800', fontFamily: F.title },
  aiBtn: { borderColor: '#3a4a6b', borderWidth: 1, paddingHorizontal: 16, paddingVertical: 9, borderRadius: 10 },
  aiBtnText: { color: '#aeb9cf', fontSize: 11, fontWeight: '800', letterSpacing: 1 },
  back: { alignItems: 'center', padding: 8 },
  backText: { color: '#5f6f88', fontSize: 12 },
});
