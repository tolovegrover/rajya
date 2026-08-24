import React from 'react';
import { Text, Pressable, StyleSheet, TextStyle, ViewStyle, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { F, GOLD } from '../theme';

export function FancyButton({
  label,
  onPress,
  disabled,
  busy,
  variant = 'primary',
  style,
  small,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  busy?: boolean;
  variant?: 'primary' | 'gold' | 'ghost';
  style?: ViewStyle;
  small?: boolean;
}) {
  const h = small ? 44 : 58;
  const colors =
    variant === 'gold'
      ? (['#f7d774', '#d99a1b', '#b5760a'] as const)
      : variant === 'ghost'
        ? (['#232e45', '#16203a'] as const)
        : (['#ff7a45', '#e0321f', '#a01414'] as const);
  const fontColor = variant === 'ghost' ? '#9fb0cc' : '#1a0f02';
  const isDisabled = disabled || busy;
  return (
    <Pressable onPress={onPress} disabled={isDisabled} style={[st.press, small && { height: h }, { height: h }, style]}>
      <LinearGradient
        colors={isDisabled ? ['#2a3040', '#1c2230'] : colors}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={[st.grad, { height: h }]}
      >
        <Text
          style={{
            fontFamily: F.titleBlack,
            fontSize: small ? 13 : 16,
            letterSpacing: 2,
            color: isDisabled ? '#55637d' : fontColor,
            textShadowColor: isDisabled ? 'transparent' : 'rgba(0,0,0,0.35)',
            textShadowOffset: { width: 0, height: 1 },
            textShadowRadius: 2,
          }}
        >
          {label}
        </Text>
        {busy && <ActivityIndicator size="small" color={fontColor} style={{ marginLeft: 8 }} />}
      </LinearGradient>
    </Pressable>
  );
}

export function GoldHeader({ text, size = 20, style }: { text: string; size?: number; style?: TextStyle }) {
  return (
    <Text
      style={{
        fontFamily: F.titleBlack,
        fontSize: size,
        color: GOLD,
        letterSpacing: 2,
        textShadowColor: 'rgba(230,180,34,0.55)',
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 8,
        ...style,
      }}
    >
      {text}
    </Text>
  );
}

const st = StyleSheet.create({
  press: {
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
    elevation: 6,
    shadowColor: '#000',
    shadowOpacity: 0.5,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    justifyContent: 'center',
  },
  grad: {
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    paddingHorizontal: 22,
  },
});
