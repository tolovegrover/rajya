import React from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { useGame } from '../store';

export function DisclaimerScreen() {
  const setScreen = useGame((g) => g.setScreen);
  return (
    <View style={s.wrap}>
      <ScrollView contentContainerStyle={{ gap: 14, paddingVertical: 30 }}>
        <Text style={s.h}>BEFORE THE FIRST BALLOT</Text>
        <Text style={s.p}>
          RAJYA is interactive political fiction — satire about power, democracy and the men
          who miss thrones. The republic of Bharatam, its 28 regions and every leader in this
          cast (Moni, Amir Sahab, Raul Baba, the Maharaja and the rest) are invented parodies.
          Any resemblance to real persons or parties is a coincidence of genre, not of intent.
        </Text>
        <Text style={s.p}>
          The game depicts communal tension, quota politics and land conflict because those are
          the fault lines democracies actually argue about. It takes nobody's side: every
          faction — Swarna Aandolan, Bahujan Morcha, the Kisan Sabha, the royalists, the
          republic — believes it is right, and the simulation lets them all fight fairly.
          Violence is rendered as politics with consequences, never as spectacle to glorify.
        </Text>
        <Text style={s.p}>
          With an API key connected, a large language model narrates and twists events live,
          under the engine's rules: every AI move is clamped, validated, and rendered on the
          map. Without a key, the offline engine runs the same game procedurally.
        </Text>
        <Pressable style={s.btn} onPress={() => setScreen('setup')}>
          <Text style={s.btnText}>I UNDERSTAND · BEGIN ▸</Text>
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
