// Capacitor configuration for iOS/Android native packaging
// Documentation: https://capacitorjs.com/docs/config

/** @type {import('@capacitor/core').CapacitorConfig} */
const config = {
  appId: 'church.bffplus.app',
  appName: 'BFF+',
  webDir: 'out',           // Next.js static export output
  server: {
    // For development: point to local Next.js server
    // Remove or comment out for production builds
    // url: 'http://192.168.1.100:3000',
    // cleartext: true,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: '#4f46e5',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
      iosSpinnerStyle: 'small',
      spinnerColor: '#ffffff',
    },
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
    LocalNotifications: {
      smallIcon: 'ic_stat_icon_config_sample',
      iconColor: '#4f46e5',
      sound: 'beep.wav',
    },
    Camera: {
      permissions: {
        camera: 'Camera access is needed for profile photos and QR code scanning.',
        photos: 'Photo library access is needed for profile photos.',
      },
    },
    Filesystem: {
      // iOS Documents directory
    },
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#4f46e5',
    },
    Keyboard: {
      resize: 'ionic',
      style: 'dark',
      resizeOnFullScreen: true,
    },
  },
  ios: {
    contentInset: 'automatic',
    scheme: 'bffplus',
    backgroundColor: '#f8fafc',
  },
  android: {
    backgroundColor: '#f8fafc',
    allowMixedContent: false,
    captureInput: true,
    webContentsDebuggingEnabled: false,
  },
};

module.exports = config;
