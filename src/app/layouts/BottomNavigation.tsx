import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, useColorScheme, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import FontAwesome from '@expo/vector-icons/FontAwesome';

interface BottomNavigationProps {
  activeTab: 'Home' | 'Services' | 'Products' | 'Orders' | 'About';
}

export default function BottomNavigation({ activeTab }: BottomNavigationProps) {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const appColors = {
    bg: isDark ? '#12141C' : '#FFFFFF',
    border: isDark ? '#1E293B' : '#E2E8F0',
    primary: isDark ? '#818CF8' : '#6366F1',
    textSec: isDark ? '#94A3B8' : '#64748B',
  };

  const navItems = [
    { name: 'Home', route: '/pages/admin/Home', icon: 'home' as const, label: 'Home' },
    { name: 'Services', route: '/pages/admin/services', icon: 'wrench' as const, label: 'Services' },
    { name: 'Products', route: '/pages/admin/ProductPage', icon: 'birthday-cake' as const, label: 'Products' },
    { name: 'Orders', route: '/pages/admin/Orders', icon: 'shopping-cart' as const, label: 'Orders' },
    { name: 'About', route: '/pages/admin/About', icon: 'info-circle' as const, label: 'About' },
  ];

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: appColors.bg,
          borderTopColor: appColors.border,
          paddingBottom: Math.max(insets.bottom, 12),
        },
      ]}
    >
      <View style={styles.navRow}>
        {navItems.map((item) => {
          const isActive = activeTab === item.name;
          return (
            <TouchableOpacity
              key={item.name}
              style={styles.navItem}
              onPress={() => router.replace(item.route as any)}
              activeOpacity={0.7}
            >
              <View style={styles.iconContainer}>
                <FontAwesome
                  name={item.icon}
                  size={20}
                  color={isActive ? appColors.primary : appColors.textSec}
                />
              </View>
              <Text
                style={[
                  styles.label,
                  {
                    color: isActive ? appColors.primary : appColors.textSec,
                    fontWeight: isActive ? '700' : '500',
                  },
                ]}
              >
                {item.label}
              </Text>
              {isActive && (
                <View style={[styles.dotIndicator, { backgroundColor: appColors.primary }]} />
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderTopWidth: 1,
    paddingTop: 8,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -3 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  navRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  navItem: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    paddingVertical: 4,
    position: 'relative',
  },
  iconContainer: {
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 2,
  },
  label: {
    fontSize: 10,
    letterSpacing: 0.1,
  },
  dotIndicator: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginTop: 4,
  },
});
