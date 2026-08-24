import { Screen } from './types';

/**
 * Where the Android back button goes from each screen. 'quit' means we are at the
 * root and should ask before leaving. `live` = a campaign is in progress.
 */
export function backTarget(screen: Screen, live: boolean): Screen | 'quit' {
  switch (screen) {
    case 'game':
      return 'title';
    case 'settings':
    case 'codex':
    case 'chronicle':
      return live ? 'game' : 'title';
    case 'disclaimer':
    case 'setup':
    case 'ending':
      return 'title';
    default:
      return 'quit';
  }
}
