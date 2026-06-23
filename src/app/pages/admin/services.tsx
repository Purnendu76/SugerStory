import React, { useState } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, useColorScheme } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Spacing } from '@/constants/theme';
import Header from '../../layouts/Header';
import NavigationMenu from '../../layouts/nevigationMenu';

interface Service {
  id: number;
  name: string;
  category: string;
  status: 'Online' | 'Paused' | 'Offline';
  color: string;
}

export default function AdminServicesScreen() {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const insets = useSafeAreaInsets();

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const [services, setServices] = useState<Service[]>([
    { id: 1, name: 'REST Gateway API', category: 'Backend Server', status: 'Online', color: '#10B981' },
    { id: 2, name: 'Notification Delivery', category: 'Queue Workers', status: 'Online', color: '#10B981' },
    { id: 3, name: 'Image Compression micro', category: 'Optimization Job', status: 'Paused', color: '#F59E0B' },
    { id: 4, name: 'Analytics Parser worker', category: 'Cron Scheduler', status: 'Offline', color: '#EF4444' },
  ]);

  const toggleStatus = (id: number) => {
    setServices((prev) =>
      prev.map((service) => {
        if (service.id === id) {
          let nextStatus: 'Online' | 'Paused' | 'Offline' = 'Online';
          let nextColor = '#10B981';

          if (service.status === 'Online') {
            nextStatus = 'Paused';
            nextColor = '#F59E0B';
          } else if (service.status === 'Paused') {
            nextStatus = 'Offline';
            nextColor = '#EF4444';
          } else {
            nextStatus = 'Online';
            nextColor = '#10B981';
          }

          return { ...service, status: nextStatus, color: nextColor };
        }
        return service;
      })
    );
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={['left', 'right']}>
      <View style={styles.flexWrapper}>
        <Header pageName="Services" onMenuPress={toggleMenu} />

        <ScrollView contentContainerStyle={[styles.container, { paddingBottom: insets.bottom + Spacing.four }] as any}>
          <View style={styles.servicesList}>
            {services.map((service) => (
              <TouchableOpacity
                key={service.id}
                activeOpacity={0.75}
                onPress={() => toggleStatus(service.id)}
                style={[styles.serviceCard, { backgroundColor: colors.backgroundElement }] as any}
              >
                <View style={styles.infoCol}>
                  <Text style={[styles.serviceName, { color: colors.text }] as any}>{service.name}</Text>
                  <Text style={[styles.serviceCategory, { color: colors.textSecondary }] as any}>{service.category}</Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: service.color + '20' }] as any}>
                  <Text style={[styles.statusText, { color: service.color }] as any}>{service.status}</Text>
                </View>
              </TouchableOpacity>
            ))}
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
  servicesList: {
    gap: Spacing.two,
  },
  serviceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.three,
    borderRadius: Spacing.three,
  },
  infoCol: {
    flex: 1,
    gap: Spacing.half,
  },
  serviceName: {
    fontSize: 16,
    fontWeight: '700',
  },
  serviceCategory: {
    fontSize: 12,
  },
  statusBadge: {
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.half,
    borderRadius: Spacing.two,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
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
