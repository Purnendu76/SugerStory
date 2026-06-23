import React, { useState } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, useColorScheme } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Spacing } from '@/constants/theme';
import Header from '../../layouts/Header';
import NavigationMenu from '../../layouts/nevigationMenu';

export default function AdminAboutScreen() {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const insets = useSafeAreaInsets();

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const details = [
    { label: 'OS / Framework', value: 'Expo SDK 56' },
    { label: 'React Native', value: '0.85.3' },
    { label: 'Platform Mode', value: 'Hybrid Native App' },
    { label: 'Database Status', value: 'Connected (Postgres)' },
    { label: 'Active Region', value: 'US-East AWS' },
  ];

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={['left', 'right']}>
      <View style={styles.flexWrapper}>
        <Header pageName="System Info" onMenuPress={toggleMenu} />

        <ScrollView contentContainerStyle={[styles.container, { paddingBottom: insets.bottom + Spacing.four }] as any}>
          <View style={[styles.detailsCard, { backgroundColor: colors.backgroundElement }] as any}>
            {details.map((item, idx) => (
              <View key={idx} style={[styles.detailRow, idx < details.length - 1 && { borderBottomColor: colors.backgroundSelected, borderBottomWidth: 1 }] as any}>
                <Text style={[styles.detailLabel, { color: colors.textSecondary }] as any}>{item.label}</Text>
                <Text style={[styles.detailValue, { color: colors.text }] as any}>{item.value}</Text>
              </View>
            ))}
          </View>

          <View style={[styles.descriptionCard, { backgroundColor: colors.backgroundElement }] as any}>
            <Text style={[styles.cardTitle, { color: colors.text }] as any}>Developer Notes</Text>
            <Text style={[styles.cardText, { color: colors.textSecondary }] as any}>
              This admin portal is designed to provide secure status diagnostics and manage running services. Modifying parameters may impact deployment clusters. Contact the engineering support team for elevated administrative privileges.
            </Text>
          </View>

          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.navBtn, { backgroundColor: '#4F46E5' }] as any}
              onPress={() => router.push('/pages/admin/Home')}
            >
              <Text style={styles.navBtnText}>Admin Home</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.navBtn, { backgroundColor: colors.backgroundElement }] as any}
              onPress={() => router.replace('/')}
            >
              <Text style={[styles.navBtnText, { color: colors.text }] as any}>Portal Home</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

        {/* Global Navigation Menu overlay component */}
        <NavigationMenu isOpen={isMenuOpen} onClose={toggleMenu} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  flexWrapper: {
    flex: 1,
    position: 'relative',
  },
  container: {
    padding: Spacing.four,
    gap: Spacing.four,
  },
  detailsCard: {
    borderRadius: Spacing.three,
    paddingHorizontal: Spacing.three,
    overflow: 'hidden',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: Spacing.three,
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '700',
  },
  descriptionCard: {
    borderRadius: Spacing.three,
    padding: Spacing.three,
    gap: Spacing.one,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  cardText: {
    fontSize: 14,
    lineHeight: 20,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: Spacing.two,
    marginTop: Spacing.one,
  },
  navBtn: {
    flex: 1,
    padding: Spacing.three,
    borderRadius: Spacing.three,
    alignItems: 'center',
  },
  navBtnText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 14,
  },
});
