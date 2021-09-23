import React, { useRef, useState, useEffect, useContext } from "react";
import { View, StyleSheet, FlatList, AppState } from "react-native";
import { ListItem, Text, Button, Badge } from "react-native-elements";
import StateContext from "../Context";
import { $post } from "../Util/Request";
import { NotificationDTO } from "../../../server/src/util/DBOperator";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import NotificationRow from "./NotificationRow";
import SnoozeModal from "./SnoozeModal";

export default function NotificationList() {
  const { id, notificationToken, user, setState, getNotification } =
    useContext(StateContext);

  const appState = useRef(AppState.currentState);

  const [snoozeModalInfo, setSnoozeModalInfo] = useState({
    snoozeModalVisible: null,
    notification: undefined,
  } as {
    snoozeModalVisible: boolean | null;
    notification?: NotificationDTO;
  });

  const appStateListener = (nextAppState: any) => {
    if (
      appState.current.match(/inactive|background/) &&
      nextAppState === "active"
    ) {
      getNotification(id);
    }

    appState.current = nextAppState;
  };

  const getDeviceInfo = () => {
    return {
      isDevice: Device.isDevice,
      brand: Device.brand,
      manufacturer: Device.manufacturer,
      modelName: Device.modelName,
      deviceName: Device.deviceName,
    };
  };

  useEffect(() => {
    (async () => {
      const response = await $post(`/user`, {
        ...getDeviceInfo(),
        token: notificationToken,
        id,
      });

      if (response) {
        const { data: userInfo } = response;

        setState({
          user: userInfo,
        });
      }
    })();

    AppState.addEventListener("change", appStateListener);

    return () => {
      AppState.removeEventListener("change", appStateListener);
    };
  }, []);

  if (!user) {
    return (
      <View style={styles.container}>
        <Text>Loading Data...</Text>
      </View>
    );
  }

  const { notifications } = user;

  const _testBtn = () => {
    return (
      <View>
        <Button
          title="TEST"
          onPress={() => {
            const content = { title: "I am a one, hasty notification." };

            Notifications.scheduleNotificationAsync({ content, trigger: null });
          }}
        ></Button>
      </View>
    );
  };

  const renderEmptyNotification = () => {
    return (
      <View
        style={{
          flex: 1,
          display: `flex`,
          alignItems: "center",
          justifyContent: "space-around",
          marginTop: 30,
        }}
      >
        <View>
          <Text>Only display notifications within 7 days</Text>
        </View>

        <View
          style={{
            flex: 1,
            marginTop: 20,
          }}
        >
          <Button
            title="Refresh"
            onPress={() => {
              getNotification(id);
            }}
          />

          {/* {_testBtn()} */}
        </View>
      </View>
    );
  };

  return (
    <View
      style={{
        flex: 1,
        paddingBottom: 24,
        paddingLeft: 12,
        paddingRight: 12,
      }}
    >
      <FlatList
        keyExtractor={(n) => n._id.valueOf().toString()}
        data={notifications}
        renderItem={({ item }) => (
          <NotificationRow
            item={item}
            setSnoozeModalInfo={setSnoozeModalInfo}
          ></NotificationRow>
        )}
        ListEmptyComponent={renderEmptyNotification()}
      ></FlatList>

      <SnoozeModal
        visible={snoozeModalInfo.snoozeModalVisible}
        notification={snoozeModalInfo.notification}
        hideModal={() => {
          setSnoozeModalInfo({
            snoozeModalVisible: false,
            notification: undefined,
          });
        }}
      ></SnoozeModal>

      {/* <DetailModal
        visible={detailModalInfo.detailModalVisible}
        notification={detailModalInfo.notification}
        hideModal={() => {
          setDetailModalInfo({
            detailModalVisible: false,
            notification: undefined,
          });
        }}
      ></DetailModal> */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "space-around",
    padding: 24,
  },
});
