import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Animated,
  ScrollView,
  TouchableOpacity,
  useColorScheme,
  ActivityIndicator,
  Dimensions,
  TextInput,
  RefreshControl,
  Modal,
  Linking,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Spacing } from '@/constants/theme';
import Header from '../../layouts/Header';
import BottomNavigation from '../../layouts/BottomNavigation';
import { useNotification } from '@/components/NotificationProvider';
import axios from 'axios';


const { width: screenWidth } = Dimensions.get('window');

const getResponsiveFontSize = (baseSize: number) => {
  if (screenWidth < 360) {
    return baseSize - 2;
  }
  return baseSize;
};

// ──────────────────────────────────────────────
// Interfaces & Types
// ──────────────────────────────────────────────

interface BillingAddress {
  first_name: string;
  last_name: string;
  company: string;
  address_1: string;
  address_2: string;
  city: string;
  state: string;
  postcode: string;
  country: string;
  email: string;
  phone: string;
}

interface ShippingAddress {
  first_name: string;
  last_name: string;
  company: string;
  address_1: string;
  address_2: string;
  city: string;
  state: string;
  postcode: string;
  country: string;
  phone: string;
}

interface MetaDataItem {
  id: number;
  key: string;
  value: string;
}

interface LineItem {
  id: number;
  name: string;
  product_id: number;
  variation_id: number;
  quantity: number;
  subtotal: string;
  total: string;
  price: number;
  image?: {
    id: string | number;
    src: string;
  };
}

interface Order {
  id: number;
  status: string;
  currency: string;
  currency_symbol: string;
  date_created: string;
  discount_total: string;
  shipping_total: string;
  total: string;
  billing: BillingAddress;
  shipping: ShippingAddress;
  payment_method_title: string;
  payment_url: string;
  customer_note: string;
  meta_data: MetaDataItem[];
  line_items: LineItem[];
}

// ──────────────────────────────────────────────
// Caching
// ──────────────────────────────────────────────

export let cachedOrders: Order[] = [];
export let fetchPromise: Promise<Order[]> | null = null;

const startPreFetch = (): Promise<Order[]> => {
  if (fetchPromise) return fetchPromise;
  fetchPromise = axios.get('https://n8n.srv917960.hstgr.cloud/webhook/get-orders')
    .then((response: any) => {
      cachedOrders = response.data || [];
      return cachedOrders;
    })
    .catch((err: any) => {
      fetchPromise = null;
      throw err;
    });
  return fetchPromise!;
};

startPreFetch().catch(() => {});

