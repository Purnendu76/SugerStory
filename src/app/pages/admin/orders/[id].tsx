import { useNotification } from "@/components/NotificationProvider";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Linking,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
// @ts-ignore
import axios from "axios/dist/axios.js";

// ──────────────────────────────────────────────
// Interfaces
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

export default function OrderDetailsScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const scheme = useColorScheme();
  const isDark = scheme === "dark";
  const insets = useSafeAreaInsets();
  const { notifySuccess, notifyError } = useNotification();

  // Sleek Indigo / Slate Theme (Modern SaaS look)
  const appColors = {
    bg: isDark ? "#090A0C" : "#F8FAFC",
    cardBg: isDark ? "#12141C" : "#FFFFFF",
    text: isDark ? "#F8FAFC" : "#0F172A",
    textSec: isDark ? "#94A3B8" : "#64748B",
    border: isDark ? "#1E293B" : "#E2E8F0",
    primary: isDark ? "#818CF8" : "#6366F1",
    primaryLight: isDark ? "#1E1B4B" : "#EEF2FF",
  };

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchOrderDetails = async (isSilent = false) => {
    try {
      if (!isSilent) setLoading(true);
      else setRefreshing(true);

      const response = await axios.get(
        "https://n8n.srv917960.hstgr.cloud/webhook/get-orders",
      );
      const allOrders: Order[] = response.data || [];
      const matched = allOrders.find((o) => o.id.toString() === id);

      if (matched) {
        setOrder(matched);
      } else {
        notifyError(`Order #${id} not found in database`);
      }
    } catch (err) {
      console.error(err);
      notifyError("Failed to fetch order information");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchOrderDetails();
    }
  }, [id]);

  const handleDialCall = async (phone?: string) => {
    if (!phone) return;
    // Sanitize phone number to keep only digits and '+' sign
    const sanitizedPhone = phone.replace(/[^\d+]/g, "");
    const url = `tel:${sanitizedPhone}`;
    try {
      // Direct dial skip canOpenURL check to avoid emulator locks
      await Linking.openURL(url);
    } catch (err) {
      console.error(err);
      notifyError("Unable to launch dialer on this device");
    }
  };

  const handleSendEmail = async (email?: string) => {
    if (!email) return;
    const url = `mailto:${email}`;
    try {
      await Linking.openURL(url);
    } catch (err) {
      console.error(err);
      notifyError("Unable to open mail client");
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });
    } catch {
      return dateStr;
    }
  };

  const getMetadataValue = (key: string) => {
    if (!order) return null;
    const item = order.meta_data.find((m) => m.key === key);
    return item ? item.value : null;
  };

  const getCoordinates = () => {
    if (!order) return null;
    const latKeys = [
      "_shipping_lat",
      "_billing_lat",
      "_wcl_customer_lat",
      "latitude",
      "lat",
      "billing_latitude",
      "shipping_latitude",
      "_billing_latitude",
      "_shipping_latitude",
    ];
    const lngKeys = [
      "_shipping_lng",
      "_billing_lng",
      "_wcl_customer_lng",
      "longitude",
      "lng",
      "long",
      "billing_longitude",
      "shipping_longitude",
      "_billing_longitude",
      "_shipping_longitude",
    ];

    let latitude: string | null = null;
    let longitude: string | null = null;

    for (const key of latKeys) {
      const found = order.meta_data.find(
        (m) => m.key.toLowerCase() === key.toLowerCase(),
      );
      if (found && found.value) {
        latitude = found.value;
        break;
      }
    }

    for (const key of lngKeys) {
      const found = order.meta_data.find(
        (m) => m.key.toLowerCase() === key.toLowerCase(),
      );
      if (found && found.value) {
        longitude = found.value;
        break;
      }
    }

    if (latitude && longitude) {
      return { latitude, longitude };
    }
    return null;
  };

  const handleOpenGoogleMaps = async () => {
    const coords = getCoordinates();
    if (!coords) {
      notifyError("No coordinates found in order metadata");
      return;
    }
    const { latitude, longitude } = coords;
    const url = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
    try {
      await Linking.openURL(url);
    } catch (err) {
      console.error(err);
      notifyError("Unable to open Google Maps");
    }
  };

  const getStatusConfig = (status: string) => {
    switch (status.toLowerCase()) {
      case "completed":
        return {
          bg: "#D1FAE5",
          text: "#065F46",
          bullet: "#10B981",
          label: "Completed",
        };
      case "processing":
        return {
          bg: "#DBEAFE",
          text: "#1E40AF",
          bullet: "#3B82F6",
          label: "Processing",
        };
      case "pending":
        return {
          bg: "#FEF3C7",
          text: "#92400E",
          bullet: "#F59E0B",
          label: "Pending",
        };
      case "cancelled":
      case "failed":
        return {
          bg: "#FEE2E2",
          text: "#991B1B",
          bullet: "#EF4444",
          label: "Cancelled",
        };
      default:
        return {
          bg: "#F3F4F6",
          text: "#374151",
          bullet: "#9CA3AF",
          label: status,
        };
    }
  };

  if (loading) {
    return (
      <SafeAreaView
        style={[styles.safeArea, { backgroundColor: appColors.bg }]}
      >
        <View style={styles.centerContainer}>
          <ActivityIndicator size="small" color={appColors.primary} />
          <Text style={[styles.loadingText, { color: appColors.textSec }]}>
            Loading Order Data...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!order) {
    return (
      <SafeAreaView
        style={[styles.safeArea, { backgroundColor: appColors.bg }]}
      >
        <View style={styles.centerContainer}>
          <Text style={[styles.errorTitle, { color: appColors.text }]}>
            Order Not Found
          </Text>
          <TouchableOpacity
            style={[styles.backButton, { backgroundColor: appColors.primary }]}
            onPress={() => router.back()}
          >
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const theme = getStatusConfig(order.status);
  const delDate = getMetadataValue("Delivery Date");
  const delSlot = getMetadataValue("Delivery Time Slot");

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: appColors.bg }]}
      edges={["top", "left", "right"]}
    >
      {/* Header bar */}
      <View style={[styles.headerBar, { borderBottomColor: appColors.border }]}>
        <TouchableOpacity
          style={styles.backArrowButton}
          onPress={() => router.back()}
        >
          <Text style={[styles.backArrowText, { color: appColors.text }]}>
            ← Back
          </Text>
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={[styles.headerTitle, { color: appColors.text }]}>
            Order #{order.id}
          </Text>
          <Text style={[styles.headerSubtitle, { color: appColors.textSec }]}>
            {formatDate(order.date_created)}
          </Text>
        </View>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 32 },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => fetchOrderDetails(true)}
            colors={[appColors.primary]}
          />
        }
      >
        {/* Status banner */}
        <View style={[styles.statusBanner, { backgroundColor: theme.bg }]}>
          <View style={styles.badgeRowCenter}>
            <View
              style={[
                styles.statusBulletDot,
                { backgroundColor: theme.bullet },
              ]}
            />
            <Text style={[styles.statusBannerText, { color: theme.text }]}>
              {theme.label.toUpperCase()}
            </Text>
          </View>
          <Text style={[styles.paymentMethodText, { color: theme.text }]}>
            Payment: {order.payment_method_title}
          </Text>
        </View>

        {/* Step tracker timeline */}
        <View
          style={[
            styles.trackerTimelineCard,
            {
              backgroundColor: appColors.cardBg,
              borderColor: appColors.border,
            },
          ]}
        >
          <View style={styles.timelineRow}>
            <View style={styles.timelineStep}>
              <View
                style={[
                  styles.timelineDot,
                  { backgroundColor: appColors.primary },
                ]}
              />
              <Text style={[styles.timelineText, { color: appColors.text }]}>
                Placed
              </Text>
            </View>
            <View
              style={[
                styles.timelineLine,
                {
                  backgroundColor:
                    order.status !== "pending"
                      ? appColors.primary
                      : appColors.border,
                },
              ]}
            />
            <View style={styles.timelineStep}>
              <View
                style={[
                  styles.timelineDot,
                  {
                    backgroundColor:
                      order.status === "processing" ||
                      order.status === "completed"
                        ? appColors.primary
                        : appColors.border,
                  },
                ]}
              />
              <Text
                style={[
                  styles.timelineText,
                  {
                    color:
                      order.status !== "pending"
                        ? appColors.text
                        : appColors.textSec,
                  },
                ]}
              >
                Processing
              </Text>
            </View>
            <View
              style={[
                styles.timelineLine,
                {
                  backgroundColor:
                    order.status === "completed" ? "#10B981" : appColors.border,
                },
              ]}
            />
            <View style={styles.timelineStep}>
              <View
                style={[
                  styles.timelineDot,
                  {
                    backgroundColor:
                      order.status === "completed"
                        ? "#10B981"
                        : appColors.border,
                  },
                ]}
              />
              <Text
                style={[
                  styles.timelineText,
                  {
                    color:
                      order.status === "completed"
                        ? appColors.text
                        : appColors.textSec,
                  },
                ]}
              >
                Completed
              </Text>
            </View>
          </View>
        </View>

        {/* Customer Profile Card */}
        <View
          style={[
            styles.sectionCard,
            {
              backgroundColor: appColors.cardBg,
              borderColor: appColors.border,
            },
          ]}
        >
          <Text style={[styles.sectionHeading, { color: appColors.textSec }]}>
            CUSTOMER PROFILE
          </Text>
          <View style={styles.profileSummaryRow}>
            <View
              style={[
                styles.profileAvatar,
                { backgroundColor: appColors.primaryLight },
              ]}
            >
              <Text
                style={[styles.profileAvatarText, { color: appColors.primary }]}
              >
                {order.billing.first_name.charAt(0).toUpperCase()}
              </Text>
            </View>
            <View style={styles.profileDetails}>
              <Text style={[styles.profileName, { color: appColors.text }]}>
                {order.billing.first_name} {order.billing.last_name}
              </Text>
              <Text style={[styles.profileMeta, { color: appColors.textSec }]}>
                {order.billing.email}
              </Text>
            </View>
          </View>

          {/* Quick contact buttons */}
          <View style={styles.quickContactRow}>
            {order.billing.phone ? (
              <TouchableOpacity
                style={[
                  styles.quickContactButton,
                  { backgroundColor: appColors.primaryLight },
                ]}
                onPress={() => handleDialCall(order.billing.phone)}
              >
                <Text style={styles.quickContactIcon}>📞</Text>
                <Text
                  style={[
                    styles.quickContactLabel,
                    { color: appColors.primary },
                  ]}
                >
                  Call Customer
                </Text>
              </TouchableOpacity>
            ) : null}

            {order.billing.email ? (
              <TouchableOpacity
                style={[
                  styles.quickContactButton,
                  { backgroundColor: appColors.primaryLight },
                ]}
                onPress={() => handleSendEmail(order.billing.email)}
              >
                <Text style={styles.quickContactIcon}>✉️</Text>
                <Text
                  style={[
                    styles.quickContactLabel,
                    { color: appColors.primary },
                  ]}
                >
                  Email Client
                </Text>
              </TouchableOpacity>
            ) : null}
          </View>
        </View>

        {/* Delivery schedule details */}
        {(delDate || delSlot) && (
          <View
            style={[
              styles.sectionCard,
              {
                backgroundColor: appColors.cardBg,
                borderColor: appColors.border,
              },
            ]}
          >
            <Text style={[styles.sectionHeading, { color: appColors.textSec }]}>
              FULFILLMENT LOGISTICS
            </Text>
            <View style={styles.detailCardField}>
              <Text style={[styles.fieldLabel, { color: appColors.textSec }]}>
                Delivery Date:
              </Text>
              <Text style={[styles.fieldValue, { color: appColors.text }]}>
                {delDate || "Standard"}
              </Text>
            </View>
            <View style={styles.detailCardField}>
              <Text style={[styles.fieldLabel, { color: appColors.textSec }]}>
                Requested Slot:
              </Text>
              <Text style={[styles.fieldValue, { color: appColors.text }]}>
                {delSlot || "Flexible Window"}
              </Text>
            </View>
          </View>
        )}

        {/* Address cards */}
        <View
          style={[
            styles.sectionCard,
            {
              backgroundColor: appColors.cardBg,
              borderColor: appColors.border,
            },
          ]}
        >
          <Text style={[styles.sectionHeading, { color: appColors.textSec }]}>
            DESTINATION DETAILS
          </Text>

          <View style={styles.addressBlock}>
            <Text
              style={[styles.addressBlockTitle, { color: appColors.textSec }]}
            >
              BILLING DETAILS
            </Text>
            <Text style={[styles.addressText, { color: appColors.text }]}>
              {[
                order.billing.address_1,
                order.billing.address_2,
                order.billing.city,
                order.billing.state,
                order.billing.postcode,
                order.billing.country,
              ]
                .filter(Boolean)
                .join(", ")}
            </Text>
          </View>

          <View
            style={[styles.divider, { backgroundColor: appColors.border }]}
          />

          <View style={styles.addressBlock}>
            <Text
              style={[styles.addressBlockTitle, { color: appColors.textSec }]}
            >
              SHIPPING DESTINATION
            </Text>
            <Text style={[styles.addressText, { color: appColors.text }]}>
              {[
                order.shipping.address_1,
                order.shipping.address_2,
                order.shipping.city,
                order.shipping.state,
                order.shipping.postcode,
                order.shipping.country,
              ]
                .filter(Boolean)
                .join(", ")}
            </Text>
            {getCoordinates() ? (
              <TouchableOpacity
                style={[
                  styles.mapButton,
                  { backgroundColor: appColors.primaryLight },
                ]}
                onPress={handleOpenGoogleMaps}
              >
                <Text style={styles.mapButtonIcon}>📍</Text>
                <Text
                  style={[styles.mapButtonText, { color: appColors.primary }]}
                >
                  Show Place in Google Map
                </Text>
              </TouchableOpacity>
            ) : null}
          </View>
        </View>

        {/* Items List */}
        <View
          style={[
            styles.sectionCard,
            {
              backgroundColor: appColors.cardBg,
              borderColor: appColors.border,
            },
          ]}
        >
          <Text style={[styles.sectionHeading, { color: appColors.textSec }]}>
            LINE ITEMS
          </Text>
          {order.line_items.map((item) => (
            <View
              key={item.id}
              style={[styles.itemRow, { borderBottomColor: appColors.border }]}
            >
              <View
                style={[
                  styles.itemQtyBadge,
                  { backgroundColor: appColors.primary },
                ]}
              >
                <Text style={styles.itemQtyText}>{item.quantity}x</Text>
              </View>
              <View style={styles.itemRowLeft}>
                <Text
                  style={[styles.itemName, { color: appColors.text }]}
                  numberOfLines={2}
                >
                  {item.name}
                </Text>
                <Text
                  style={[styles.itemSubDetail, { color: appColors.textSec }]}
                >
                  Unit rate: ₹{parseFloat(item.price.toString()).toFixed(2)}
                </Text>
              </View>
              <Text style={[styles.itemRowRight, { color: appColors.text }]}>
                ₹{parseFloat(item.total).toFixed(2)}
              </Text>
            </View>
          ))}
        </View>

        {/* Totals Summary */}
        <View
          style={[
            styles.sectionCard,
            {
              backgroundColor: appColors.cardBg,
              borderColor: appColors.border,
            },
          ]}
        >
          <Text style={[styles.sectionHeading, { color: appColors.textSec }]}>
            FINANCIALS
          </Text>

          <View style={styles.totalRow}>
            <Text style={[styles.totalLabel, { color: appColors.textSec }]}>
              Subtotal:
            </Text>
            <Text style={[styles.totalVal, { color: appColors.text }]}>
              ₹
              {order.line_items
                .reduce((sum, item) => sum + parseFloat(item.total), 0)
                .toFixed(2)}
            </Text>
          </View>

          <View style={styles.totalRow}>
            <Text style={[styles.totalLabel, { color: appColors.textSec }]}>
              Shipping Rate:
            </Text>
            <Text style={[styles.totalVal, { color: appColors.text }]}>
              ₹{parseFloat(order.shipping_total || "0").toFixed(2)}
            </Text>
          </View>

          <View style={styles.totalRow}>
            <Text style={[styles.totalLabel, { color: appColors.textSec }]}>
              Discounts:
            </Text>
            <Text style={[styles.totalVal, { color: "#EF4444" }]}>
              -₹{parseFloat(order.discount_total || "0").toFixed(2)}
            </Text>
          </View>

          {/* Dashed line */}
          <View style={styles.dashedDivider}>
            {Array.from({ length: 32 }).map((_, i) => (
              <View
                key={i}
                style={[styles.dash, { backgroundColor: appColors.border }]}
              />
            ))}
          </View>

          <View style={styles.totalRow}>
            <Text style={[styles.grandTotalLabel, { color: appColors.text }]}>
              Grand Total:
            </Text>
            <Text style={[styles.grandTotalVal, { color: appColors.primary }]}>
              ₹{parseFloat(order.total).toFixed(2)}
            </Text>
          </View>
        </View>
      </ScrollView>
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
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
  },
  loadingText: {
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  errorTitle: {
    fontSize: 15,
    fontWeight: "700",
  },
  backButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 10,
  },
  backButtonText: {
    color: "#ffffff",
    fontWeight: "700",
  },
  headerBar: {
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  backArrowButton: {
    paddingVertical: 8,
    paddingRight: 16,
  },
  backArrowText: {
    fontSize: 14,
    fontWeight: "700",
  },
  headerTitleContainer: {
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: 0.2,
  },
  headerSubtitle: {
    fontSize: 11,
    fontWeight: "600",
    marginTop: 1,
  },
  scrollContent: {
    padding: 16,
    gap: 16,
  },
  statusBanner: {
    borderRadius: 14,
    padding: 16,
    alignItems: "center",
    gap: 4,
  },
  badgeRowCenter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  statusBulletDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusBannerText: {
    fontSize: 14,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  paymentMethodText: {
    fontSize: 11,
    fontWeight: "700",
    opacity: 0.85,
  },
  trackerTimelineCard: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
  },
  timelineRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 8,
  },
  timelineStep: {
    alignItems: "center",
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
    fontWeight: "700",
    textAlign: "center",
  },
  timelineLine: {
    height: 2,
    flex: 1,
    marginTop: -16,
  },
  sectionCard: {
    borderRadius: 16,
    padding: 16,
    gap: 12,
    borderWidth: 1,
  },
  sectionHeading: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  profileSummaryRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  profileAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },
  profileAvatarText: {
    fontSize: 18,
    fontWeight: "800",
  },
  profileDetails: {
    flex: 1,
    gap: 2,
  },
  profileName: {
    fontSize: 14,
    fontWeight: "700",
  },
  profileMeta: {
    fontSize: 12,
    fontWeight: "600",
  },
  quickContactRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 4,
  },
  quickContactButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
  },
  quickContactIcon: {
    fontSize: 13,
  },
  quickContactLabel: {
    fontSize: 12,
    fontWeight: "700",
  },
  detailCardField: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: "600",
  },
  fieldValue: {
    fontSize: 12,
    fontWeight: "700",
    textAlign: "right",
  },
  addressBlock: {
    gap: 4,
  },
  addressBlockTitle: {
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 0.3,
  },
  addressText: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "500",
  },
  divider: {
    height: 1,
    width: "100%",
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
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
    color: "#ffffff",
    fontSize: 11,
    fontWeight: "800",
  },
  itemRowLeft: {
    flex: 1,
    gap: 2,
  },
  itemName: {
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 17,
  },
  itemSubDetail: {
    fontSize: 11,
    fontWeight: "600",
  },
  itemRowRight: {
    fontSize: 13,
    fontWeight: "800",
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  totalLabel: {
    fontSize: 12,
    fontWeight: "600",
  },
  totalVal: {
    fontSize: 12,
    fontWeight: "700",
  },
  dashedDivider: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginVertical: 4,
    overflow: "hidden",
  },
  dash: {
    width: 6,
    height: 1,
  },
  grandTotalLabel: {
    fontSize: 13,
    fontWeight: "800",
  },
  grandTotalVal: {
    fontSize: 16,
    fontWeight: "900",
  },
  webLinkButton: {
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },
  webLinkButtonText: {
    color: "#ffffff",
    fontWeight: "800",
    fontSize: 13,
  },
  mapButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
    marginTop: 10,
  },
  mapButtonIcon: {
    fontSize: 13,
  },
  mapButtonText: {
    fontSize: 12,
    fontWeight: "700",
  },
});
