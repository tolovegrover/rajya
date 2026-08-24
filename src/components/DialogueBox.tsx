import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { CharacterPortrait } from './CharacterPortrait';
import { DialogueLine, GameState } from '../types';
import { useSettings } from '../store';
import { displayName } from '../llm/prompts';
import { t } from '../i18n';
import { F, GOLD } from '../theme';

export function DialogueBox({
  lines,
  state,
  onDismiss,
}: {
  lines: DialogueLine[];
  state: GameState;
  onDismiss: () => void;
}) {
  const settings = useSettings((s) => s.settings);
  const first = lines[0];
  if (!first) return null;
  const c = state.characters[first.char];
  if (!c) return null;
  const more = lines.length - 1;

  return (
    <Pressable style={styles.wrap} onPress={onDismiss}>
      <View style={styles.bubble}>
        <Text style={styles.name}>{displayName(settings, c)} · {t(`char.${c.id}.title`, {}, c.title)}</Text>
        <Text style={styles.line}>"{first.line}"</Text>
        <View style={styles.foot}>
          {more > 0 && <Text style={styles.more}>▸ {t('game.morelines', { n: more })}</Text>}
          <Text style={styles.tap}>✕ {t('game.tapline')}</Text>
        </View>
      </View>
      <CharacterPortrait spec={c.avatar} size={68} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    top: 56,
    left: 10,
    right: 10,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    zIndex: 30,
    elevation: 10,
    shadowColor: '#000',
    shadowOpacity: 0.5,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  bubble: {
    flex: 1,
    backgroundColor: 'rgba(16,22,37,0.97)',
    borderColor: GOLD,
    borderWidth: 1,
    borderRadius: 12,
    padding: 10,
  },
  name: { color: GOLD, fontSize: 11, fontWeight: '900', marginBottom: 3, letterSpacing: 0.5, fontFamily: F.title },
  line: { color: '#eef1f8', fontSize: 14, fontStyle: 'italic', lineHeight: 19 },
  foot: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },
  more: { color: '#d78ae8', fontSize: 10, fontWeight: '800' },
  tap: { color: '#66748f', fontSize: 9, fontWeight: '700' },
});
