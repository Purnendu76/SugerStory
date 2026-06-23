import React, { useEffect, useState, useCallback } from 'react';
import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import {
  View,
  Image,
  StyleSheet,
  Dimensions,
  StatusBar,
} from 'react-native';
import * as SplashScreen from 'expo-splash-screen';

// Prevent the native splash screen from auto-hiding
SplashScreen.preventAutoHideAsync().catch(() => {});

const SPLASH_DURATION = 3000; // 3 seconds

export default function RootLayout() {
  const [showSplash, setShowSplash] = useState(true);
  const [nativeSplashHidden, setNativeSplashHidden] = useState(false);

  // Hide the native splash once our layout is mounted
  const onLayoutReady = useCallback(async () => {
    if (!nativeSplashHidden) {
      setNativeSplashHidden(true);
      try {
        await SplashScreen.hideAsync();
      } catch (e) {
        // Ignore - splash may already be hidden
      }
    }
  }, [nativeSplashHidden]);

  // Remove custom splash after 3 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, SPLASH_DURATION);

    return () => clearTimeout(timer);
  }, []);

  return (
    <SafeAreaProvider>
      <StatusBar barStyle="light-content" backgroundColor="#3D2314" />
      <View style={styles.container} onLayout={onLayoutReady}>
        <Stack
          screenOptions={{
            headerShown: false,
          }}
        />
        {showSplash && (
          <View style={styles.splashOverlay}>
            <Image
              source={require('../../assets/images/splash.png')}
              style={styles.splashImage}
              resizeMode="cover"
            />
          </View>
        )}
      </View>
    </SafeAreaProvider>
  );
}

const { width, height } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  splashOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#3D2314',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
  splashImage: {
    width: width,
    height: height,
  },
});
