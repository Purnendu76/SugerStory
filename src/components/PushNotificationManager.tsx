import React, { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import axios from 'axios';
import { useNotification } from './NotificationProvider';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

async function registerForPushNotificationsAsync() {
  let token;
  let newlyGranted = false;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
    await Notifications.setNotificationChannelAsync('order-alerts', {
      name: 'Order Alerts',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
      sound: 'mixkit_happy_bells_notification_937.wav',
    });
  }

  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
      if (status === 'granted') {
        newlyGranted = true;
      }
    }
    if (finalStatus !== 'granted') {
      console.warn('Failed to get push token for push notification!');
      return null;
    }
    const projectId =
      Constants?.expoConfig?.extra?.eas?.projectId ??
      Constants?.easConfig?.projectId;
    if (!projectId) {
      console.warn('Project ID not found in app config.');
      return null;
    }
    try {
      token = (
        await Notifications.getExpoPushTokenAsync({
          projectId,
        })
      ).data;
    } catch (e) {
      console.warn('Failed to get Expo push token:', e);
    }
  } else {
    console.log('Must use physical device for Push Notifications');
  }

  return { token, newlyGranted };
}

export default function PushNotificationManager() {
  const { notify } = useNotification();
  const router = useRouter();
  const notificationListener = useRef<Notifications.Subscription | null>(null);
  const responseListener = useRef<Notifications.Subscription | null>(null);

  useEffect(() => {
    registerForPushNotificationsAsync().then((res) => {
      if (res && res.token && res.newlyGranted) {
        console.log('Firebase Expo Push Token (Newly Granted):', res.token);
        
        // Register token with your n8n middleware
        axios.post('https://n8n.srv917960.hstgr.cloud/webhook/register-token', {
          token: res.token,
          platform: Platform.OS,
        }).catch(err => {
          console.warn('Failed to register push token with backend:', err);
        });
      } else if (res && res.token) {
        console.log('Firebase Expo Push Token (Already Granted):', res.token);
      }
    });

    notificationListener.current = Notifications.addNotificationReceivedListener((incoming) => {
      const { title, body } = incoming.request.content;
      if (body) {
        notify({
          title: title || 'Notification Received',
          message: body,
          type: 'info',
        });
      }
    });

    const handleNotificationResponse = (response: Notifications.NotificationResponse) => {
      console.log('User interacted with push notification:', response);
      const data = response.notification.request.content.data;
      if (data && data.orderId) {
        setTimeout(() => {
          router.push(`/pages/admin/orders/${data.orderId}`);
        }, 500);
      }
    };

    responseListener.current = Notifications.addNotificationResponseReceivedListener(handleNotificationResponse);

    // Handle notifications that opened the app from a closed (killed) state
    Notifications.getLastNotificationResponseAsync().then((response) => {
      if (response) {
        handleNotificationResponse(response);
      }
    });

    return () => {
      notificationListener.current?.remove();
      responseListener.current?.remove();
    };
  }, [notify, router]);

  return null;
}
