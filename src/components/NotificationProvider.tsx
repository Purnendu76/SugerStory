import React, {
  createContext,
  useContext,
  useCallback,
  useState,
  useRef,
  useMemo,
} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Platform,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withDelay,
  runOnJS,
  Easing,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// ──────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────

export type NotificationType = 'success' | 'error' | 'info' | 'warning';

export interface NotificationConfig {
  /** Notification title (optional) */
  title?: string;
  /** Notification body text */
  message: string;
  /** Type controls the colour scheme */
  type?: NotificationType;
  /** Auto-dismiss duration in ms (default 3000). Pass 0 to disable. */
  duration?: number;
}

interface NotificationContextValue {
  /** Show a notification toast */
  notify: (config: NotificationConfig) => void;
  /** Convenience: show a success notification */
  notifySuccess: (message: string, title?: string) => void;
  /** Convenience: show an error notification */
  notifyError: (message: string, title?: string) => void;
  /** Convenience: show an info notification */
  notifyInfo: (message: string, title?: string) => void;
  /** Convenience: show a warning notification */
  notifyWarning: (message: string, title?: string) => void;
  /** Dismiss the current notification */
  dismiss: () => void;
}

// ──────────────────────────────────────────────
// Context
// ──────────────────────────────────────────────

const NotificationContext = createContext<NotificationContextValue | null>(null);

// ──────────────────────────────────────────────
// Theme map
// ──────────────────────────────────────────────

const THEME: Record<
  NotificationType,
  { bg: string; border: string; icon: string; title: string; text: string }
> = {
  success: {
    bg: '#0D2818',
    border: '#2ECC71',
    icon: '✓',
    title: '#2ECC71',
    text: '#A3D9B1',
  },
  error: {
    bg: '#2D0A0A',
    border: '#E74C3C',
    icon: '✕',
    title: '#E74C3C',
    text: '#E8A9A3',
  },
  info: {
    bg: '#0A1A2D',
    border: '#3498DB',
    icon: 'ℹ',
    title: '#3498DB',
    text: '#A3C4E8',
  },
  warning: {
    bg: '#2D2200',
    border: '#F39C12',
    icon: '⚠',
    title: '#F39C12',
    text: '#E8D4A3',
  },
};

