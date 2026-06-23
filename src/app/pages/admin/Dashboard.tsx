import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, useColorScheme, Dimensions, Image, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Spacing } from '@/constants/theme';
import Header from '../../layouts/Header';
import BottomNavigation from '../../layouts/BottomNavigation';

const { width: screenWidth } = Dimensions.get('window');

// Responsive utility
const getResponsiveFontSize = (baseSize: number) => {
  if (screenWidth < 360) {
    return baseSize - 2;
  }
  return baseSize;
};

interface AvatarProps {
  name: string;
  bgColor: string;
}

function UserAvatar({ name, bgColor }: AvatarProps) {
  return (
    <View style={[styles.avatarCircle, { backgroundColor: bgColor }]}>
      <Text style={styles.avatarText}>{name.charAt(0).toUpperCase()}</Text>
    </View>
  );
}

export default function AdminDashboardScreen() {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Trigger entrance animation on mount
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, []);

  // Mock telemetry data
  const systemMetrics = [
    { name: 'CPU Usage', value: 42, color: '#EF4444' },
    { name: 'Memory Load', value: 68, color: '#3B82F6' },
    { name: 'Storage Space', value: 18, color: '#10B981' },
    { name: 'Network Load', value: 55, color: '#F59E0B' },
  ];

  // Detailed mock audits with avatars and status levels
  const recentLogs = [
    { id: 1, action: 'User login success', user: 'admin@system.com', time: '2m ago', type: 'success', color: '#10B981' },
    { id: 2, action: 'Database cluster scaled', user: 'system_worker', time: '12m ago', type: 'info', color: '#3B82F6' },
    { id: 3, action: 'High CPU load warning', user: 'monitor_service', time: '24m ago', type: 'warning', color: '#F59E0B' },
    { id: 4, action: 'API key revoked', user: 'security_manager', time: '1h ago', type: 'danger', color: '#EF4444' },
  ];

  // 2x2 grid stats
  const gridStats = [
    { title: 'Total Revenue', value: '$12,840', change: '+12.4%', up: true, tint: '#10B981' },
    { title: 'Active Sessions', value: '482', change: '+3.1%', up: true, tint: '#3B82F6' },
    { title: 'Pending Tasks', value: '14', change: '-8.2%', up: false, tint: '#F59E0B' },
    { title: 'API Errors', value: '2', change: '0.0%', up: true, tint: '#EF4444' },
  ];

  return (
    <View style={[styles.safeArea, { backgroundColor: colors.background }] as any}>
      <View style={styles.flexWrapper}>
        {/* Reusable Header */}
        <Header pageName="Dashboard" showMenu={false} />

        <Animated.ScrollView
          style={[styles.scrollView, {
            opacity: fadeAnim,
            transform: [
              {
                translateY: fadeAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [20, 0],
                }),
              },
            ],
          }]}
          contentContainerStyle={[
            styles.container,
            { paddingBottom: insets.bottom + 80 },
          ] as any}
          showsVerticalScrollIndicator={false}
        >
          {/* Uptime and Status indicator */}
          <View style={[styles.statusStrip, { backgroundColor: colors.backgroundElement }] as any}>
            <View style={styles.statusDotRow}>
              <View style={[styles.pulseDot, { backgroundColor: '#10B981' }]} />
              <Text style={[styles.statusStripText, { color: colors.text, fontSize: getResponsiveFontSize(12) }] as any}>
                All Services Operational
              </Text>
            </View>
            <Text style={[styles.statusStripUptime, { color: colors.textSecondary, fontSize: getResponsiveFontSize(11) }] as any}>
              Uptime: 99.98%
            </Text>
          </View>

          {/* Hero Banner Section */}
          <View style={[styles.heroCard, { backgroundColor: '#4F46E5' }] as any}>
            <View style={styles.heroLeft}>
              <Text style={styles.heroSubtitle}>SYSTEM OVERVIEW</Text>
              <Text style={styles.heroTitle}>Workspace Active</Text>
              <Text style={styles.heroDescription}>
                Managing 4 backend servers and monitoring live analytical events.
              </Text>
            </View>
            <Image
              source={require('@/assets/images/sugarstory-logo.png')}
              style={styles.heroLogo}
              resizeMode="contain"
            />
          </View>

          {/* 2x2 Grid Statistics Section */}
          <View style={styles.gridContainer}>
            {gridStats.map((stat, index) => (
              <View key={index} style={[styles.gridCard, { backgroundColor: colors.backgroundElement }] as any}>
                <Text style={[styles.gridCardTitle, { color: colors.textSecondary, fontSize: getResponsiveFontSize(12) }] as any}>
                  {stat.title}
                </Text>
                <Text style={[styles.gridCardValue, { color: colors.text, fontSize: getResponsiveFontSize(20) }] as any}>
                  {stat.value}
                </Text>
                <View style={styles.gridCardFooter}>
                  <View style={[styles.smallIndicatorDot, { backgroundColor: stat.tint }]} />
                  <Text style={[styles.gridCardChange, { color: stat.up ? '#10B981' : '#EF4444', fontSize: getResponsiveFontSize(11) }] as any}>
                    {stat.change}
                  </Text>
                </View>
              </View>
            ))}
          </View>

          {/* Live Telemetry Card */}
          <View style={[styles.sectionCard, { backgroundColor: colors.backgroundElement }] as any}>
            <Text style={[styles.sectionHeading, { color: colors.text, fontSize: getResponsiveFontSize(16) }] as any}>
              System Health & Telemetry
            </Text>
            <View style={styles.metricsWrapper}>
              {systemMetrics.map((metric, idx) => (
                <View key={idx} style={styles.metricRow}>
                  <View style={styles.metricTextWrapper as any}>
                    <Text style={[styles.metricName, { color: colors.text, fontSize: getResponsiveFontSize(14) }] as any}>
                      {metric.name}
                    </Text>
                    <Text style={[styles.metricVal, { color: colors.textSecondary, fontSize: getResponsiveFontSize(13) }] as any}>
                      {metric.value}%
                    </Text>
                  </View>
                  <View style={[styles.progressBarBg, { backgroundColor: colors.backgroundSelected }] as any}>
                    <View
                      style={[
                        styles.progressBarFill,
                        {
                          width: `${metric.value}%`,
                          backgroundColor: metric.color,
                        },
                      ]}
                    />
                  </View>
                </View>
              ))}
            </View>
          </View>

          {/* Audit Log Card with Avatars */}
          <View style={[styles.sectionCard, { backgroundColor: colors.backgroundElement }] as any}>
            <Text style={[styles.sectionHeading, { color: colors.text, fontSize: getResponsiveFontSize(16) }] as any}>
              Recent Audits & Logs
            </Text>
            <View style={styles.logsWrapper}>
              {recentLogs.map((log) => (
                <View key={log.id} style={[styles.logRow, { borderBottomColor: colors.backgroundSelected }] as any}>
                  <UserAvatar name={log.user} bgColor={log.color} />
                  <View style={styles.logMiddle}>
                    <Text style={[styles.logAction, { color: colors.text, fontSize: getResponsiveFontSize(13) }] as any}>
                      {log.action}
                    </Text>
                    <Text style={[styles.logUser, { color: colors.textSecondary, fontSize: getResponsiveFontSize(12) }] as any}>
                      {log.user}
                    </Text>
                  </View>
                  <View style={styles.logRight}>
                    <Text style={[styles.logTime, { color: colors.textSecondary, fontSize: getResponsiveFontSize(11) }] as any}>
                      {log.time}
                    </Text>
                    <View style={[styles.typeBadge, { backgroundColor: log.color + '20' }]}>
                      <Text style={[styles.typeBadgeText, { color: log.color, fontSize: getResponsiveFontSize(10) }] as any}>
                        {log.type.toUpperCase()}
                      </Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          </View>

          {/* Navigation Action Area */}
          <View style={styles.buttonRow}>
            <TouchableOpacity
              activeOpacity={0.7}
              style={[styles.navBtn, { backgroundColor: '#4F46E5' }] as any}
              onPress={() => router.push('/pages/admin/Home')}
            >
              <Text style={[styles.navBtnText, { fontSize: getResponsiveFontSize(14) }]}>Admin Panel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              activeOpacity={0.7}
              style={[styles.navBtn, { backgroundColor: colors.backgroundElement }] as any}
              onPress={() => router.push('/pages/admin/services')}
            >
              <Text style={[styles.navBtnText, { color: colors.text, fontSize: getResponsiveFontSize(14) }] as any}>
                Active Services
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.ScrollView>

        <BottomNavigation activeTab="Home" />
      </View>
    </View>
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
  scrollView: {
    flex: 1,
  },
  container: {
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 16,
  },
  statusStrip: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  statusDotRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusStripText: {
    fontWeight: '600',
  },
  statusStripUptime: {
    fontWeight: '500',
  },
  heroCard: {
    padding: 20,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
  },
  heroLeft: {
    flex: 1,
    gap: 4,
  },
  heroSubtitle: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
  },
  heroTitle: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: '800',
  },
  heroDescription: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 13,
    lineHeight: 18,
    marginTop: 2,
  },
  heroLogo: {
    width: 65,
    height: 65,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  gridCard: {
    width: (screenWidth - 44) / 2,
    padding: 14,
    borderRadius: 12,
    gap: 6,
  },
  gridCardTitle: {
    fontWeight: '600',
  },
  gridCardValue: {
    fontWeight: '800',
  },
  gridCardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  smallIndicatorDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  gridCardChange: {
    fontWeight: '700',
  },
  sectionCard: {
    padding: 16,
    borderRadius: 12,
    gap: 16,
  },
  sectionHeading: {
    fontWeight: '700',
  },
  metricsWrapper: {
    gap: 12,
  },
  metricRow: {
    gap: 6,
  },
  metricTextWrapper: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metricName: {
    fontWeight: '600',
    flex: 1,
  },
  metricVal: {
    fontWeight: '700',
  },
  progressBarBg: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    width: '100%',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  logsWrapper: {
    gap: 12,
  },
  logRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    gap: 12,
  },
  avatarCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 14,
  },
  logMiddle: {
    flex: 1,
    gap: 2,
  },
  logAction: {
    fontWeight: '600',
    lineHeight: 18,
  },
  logUser: {
    fontSize: 12,
  },
  logRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  logTime: {
    fontWeight: '500',
  },
  typeBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  typeBadgeText: {
    fontWeight: '800',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
    width: '100%',
  },
  navBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navBtnText: {
    color: '#ffffff',
    fontWeight: '700',
  },
});
