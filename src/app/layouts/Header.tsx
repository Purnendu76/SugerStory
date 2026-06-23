import React from 'react';
import { StyleSheet, Text, View, useColorScheme, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Spacing } from '@/constants/theme';

interface HeaderProps {
  pageName: string;
  onMenuPress?: () => void;
  showMenu?: boolean;
}

export default function Header({ pageName }: HeaderProps) {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.headerContainer,
        {
          backgroundColor: colors.background,
          borderBottomColor: colors.backgroundElement,
          paddingTop: insets.top,
          height: 56 + insets.top,
        },
      ] as any}
    >
      {/* Logo Section */}
      <View style={styles.logoSection}>
        <Image
          source={require('@/assets/images/sugarstory-logo.png')}
          style={styles.logoImage}
          resizeMode="contain"
        />
        <Text style={[styles.logoBrand, { color: colors.text }] as any}>Sugar Story</Text>
      </View>

      {/* Page Title (Far Right) */}
      <View style={styles.titleSection}>
        <Text style={[styles.pageTitle, { color: colors.textSecondary }] as any}>
          {pageName}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.three,
    borderBottomWidth: 1,
  },
  logoSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  logoImage: {
    width: 28,
    height: 28,
    borderRadius: 6,
  },
  logoBrand: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  titleSection: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  pageTitle: {
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
});