// ──────────────────────────────────────────────
// Provider
// ──────────────────────────────────────────────

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const insets = useSafeAreaInsets();
  const [notification, setNotification] = useState<NotificationConfig | null>(null);
  const dismissTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const queueRef = useRef<NotificationConfig[]>([]);

  // Animation values
  const translateY = useSharedValue(-150);
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.9);

  const clearTimer = useCallback(() => {
    if (dismissTimer.current) {
      clearTimeout(dismissTimer.current);
      dismissTimer.current = null;
    }
  }, []);

  const processNext = useCallback(() => {
    if (queueRef.current.length > 0) {
      const next = queueRef.current.shift()!;
      showNotification(next);
    }
  }, []);

  const hideNotification = useCallback(() => {
    clearTimer();
    translateY.value = withTiming(-150, { duration: 300, easing: Easing.inOut(Easing.ease) });
    opacity.value = withTiming(0, { duration: 250 });
    scale.value = withTiming(0.9, { duration: 300 }, () => {
      runOnJS(setNotification)(null);
      runOnJS(processNext)();
    });
  }, [clearTimer, processNext]);

  const showNotification = useCallback(
    (config: NotificationConfig) => {
      clearTimer();
      setNotification(config);

      // Animate in
      translateY.value = withSpring(0, {
        damping: 18,
        stiffness: 200,
        mass: 0.8,
      });
      opacity.value = withTiming(1, { duration: 250 });
      scale.value = withSpring(1, {
        damping: 15,
        stiffness: 180,
      });

      // Auto-dismiss
      const duration = config.duration ?? 3000;
      if (duration > 0) {
        dismissTimer.current = setTimeout(() => {
          hideNotification();
        }, duration);
      }
    },
    [clearTimer, hideNotification],
  );

  const notify = useCallback(
    (config: NotificationConfig) => {
      if (notification) {
        // Queue it if one is already showing
        queueRef.current.push(config);
        hideNotification();
      } else {
        showNotification(config);
      }
    },
    [notification, showNotification, hideNotification],
  );

  const dismiss = useCallback(() => {
    hideNotification();
  }, [hideNotification]);

  // Convenience helpers
  const notifySuccess = useCallback(
    (message: string, title?: string) =>
      notify({ message, title: title ?? 'Success', type: 'success' }),
    [notify],
  );

  const notifyError = useCallback(
    (message: string, title?: string) =>
      notify({ message, title: title ?? 'Error', type: 'error' }),
    [notify],
  );

  const notifyInfo = useCallback(
    (message: string, title?: string) =>
      notify({ message, title: title ?? 'Info', type: 'info' }),
    [notify],
  );

  const notifyWarning = useCallback(
    (message: string, title?: string) =>
      notify({ message, title: title ?? 'Warning', type: 'warning' }),
    [notify],
  );

  // Animated styles
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }, { scale: scale.value }],
    opacity: opacity.value,
  }));

  const type = notification?.type ?? 'success';
  const theme = THEME[type];

  const contextValue = useMemo(
    () => ({
      notify,
      notifySuccess,
      notifyError,
      notifyInfo,
      notifyWarning,
      dismiss,
    }),
    [notify, notifySuccess, notifyError, notifyInfo, notifyWarning, dismiss],
  );

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}

      {/* Toast overlay – always mounted for animation, but pointer-events only when visible */}
      <Animated.View
        pointerEvents={notification ? 'auto' : 'none'}
        style={[
          styles.toastContainer,
          { top: insets.top + 8 },
          animatedStyle,
        ]}
      >
        {notification && (
          <Pressable
            onPress={dismiss}
            style={[
              styles.toast,
              {
                backgroundColor: theme.bg,
                borderColor: theme.border,
              },
            ]}
          >
            {/* Accent bar */}
            <View style={[styles.accentBar, { backgroundColor: theme.border }]} />

            {/* Icon circle */}
            <View style={[styles.iconCircle, { backgroundColor: theme.border + '22' }]}>
              <Text style={[styles.iconText, { color: theme.border }]}>
                {theme.icon}
              </Text>
            </View>

            {/* Content */}
            <View style={styles.content}>
              {notification.title && (
                <Text style={[styles.title, { color: theme.title }]} numberOfLines={1}>
                  {notification.title}
                </Text>
              )}
              <Text style={[styles.message, { color: theme.text }]} numberOfLines={2}>
                {notification.message}
              </Text>
            </View>

            {/* Close hint */}
            <Text style={[styles.closeHint, { color: theme.text }]}>✕</Text>
          </Pressable>
        )}
      </Animated.View>
    </NotificationContext.Provider>
  );
}

// ──────────────────────────────────────────────
// Hook
// ──────────────────────────────────────────────

export function useNotification(): NotificationContextValue {
  const ctx = useContext(NotificationContext);
  if (!ctx) {
    throw new Error('useNotification must be used within a <NotificationProvider>');
  }
  return ctx;
}

// ──────────────────────────────────────────────
// Styles
// ──────────────────────────────────────────────

const styles = StyleSheet.create({
  toastContainer: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 9999,
    elevation: 9999,
    alignItems: 'center',
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    maxWidth: 500,
    borderRadius: 14,
    borderWidth: 1,
    paddingVertical: 14,
    paddingHorizontal: 16,
    overflow: 'hidden',
    // Shadow
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.35,
        shadowRadius: 16,
      },
      android: {
        elevation: 12,
      },
    }),
  },
  accentBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    borderTopLeftRadius: 14,
    borderBottomLeftRadius: 14,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  iconText: {
    fontSize: 18,
    fontWeight: '700',
  },
  content: {
    flex: 1,
    marginRight: 8,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 2,
    letterSpacing: 0.2,
  },
  message: {
    fontSize: 13,
    fontWeight: '400',
    lineHeight: 18,
    opacity: 0.9,
  },
  closeHint: {
    fontSize: 14,
    opacity: 0.4,
    padding: 4,
  },
});
