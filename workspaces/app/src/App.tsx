import Constants from "expo-constants";
import * as Notifications from "expo-notifications";
import React, { useEffect, useContext, useRef } from "react";
import { View, StyleSheet, Platform } from "react-native";
import { Header, Text } from "react-native-elements";
import StateContext from "./Context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Random from "expo-random";
import * as Crypto from "expo-crypto";
import { Subscription } from "@unimodules/core";
import { NotificationList } from "./View";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

export default function App() {
  const state = useContext(StateContext);

  const notificationListener = useRef<Subscription | null>(null);
  const responseListener = useRef<Subscription | null>(null);

  // This will be replaced by https://kusama.polkassembly.io/bounty/3
  const getId = async (): Promise<string> => {
    let id = await AsyncStorage.getItem("id");

    if (!id) {
      const seed = await Random.getRandomBytesAsync(256);

      id = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        seed.toString()
      );

      await AsyncStorage.setItem("id", id);
    }

    return id;
  };

  const getNotificationToken = async () => {
    // TESTING DATA
    return `ExponentPushToken[oZI8lHPGif70IEgG-u1T31`;

    let notificationToken = await AsyncStorage.getItem("notificationToken");

    if (!notificationToken) {
      if (Constants.isDevice) {
        const { status: existingStatus } =
          await Notifications.getPermissionsAsync();

        let finalStatus = existingStatus;

        if (existingStatus !== "granted") {
          const { status } = await Notifications.requestPermissionsAsync();
          finalStatus = status;
        }

        if (finalStatus !== "granted") {
          alert("Failed to get push token for push notification!");
          return;
        }

        notificationToken = (await Notifications.getExpoPushTokenAsync()).data;
      } else {
        alert("Must use physical device for Push Notifications");
      }

      if (Platform.OS === "android") {
        Notifications.setNotificationChannelAsync("default", {
          name: "default",
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: "#FF231F7C",
        });
      }
    }

    return notificationToken;
  };

  useEffect(() => {
    (async () => {
      const id = await getId();

      const token = await getNotificationToken();

      if (!token) {
        alert("Notification is required for this app!");
        return;
      }

      // This listener is fired whenever a notification is received while the app is foregrounded
      notificationListener.current =
        Notifications.addNotificationReceivedListener((notification) => {
          // Doesn't do much now
          console.log(notification);
        });

      // This listener is fired whenever a user taps on or interacts with a notification (works when app is foregrounded, backgrounded, or killed)
      responseListener.current =
        Notifications.addNotificationResponseReceivedListener((response) => {
          // Doesn't do much now
          console.log(response);
        });

      state.setState({
        id,
        notificationToken: token,
        loadingMetaData: false,
      });
    })();

    return () => {
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(
          notificationListener.current
        );
      }

      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
    };
  }, []);

  if (state.loadingMetaData) {
    return (
      <View style={page.container}>
        <View>
          <Text>Loading Configuration...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <Header
        centerComponent={{ text: "MY TITLE", style: { color: "#fff" } }}
      />
      <NotificationList></NotificationList>
    </View>
  );
}

const page = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "space-around",
    padding: 24,
  },
});
