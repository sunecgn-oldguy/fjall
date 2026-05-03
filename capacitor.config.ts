import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.fjall.app',
  appName: 'Fjall',
  webDir: 'dist',
  android: {
    // Nødvendigt for at baggrunds-GPS-plugin'et ikke stopper efter 5 minutter.
    // Uden dette throttler Android WebView-baserede HTTP-kald i baggrunden.
    useLegacyBridge: true,
  },
};

export default config;
