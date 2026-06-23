// Dynamic Expo config. Replaces the former static app.json so that the
// Google Maps Android API key can be injected from the environment per build
// profile (set GOOGLE_MAPS_ANDROID_API_KEY in eas.json env or as an EAS secret).
//
// The Maps key is NOT a true secret — it ships inside the APK — so it must be
// restricted by Android package name (app.voteriq) + signing SHA-1 in the
// Google Cloud Console. Env injection just keeps it out of git and lets staging
// and production use different keys.

module.exports = () => ({
  expo: {
    name: 'VoterIQ',
    slug: 'voteriq',
    owner: 'imaan12345s-team',
    version: '1.0.0',
    orientation: 'portrait',
    scheme: 'voteriq',
    icon: './assets/icon.png',
    userInterfaceStyle: 'light',
    newArchEnabled: true,
    splash: {
      image: './assets/splash-icon.png',
      resizeMode: 'contain',
      backgroundColor: '#1e3a5f',
    },
    ios: {
      supportsTablet: true,
      bundleIdentifier: 'app.voteriq',
      buildNumber: '1',
      config: {
        usesNonExemptEncryption: false,
      },
      infoPlist: {
        ITSAppUsesNonExemptEncryption: false,
      },
    },
    android: {
      adaptiveIcon: {
        foregroundImage: './assets/adaptive-icon.png',
        backgroundColor: '#1e3a5f',
      },
      package: 'app.voteriq',
      versionCode: 1,
      edgeToEdgeEnabled: true,
      permissions: ['INTERNET'],
      blockedPermissions: [
        'android.permission.ACCESS_FINE_LOCATION',
        'android.permission.ACCESS_COARSE_LOCATION',
      ],
      config: {
        googleMaps: {
          // Falls back to empty string in dev (map renders blank, app still works).
          apiKey: process.env.GOOGLE_MAPS_ANDROID_API_KEY || '',
        },
      },
    },
    web: {
      bundler: 'metro',
      favicon: './assets/favicon.png',
    },
    plugins: [
      'expo-router',
      'expo-secure-store',
      [
        'expo-notifications',
        {
          icon: './assets/adaptive-icon.png',
          color: '#1e3a5f',
        },
      ],
    ],
    experiments: {
      typedRoutes: true,
    },
    runtimeVersion: {
      policy: 'appVersion',
    },
    extra: {
      // Linked to @imaan12345s-team/voteriq via `eas init`. Env var overrides for CI/per-env.
      eas: {
        projectId: process.env.EAS_PROJECT_ID || 'd0bacb3a-7935-4939-a575-3d50acf74a93',
      },
    },
  },
});