export default function OrdersScreen() {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const router = useRouter();

  // Sleek Indigo / Slate Theme (Modern SaaS look)
  const appColors = {
    bg: isDark ? '#090A0C' : '#F8FAFC',
    cardBg: isDark ? '#12141C' : '#FFFFFF',
    text: isDark ? '#F8FAFC' : '#0F172A',
    textSec: isDark ? '#94A3B8' : '#64748B',
    border: isDark ? '#1E293B' : '#E2E8F0',
    primary: isDark ? '#818CF8' : '#6366F1',
    primaryLight: isDark ? '#1E1B4B' : '#EEF2FF',
    accent: '#10B981',
    gold: '#F59E0B',
  };

  const { notifySuccess, notifyError } = useNotification();
  const insets = useSafeAreaInsets();

  const [orders, setOrders] = useState<Order[]>(cachedOrders);
  const [loading, setLoading] = useState(cachedOrders.length === 0);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageLoading, setPageLoading] = useState(false);
  const itemsPerPage = 6;

  // Animations
  const scrollViewRef = useRef<ScrollView>(null);
  const fadeAnim = useRef(new Animated.Value(cachedOrders.length > 0 ? 1 : 0)).current;

  const fetchOrders = async (isBackground = false) => {
    try {
      if (!isBackground) {
        setLoading(cachedOrders.length === 0);
      } else {
        setRefreshing(true);
      }
      setError(null);

      let data: Order[];
      if (fetchPromise) {
        data = await fetchPromise;
      } else {
        data = await startPreFetch();
      }

      setOrders(data);
      if (isBackground) {
        notifySuccess('Database synced successfully', 'Updated');
      }
    } catch (err: any) {
      console.error(err);
      notifyError('Database connection timed out');
      if (cachedOrders.length === 0) {
        setError('Connection error. Tap to reload.');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
      fetchPromise = null;

      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }).start();
    }
  };

  useEffect(() => {
    if (cachedOrders.length > 0) {
      fetchOrders(true);
    } else {
      fetchOrders(false);
    }
  }, []);

  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages) return;
    setPageLoading(true);
    setTimeout(() => {
      setCurrentPage(page);
      setPageLoading(false);
      scrollViewRef.current?.scrollTo({ y: 0, animated: true });
    }, 200);
  };

  // ──────────────────────────────────────────────
  // Formatting Helpers
  // ──────────────────────────────────────────────

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });
    } catch {
      return dateStr;
    }
  };

  const getMetadataValue = (order: Order, key: string) => {
    const item = order.meta_data.find((m) => m.key === key);
    return item ? item.value : null;
  };

  const getStatusConfig = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return { bg: '#D1FAE5', text: '#065F46', bullet: '#10B981', label: 'Completed' };
      case 'processing':
        return { bg: '#DBEAFE', text: '#1E40AF', bullet: '#3B82F6', label: 'Processing' };
      case 'pending':
        return { bg: '#FEF3C7', text: '#92400E', bullet: '#F59E0B', label: 'Pending' };
      case 'cancelled':
      case 'failed':
        return { bg: '#FEE2E2', text: '#991B1B', bullet: '#EF4444', label: 'Cancelled' };
      default:
        return { bg: '#F3F4F6', text: '#374151', bullet: '#9CA3AF', label: status };
    }
  };

  // ──────────────────────────────────────────────
  // Search & Pagination filter logic
  // ──────────────────────────────────────────────

  const filteredOrders = orders.filter((order) => {
    const billingName = `${order.billing.first_name} ${order.billing.last_name}`.toLowerCase();
    const shippingName = `${order.shipping.first_name} ${order.shipping.last_name}`.toLowerCase();
    const query = searchQuery.toLowerCase();

    const matchesSearch =
      order.id.toString().includes(query) ||
      billingName.includes(query) ||
      shippingName.includes(query) ||
      order.billing.email.toLowerCase().includes(query) ||
      order.billing.phone.includes(query);

    const matchesStatus =
      selectedStatus === 'All' ||
      order.status.toLowerCase() === selectedStatus.toLowerCase();

    return matchesSearch && matchesStatus;
  });

  const statuses = ['All', 'Processing', 'Completed', 'Pending', 'Cancelled'];

  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
  const displayedOrders = filteredOrders.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      let start = Math.max(1, currentPage - 2);
      let end = Math.min(totalPages, currentPage + 2);

      if (start === 1) {
        end = maxVisible;
      } else if (end === totalPages) {
        start = totalPages - maxVisible + 1;
      }

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
    }
    return pages;
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: appColors.bg }]} edges={['left', 'right']}>
      <View style={styles.flexWrapper}>
        <Header pageName="Orders" showMenu={false} />

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color={appColors.primary} />
            <Text style={[styles.loadingText, { color: appColors.textSec }]}>Loading Ledger...</Text>
          </View>
        ) : error ? (
          <View style={styles.loadingContainer}>
            <Text style={[styles.errorText, { color: '#EF4444' }]}>{error}</Text>
            <TouchableOpacity style={[styles.retryButton, { backgroundColor: appColors.primary }]} onPress={() => fetchOrders(false)}>
              <Text style={styles.retryButtonText}>Refresh Connection</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.mainContent}>
            
            {/* Filter Section */}
            <View style={styles.filterSection}>
              {/* Search bar with SaaS feel */}
              <View style={[styles.searchContainer, { backgroundColor: appColors.cardBg, borderColor: appColors.border }]}>
                <Text style={styles.searchIcon}>🔍</Text>
                <TextInput
                  style={[styles.searchInput, { color: appColors.text }]}
                  placeholder="Filter by ID, customer, phone..."
                  placeholderTextColor={appColors.textSec}
                  value={searchQuery}
                  onChangeText={(text) => {
                    setSearchQuery(text);
                    setCurrentPage(1);
                  }}
                />
              </View>

              {/* Status scroll filter */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.statusScroll}
                contentContainerStyle={styles.statusScrollContainer}
              >
                {statuses.map((status) => {
                  const isActive = selectedStatus === status;
                  return (
                    <TouchableOpacity
                      key={status}
                      activeOpacity={0.8}
                      style={[
                        styles.statusPill,
                        isActive
                          ? { backgroundColor: appColors.primary, borderColor: appColors.primary }
                          : { backgroundColor: appColors.cardBg, borderColor: appColors.border }
                      ]}
                      onPress={() => {
                        setSelectedStatus(status);
                        setCurrentPage(1);
                      }}
                    >
                      <Text
                        style={[
                          styles.statusPillText,
                          {
                            color: isActive ? '#ffffff' : appColors.textSec,
                            fontSize: getResponsiveFontSize(12),
                            fontWeight: isActive ? '700' : '600'
                          }
                        ]}
                      >
                        {status}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              {/* Telemetry Stats Rows (Modern Dashboard look) */}
              <View style={styles.statsCardsRow}>
                <View style={[styles.statCardMini, { backgroundColor: appColors.cardBg, borderColor: appColors.border }]}>
                  <View style={styles.statLabelRow}>
                    <Text style={[styles.statCardLabel, { color: appColors.textSec }]}>LEDGER</Text>
                    <View style={[styles.statDotCircle, { backgroundColor: appColors.primary }]} />
                  </View>
                  <Text style={[styles.statCardValue, { color: appColors.text }]}>{filteredOrders.length}</Text>
                  <Text style={[styles.statCardSubLabel, { color: appColors.textSec }]}>Total items</Text>
                </View>
                <View style={[styles.statCardMini, { backgroundColor: appColors.cardBg, borderColor: appColors.border }]}>
                  <View style={styles.statLabelRow}>
                    <Text style={[styles.statCardLabel, { color: appColors.textSec }]}>ACTIVE</Text>
                    <View style={[styles.statDotCircle, { backgroundColor: '#3B82F6' }]} />
                  </View>
                  <Text style={[styles.statCardValue, { color: appColors.text }]}>
                    {filteredOrders.filter((o) => o.status.toLowerCase() === 'processing').length}
                  </Text>
                  <Text style={[styles.statCardSubLabel, { color: appColors.textSec }]}>Processing</Text>
                </View>
                <View style={[styles.statCardMini, { backgroundColor: appColors.cardBg, borderColor: appColors.border }]}>
                  <View style={styles.statLabelRow}>
                    <Text style={[styles.statCardLabel, { color: appColors.textSec }]}>RESOLVED</Text>
                    <View style={[styles.statDotCircle, { backgroundColor: '#10B981' }]} />
                  </View>
                  <Text style={[styles.statCardValue, { color: appColors.text }]}>
                    {filteredOrders.filter((o) => o.status.toLowerCase() === 'completed').length}
                  </Text>
                  <Text style={[styles.statCardSubLabel, { color: appColors.textSec }]}>Completed</Text>
                </View>
              </View>
            </View>

            {pageLoading ? (
              <View style={styles.pageLoadingContainer}>
                <ActivityIndicator size="small" color={appColors.primary} />
                <Text style={[styles.pageLoadingText, { color: appColors.textSec }]}>
                  Loading page {currentPage}...
                </Text>
              </View>
            ) : (
              <Animated.ScrollView
                ref={scrollViewRef}
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
                contentContainerStyle={[styles.container, { paddingBottom: insets.bottom + 80 }] as any}
                showsVerticalScrollIndicator={false}
                refreshControl={
                  <RefreshControl
                    refreshing={refreshing}
                    onRefresh={() => fetchOrders(true)}
                    colors={[appColors.primary]}
                    tintColor={appColors.primary}
                  />
                }
              >
                {displayedOrders.length === 0 ? (
                  <View style={styles.emptyContainer}>
                    <Text style={[styles.emptyEmoji, { fontSize: 32 }]}>📂</Text>
                    <Text style={[styles.emptyText, { color: appColors.textSec, fontSize: getResponsiveFontSize(14) }]}>
                      No records matched search parameters.
                    </Text>
                  </View>
                ) : (
                  <View style={styles.orderList}>
                    {displayedOrders.map((order) => {
                      const theme = getStatusConfig(order.status);
                      const customerName = `${order.billing.first_name} ${order.billing.last_name}`;
                      const totalItems = order.line_items.reduce((sum, i) => sum + i.quantity, 0);
                      const itemsDesc = order.line_items.map((i) => `${i.name} (${i.quantity}x)`).join(', ');
                      const slot = getMetadataValue(order, 'Delivery Time Slot');
                      const date = getMetadataValue(order, 'Delivery Date');

                      return (
                        <TouchableOpacity
                          key={order.id}
                          style={[
                            styles.orderCard,
                            {
                              backgroundColor: appColors.cardBg,
                              borderColor: appColors.border,
                              borderLeftWidth: 5,
                              borderLeftColor: theme.bullet,
                            }
                          ]}
                          activeOpacity={0.8}
                          onPress={() => router.push(`/pages/admin/orders/${order.id}` as any)}
                        >
                          {/* Top Row: ID & Status Pill */}
                          <View style={styles.cardHeader}>
                            <View style={styles.orderIdGroup}>
                              <Text style={[styles.orderIdLabel, { color: appColors.textSec }]}>ORDER</Text>
                              <Text style={[styles.orderIdText, { color: appColors.text }]}>#{order.id}</Text>
                            </View>
                            <View style={[styles.statusBadge, { backgroundColor: theme.bg }]}>
                              <View style={[styles.statusBulletDot, { backgroundColor: theme.bullet }]} />
                              <Text style={[styles.statusBadgeText, { color: theme.text }]}>
                                {theme.label}
                              </Text>
                            </View>
                          </View>

                          {/* Customer & Item Description Stack */}
                          <View style={styles.cardBodyStack}>
                            <View style={styles.infoFieldRow}>
                              <Text style={[styles.infoFieldLabel, { color: appColors.textSec }]}>CLIENT</Text>
                              <Text style={[styles.infoFieldValue, { color: appColors.text }]} numberOfLines={1}>
                                {customerName}
                              </Text>
                            </View>

                            <View style={styles.infoFieldRow}>
                              <Text style={[styles.infoFieldLabel, { color: appColors.textSec }]}>ITEMS</Text>
                              <Text style={[styles.infoFieldValueSec, { color: appColors.text }]} numberOfLines={1}>
                                <Text style={{ fontWeight: '800' }}>{totalItems} unit(s)</Text> — {itemsDesc}
                              </Text>
                            </View>
                          </View>

                          {/* Fulfillment Capsule */}
                          {(date || slot) && (
                            <View style={[styles.deliveryChipContainer, { backgroundColor: appColors.primaryLight }]}>
                              <Text style={[styles.deliveryChipText, { color: appColors.primary }]}>
                                🚚 Delivery Date: {date || 'Flexible'}  •  Time: {slot || 'Flexible'}
                              </Text>
                            </View>
                          )}

                          {/* Footer Details */}
                          <View style={[styles.cardFooter, { borderTopColor: appColors.border }]}>
                            <Text style={[styles.orderDate, { color: appColors.textSec }]}>
                              {formatDate(order.date_created)}
                            </Text>
                            <Text style={[styles.orderTotal, { color: appColors.text }]}>
                              ₹{parseFloat(order.total).toFixed(2)}
                            </Text>
                          </View>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                )}

                {/* Pagination Row */}
                {totalPages > 1 && (
                  <View style={styles.paginationRow}>
                    <TouchableOpacity
                      style={[
                        styles.pageNavButton,
                        { backgroundColor: appColors.cardBg, borderColor: appColors.border },
                        currentPage === 1 && styles.pageButtonDisabled
                      ]}
                      disabled={currentPage === 1}
                      onPress={() => handlePageChange(currentPage - 1)}
                    >
                      <Text style={[styles.pageNavButtonText, { color: currentPage === 1 ? appColors.textSec : appColors.primary }]}>
                        Prev
                      </Text>
                    </TouchableOpacity>

                    <View style={styles.pageNumbersContainer}>
                      {getPageNumbers().map((num) => {
                        const isActive = num === currentPage;
                        return (
                          <TouchableOpacity
                            key={num}
                            style={[
                              styles.pageNumberCircle,
                              isActive
                                ? { backgroundColor: appColors.primary, borderColor: appColors.primary }
                                : { backgroundColor: appColors.cardBg, borderColor: appColors.border }
                            ]}
                            onPress={() => handlePageChange(num)}
                          >
                            <Text
                              style={[
                                styles.pageNumberText,
                                {
                                  color: isActive ? '#ffffff' : appColors.text,
                                  fontSize: getResponsiveFontSize(12),
                                  fontWeight: isActive ? '700' : '500'
                                }
                              ]}
                            >
                              {num}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>

                    <TouchableOpacity
                      style={[
                        styles.pageNavButton,
                        { backgroundColor: appColors.cardBg, borderColor: appColors.border },
                        currentPage === totalPages && styles.pageButtonDisabled
                      ]}
                      disabled={currentPage === totalPages}
                      onPress={() => handlePageChange(currentPage + 1)}
                    >
                      <Text style={[styles.pageNavButtonText, { color: currentPage === totalPages ? appColors.textSec : appColors.primary }]}>
                        Next
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}
              </Animated.ScrollView>
            )}
          </View>
        )}

        <BottomNavigation activeTab="Orders" />

      </View>
    </SafeAreaView>
  );
}

// ──────────────────────────────────────────────
// Styles
// ──────────────────────────────────────────────

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  flexWrapper: {
    flex: 1,
    position: 'relative',
  },
  mainContent: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  errorText: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  retryButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 10,
    marginTop: 8,
  },
  retryButtonText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 13,
  },
  filterSection: {
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 12,
  },
  searchContainer: {
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  searchIcon: {
    fontSize: 14,
    opacity: 0.6,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    padding: 0,
    fontWeight: '600',
  },
  statusScroll: {
    flexGrow: 0,
  },
  statusScrollContainer: {
    gap: 6,
    paddingRight: 16,
  },
  statusPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 24,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusPillText: {
    textAlign: 'center',
  },
  statsCardsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  statCardMini: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: 1,
    gap: 4,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.03,
        shadowRadius: 4,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  statLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statDotCircle: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statCardLabel: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  statCardValue: {
    fontSize: 18,
    fontWeight: '800',
    lineHeight: 22,
  },
  statCardSubLabel: {
    fontSize: 9,
    fontWeight: '700',
  },
  scrollView: {
    flex: 1,
  },
  container: {
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  emptyContainer: {
    paddingVertical: 80,
    alignItems: 'center',
    gap: 12,
  },
  emptyEmoji: {
    textAlign: 'center',
  },
  emptyText: {
    fontWeight: '700',
    textAlign: 'center',
  },
  orderList: {
    gap: 12,
  },
  orderCard: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    gap: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.04,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderIdGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  orderIdLabel: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  orderIdText: {
    fontWeight: '800',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  statusBulletDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusBadgeText: {
    fontWeight: '700',
    fontSize: 10,
    textTransform: 'uppercase',
  },
  cardBodyStack: {
    gap: 6,
  },
  infoFieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoFieldLabel: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
    width: 65,
  },
  infoFieldValue: {
    flex: 1,
    fontSize: 13,
    fontWeight: '700',
  },
  infoFieldValueSec: {
    flex: 1,
    fontSize: 12,
    fontWeight: '500',
  },
  deliveryChipContainer: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  deliveryChipText: {
    fontSize: 11,
    fontWeight: '700',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
    borderTopWidth: 1,
    paddingTop: 10,
  },
  orderDate: {
    fontWeight: '600',
    fontSize: 11,
  },
  orderTotal: {
    fontWeight: '800',
    fontSize: 15,
  },
  pageLoadingContainer: {
    paddingVertical: 50,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  pageLoadingText: {
    fontSize: 14,
    fontWeight: '600',
  },
  paginationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 8,
  },
  pageNavButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  pageButtonDisabled: {
    opacity: 0.3,
  },
  pageNavButtonText: {
    fontWeight: '700',
    fontSize: 12,
  },
  pageNumbersContainer: {
    flexDirection: 'row',
    gap: 6,
  },
  pageNumberCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  pageNumberText: {
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    height: '92%',
    width: '100%',
  },
  modalHandle: {
    width: 40,
    height: 5,
    borderRadius: 3,
    alignSelf: 'center',
    marginTop: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontWeight: '800',
  },
  modalSubtitle: {
    fontWeight: '500',
    marginTop: 2,
  },
  closeButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 12,
    fontWeight: '700',
  },
  modalScrollContent: {
    padding: 16,
    gap: 16,
  },
  modalStatusBanner: {
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    gap: 4,
  },
  badgeRowCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  modalStatusText: {
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  modalPaymentMethodText: {
    fontSize: 11,
    fontWeight: '700',
    opacity: 0.8,
  },
  trackerTimelineCard: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
  },
  timelineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
  },
  timelineStep: {
    alignItems: 'center',
    gap: 6,
    flex: 1.2,
  },
  timelineDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  timelineText: {
    fontSize: 10,
    fontWeight: '700',
    textAlign: 'center',
  },
  timelineLine: {
    height: 2,
    flex: 1,
    marginTop: -16,
  },
  detailSectionCard: {
    borderRadius: 16,
    padding: 16,
    gap: 12,
    borderWidth: 1,
  },
  sectionHeadingTitle: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  profileSummaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  profileAvatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileAvatarText: {
    fontSize: 18,
    fontWeight: '800',
  },
  profileDetailsCol: {
    flex: 1,
    gap: 2,
  },
  profileName: {
    fontSize: 14,
    fontWeight: '700',
  },
  profileMeta: {
    fontSize: 12,
    fontWeight: '600',
  },
  detailCardField: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  fieldValue: {
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'right',
  },
  quickContactRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  quickContactButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
  },
  quickContactIcon: {
    fontSize: 13,
  },
  quickContactLabel: {
    fontSize: 12,
    fontWeight: '700',
  },
  addressBlock: {
    gap: 4,
  },
  addressBlockTitle: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  addressText: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500',
  },
  sectionDivider: {
    height: 1,
    width: '100%',
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    gap: 12,
    borderBottomWidth: 1,
  },
  itemQtyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  itemQtyText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '800',
  },
  itemRowLeft: {
    flex: 1,
    gap: 2,
  },
  itemName: {
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 17,
  },
  itemSubDetail: {
    fontSize: 11,
    fontWeight: '600',
  },
  itemRowRight: {
    fontSize: 13,
    fontWeight: '800',
  },
  totalBreakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  totalVal: {
    fontSize: 12,
    fontWeight: '700',
  },
  dashedDivider: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 4,
    overflow: 'hidden',
  },
  dash: {
    width: 6,
    height: 1,
  },
  grandTotalLabel: {
    fontSize: 13,
    fontWeight: '800',
  },
  grandTotalVal: {
    fontSize: 16,
    fontWeight: '900',
  },
  webLinkButton: {
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  webLinkButtonText: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 13,
  },
});
