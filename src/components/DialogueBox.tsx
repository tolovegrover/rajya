import React, { useEffect } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { CharacterPortrait } from './CharacterPortrait';
import { DialogueLine, GameState } from '../types';

export function DialogueBox({ lines, state, onDismiss }: { lines: DialogueLine[]; state: GameState; onDismiss: () => void }) {
  const first = lines[0];

  useEffect(() => {
    const t = setTimeout(onDismiss, 7000);
    return () => clearTimeout(t);
  }, [first, onDismiss]);

  if (!first) return null;
  const c = state.characters[first.char];
  if (!c) return null;

  return (
    <Pressable style={styles.wrap} onPress={onDismiss}>
      <View style={styles.bubble}>
        <Text style={styles.name}>{c.name} · {c.title}</Text>
        <Text style={styles.line}>"{first.line}"</Text>
      </View>
      <CharacterPortrait spec={c.avatar} size={64} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    top: 54,
    left: 10,
    right: 10,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    zIndex: 30,
  },
  bubble: {
    flex: 1,
    backgroundColor: 'rgba(16,22,37,0.95)',
    borderColor: '#3a4a6b',
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
  },
  name: { color: '#e6b422', fontSize: 10, fontWeight: '800', marginBottom: 3, letterSpacing: 0.5 },
  line: { color: '#eef1f8', fontSize: 13, fontStyle: 'italic', lineHeight: 17 },
});
