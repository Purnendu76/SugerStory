import React, { useState } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, useColorScheme } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Spacing } from '@/constants/theme';
import Header from '../../layouts/Header';
import NavigationMenu from '../../layouts/nevigationMenu';

export default function AdminHomeScreen() {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const insets = useSafeAreaInsets();

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const stats = [
    { label: 'Active Users', value: '1,284', color: '#4F46E5' },
    { label: 'System Health', value: '99.9%', color: '#10B981' },
    { label: 'Pending Audits', value: '5', color: '#F59E0B' },
  ];

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={['left', 'right']}>
      <View style={styles.flexWrapper}>
        <Header pageName="Workspace" onMenuPress={toggleMenu} />

        <ScrollView contentContainerStyle={[styles.container, { paddingBottom: insets.bottom + Spacing.four }] as any}>
          <View style={[styles.banner, { backgroundColor: '#4F46E5' }] as any}>
            <Text style={styles.bannerSubtitle}>ADMIN PORTAL</Text>
            <Text style={styles.bannerTitle}>Workspace Manager</Text>
          </View>

          <View style={styles.statsContainer}>
            {stats.map((stat, idx) => (
              <View key={idx} style={[styles.statCard, { backgroundColor: colors.backgroundElement }] as any}>
                <Text style={[styles.statValue, { color: stat.color }] as any}>{stat.value}</Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }] as any}>{stat.label}</Text>
              </View>
            ))}
          </View>

          <View style={styles.menuSection}>
            <Text style={[styles.sectionTitle, { color: colors.text }] as any}>Actions</Text>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: '#06B6D4' }] as any}
              onPress={() => router.push('/pages/admin/Dashboard')}
            >
              <Text style={styles.actionButtonText}>Open Live Dashboard</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: '#10B981' }] as any}
              onPress={() => router.push('/pages/admin/services')}
            >
              <Text style={styles.actionButtonText}>Manage Active Services</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: '#F59E0B' }] as any}
              onPress={() => router.push('/pages/admin/About')}
            >
              <Text style={styles.actionButtonText}>System Information</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.backButton, { backgroundColor: colors.backgroundElement }] as any}
            onPress={() => router.replace('/')}
          >
            <Text style={[styles.backButtonText, { color: colors.text }] as any}>← Return to Main Portal</Text>
          </TouchableOpacity>
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
  banner: {
    padding: Spacing.four,
    borderRadius: Spacing.three,
    gap: Spacing.half,
  },
  bannerTitle: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: '800',
  },
  bannerSubtitle: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  statCard: {
    flex: 1,
    padding: Spacing.three,
    borderRadius: Spacing.three,
    alignItems: 'center',
    gap: Spacing.half,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '800',
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
  },
  menuSection: {
    gap: Spacing.two,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: Spacing.one,
  },
  actionButton: {
    padding: Spacing.three,
    borderRadius: Spacing.three,
    alignItems: 'center',
  },
  actionButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  backButton: {
    padding: Spacing.three,
    borderRadius: Spacing.three,
    alignItems: 'center',
    marginTop: Spacing.two,
  },
  backButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
});
