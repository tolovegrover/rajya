import React from 'react';
import { StatusBar } from 'react-native';
import { useGame, useSettings } from './src/store';
import { TitleScreen } from './src/screens/TitleScreen';
import { DisclaimerScreen } from './src/screens/DisclaimerScreen';
import { CampaignSetup } from './src/screens/CampaignSetup';
import { GameScreen } from './src/screens/GameScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';
import { CodexScreen } from './src/screens/CodexScreen';
import { EndingScreen } from './src/screens/EndingScreen';

function Screens() {
  const screen = useGame((g) => g.screen);
  switch (screen) {
    case 'disclaimer': return <DisclaimerScreen />;
    case 'setup': return <CampaignSetup />;
    case 'game': return <GameScreen />;
    case 'settings': return <SettingsScreen />;
    case 'codex': return <CodexScreen />;
    case 'ending': return <EndingScreen />;
    default: return <TitleScreen />;
  }
}

export default function App() {
  const load = useSettings((s) => s.load);
  React.useEffect(() => {
    void load();
  }, [load]);
  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor="#0b0f1a" />
      <Screens />
    </>
  );
}
