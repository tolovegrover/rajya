import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, StyleSheet, Dimensions, Pressable } from 'react-native';
import { t } from '../i18n';
import { useLang, useGame } from '../store';

export function NewsTicker({ headlines }: { headlines: string[] }) {
  const x = useRef(new Animated.Value(0)).current;
  const width = useRef(0);
  const screenW = Dimensions.get('window').width;
  useLang();
  const setScreen = useGame((g) => g.setScreen);

  useEffect(() => {
    const loop = () => {
      x.setValue(screenW);
      Animated.timing(x, {
        toValue: -(width.current || screenW * 2),
        duration: Math.max(26000, (width.current || 800) * 42),
        useNativeDriver: false,
      }).start(({ finished }) => finished && loop());
    };
    loop();
    return () => x.removeAllListeners();
  }, [x, headlines.join('|'), screenW]);

  return (
    <Pressable style={styles.bar} onPress={() => setScreen('chronicle')}>
      <View style={styles.tag}>
        <Text style={styles.tagText}>{t('ticker.tag')}</Text>
      </View>
      <Animated.View style={[styles.row, { transform: [{ translateX: x }] }]} onLayout={(e) => (width.current = e.nativeEvent.layout.width)}>
        <Text style={styles.text} numberOfLines={1}>
          {headlines.slice(0, 10).join('   •   ')}
        </Text>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  bar: {
    height: 38,
    backgroundColor: '#101625',
    borderTopWidth: 1,
    borderTopColor: '#26324a',
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
  },
  tag: { backgroundColor: '#c23', paddingHorizontal: 8, height: 38, justifyContent: 'center', marginRight: 4 },
  tagText: { color: '#fff', fontSize: 10, fontWeight: '900' },
  row: { justifyContent: 'flex-start' },
  text: { color: '#eef1f8', fontSize: 14, fontWeight: '700' },
});
