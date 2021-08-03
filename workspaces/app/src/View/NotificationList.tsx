import React, { useEffect, useContext } from "react";
import { View, StyleSheet, Platform } from "react-native";
import { Button, Text } from "react-native-elements";
import StateContext from "../Context";
import { useState } from "react";
import { $post } from "../Util/Request";

export default function NotificationList() {
  const { id, notificationToken, user, setState } = useContext(StateContext);
  // const [loading, setLoading] = useState(true)

  useEffect(() => {
    (async () => {
      const response = await $post(`/user`, {
        token: notificationToken,
        id,
      });

      if (response) {
        const { data: userInfo } = response;

        console.log(userInfo);

        setState({
          user: userInfo,
        });
      }
    })();
  }, []);

  if (!user) {
    return (
      <View>
        <Text>Loading Data...</Text>
      </View>
    );
  }

  const { notifications } = user;

  return <View></View>;
}
