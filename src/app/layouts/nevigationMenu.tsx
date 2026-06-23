import React, { useEffect, useRef } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Animated, useColorScheme, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Spacing } from '@/constants/theme';

const { width: screenWidth } = Dimensions.get('window');

const getResponsiveFontSize = (baseSize: number) => {
  if (screenWidth < 360) {
    return baseSize - 2;
  }
  return baseSize;
};

export interface MenuItem {
  name: string;
  route: string;
  char: string;
  color: string;
}

// Single source of truth for admin panel navigation paths
export const menuItems: MenuItem[] = [
  { name: 'Admin Home', route: '/pages/admin/Home', char: 'H', color: '#4F46E5' },
  { name: 'Services Manager', route: '/pages/admin/services', char: 'S', color: '#10B981' },
  { name: 'Product Catalog', route: '/pages/admin/ProductPage', char: 'P', color: '#EC4899' },
  { name: 'Orders Manager', route: '/pages/admin/Orders', char: 'O', color: '#3B82F6' },
  { name: 'About Admin', route: '/pages/admin/About', char: 'I', color: '#F59E0B' },
];

interface NavigationMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function NavigationMenu({ isOpen, onClose }: NavigationMenuProps) {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const menuAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isOpen) {
      Animated.spring(menuAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(menuAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }).start();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const animatedDropdownStyle = {
    opacity: menuAnim,
    transform: [
      {
        scale: menuAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [0.9, 1],
        }),
      },
    ],
  };

  const handleNavigate = (route: string) => {
    onClose();
    router.push(route as any);
  };

  return (
    <TouchableOpacity
      style={styles.overlay}
      activeOpacity={1}
      onPress={onClose}
    >
      <Animated.View
        style={[
          styles.dropdownContainer,
          animatedDropdownStyle,
          {
            backgroundColor: colors.backgroundElement,
            borderColor: colors.backgroundSelected,
            top: 56 + insets.top,
          },
        ]}
      >
        <Text style={[styles.dropdownHeader, { color: colors.textSecondary, fontSize: getResponsiveFontSize(10) }]}>
          NAVIGATE
        </Text>
        
        {menuItems.map((item, index) => (
          <TouchableOpacity
            key={item.route}
            style={[
              styles.dropdownItem,
              index < menuItems.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.backgroundSelected },
            ]}
            onPress={() => handleNavigate(item.route)}
          >
            <View style={[styles.menuItemIcon, { backgroundColor: item.color }]}>
              <Text style={styles.menuItemIconText}>{item.char}</Text>
            </View>
            <Text style={[styles.dropdownItemText, { color: colors.text, fontSize: getResponsiveFontSize(14) }]}>
              {item.name}
            </Text>
          </TouchableOpacity>
        ))}
      </Animated.View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 999,
  },
  dropdownContainer: {
    position: 'absolute',
    right: Spacing.four,
    width: 210,
    borderRadius: 12,
    borderWidth: 1,
    padding: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
    zIndex: 1000,
  },
  dropdownHeader: {
    fontWeight: '700',
    paddingHorizontal: 8,
    paddingVertical: 4,
    letterSpacing: 0.5,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
    gap: 10,
  },
  dropdownItemText: {
    fontWeight: '600',
  },
  menuItemIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuItemIconText: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 13,
  },
});
