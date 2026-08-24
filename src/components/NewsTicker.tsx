import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, StyleSheet, Dimensions } from 'react-native';
import { t } from '../i18n';
import { useLang } from '../store';

export function NewsTicker({ headlines }: { headlines: string[] }) {
  const x = useRef(new Animated.Value(0)).current;
  const width = useRef(0);
  const screenW = Dimensions.get('window').width;
  useLang();

  useEffect(() => {
    const loop = () => {
      x.setValue(screenW);
      Animated.timing(x, {
        toValue: -(width.current || screenW * 2),
        duration: Math.max(12000, (width.current || 800) * 22),
        useNativeDriver: false,
      }).start(({ finished }) => finished && loop());
    };
    loop();
    return () => x.removeAllListeners();
  }, [x, headlines.join('|'), screenW]);

  return (
    <View style={styles.bar}>
      <View style={styles.tag}>
        <Text style={styles.tagText}>{t('ticker.tag')}</Text>
      </View>
      <Animated.View style={[styles.row, { transform: [{ translateX: x }] }]} onLayout={(e) => (width.current = e.nativeEvent.layout.width)}>
        <Text style={styles.text} numberOfLines={1}>
          {headlines.slice(0, 10).join('   •   ')}
        </Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    height: 30,
    backgroundColor: '#101625',
    borderTopWidth: 1,
    borderTopColor: '#26324a',
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
  },
  tag: { backgroundColor: '#c23', paddingHorizontal: 6, height: 30, justifyContent: 'center', marginRight: 4 },
  tagText: { color: '#fff', fontSize: 9, fontWeight: '900' },
  row: { justifyContent: 'flex-start' },
  text: { color: '#e8e0f0', fontSize: 12, fontWeight: '600' },
});
