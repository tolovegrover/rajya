import React from 'react';
import { StatusBar, View, ActivityIndicator, Text, Platform } from 'react-native';
import { useFonts } from 'expo-font';
import * as Font from 'expo-font';
import { Cinzel_700Bold, Cinzel_900Black } from '@expo-google-fonts/cinzel';
import { CinzelDecorative_700Bold, CinzelDecorative_900Black } from '@expo-google-fonts/cinzel-decorative';
import { YatraOne_400Regular } from '@expo-google-fonts/yatra-one';
import { useGame, useSettings } from './src/store';
import { TitleScreen } from './src/screens/TitleScreen';
import { DisclaimerScreen } from './src/screens/DisclaimerScreen';
import { CampaignSetup } from './src/screens/CampaignSetup';
import { GameScreen } from './src/screens/GameScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';
import { CodexScreen } from './src/screens/CodexScreen';
import { ChronicleScreen } from './src/screens/ChronicleScreen';
import { EndingScreen } from './src/screens/EndingScreen';
import { F, GOLD } from './src/theme';

const WEB_FONTS = {
  Cinzel_700Bold: '/fonts/Cinzel_700Bold.ttf',
  Cinzel_900Black: '/fonts/Cinzel_900Black.ttf',
  CinzelDecorative_700Bold: '/fonts/CinzelDecorative_700Bold.ttf',
  CinzelDecorative_900Black: '/fonts/CinzelDecorative_900Black.ttf',
  YatraOne_400Regular: '/fonts/YatraOne_400Regular.ttf',
};

function Screens() {
  const screen = useGame((g) => g.screen);
  switch (screen) {
    case 'disclaimer': return <DisclaimerScreen />;
    case 'setup': return <CampaignSetup />;
    case 'game': return <GameScreen />;
    case 'settings': return <SettingsScreen />;
    case 'codex': return <CodexScreen />;
    case 'chronicle': return <ChronicleScreen />;
    case 'ending': return <EndingScreen />;
    default: return <TitleScreen />;
  }
}

export default function App() {
  const load = useSettings((s) => s.load);
  const [nativeFonts, nativeError] = useFonts({
    Cinzel_700Bold,
    Cinzel_900Black,
    CinzelDecorative_700Bold,
    CinzelDecorative_900Black,
    YatraOne_400Regular,
  });
  const [webFonts, setWebFonts] = React.useState(Platform.OS !== 'web');
  const [waited, setWaited] = React.useState(false);
  React.useEffect(() => {
    void load();
  }, [load]);
  React.useEffect(() => {
    const t = setTimeout(() => setWaited(true), 1200);
    return () => clearTimeout(t);
  }, []);
  React.useEffect(() => {
    if (Platform.OS === 'web') {
      Font.loadAsync(WEB_FONTS)
        .catch(() => undefined)
        .finally(() => setWebFonts(true));
    }
  }, []);
  const ready = (Platform.OS === 'web' ? webFonts : nativeFonts || !!nativeError) || waited;
  if (!ready) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0b0f1a', alignItems: 'center', justifyContent: 'center', gap: 14 }}>
        <Text style={{ fontFamily: F.decoBlack, fontSize: 44, color: GOLD, letterSpacing: 6, textShadowColor: 'rgba(230,180,34,0.5)', textShadowRadius: 12 }}>RAJYA</Text>
        <ActivityIndicator color={GOLD} size="large" />
      </View>
    );
  }
  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor="#0b0f1a" />
      <Screens />
    </>
  );
}
