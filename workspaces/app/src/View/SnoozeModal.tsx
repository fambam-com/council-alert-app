import React, { useState, useEffect, useContext } from "react";
import { View, StyleSheet, TouchableHighlight, Alert } from "react-native";
import { Button, Overlay, Text, Icon } from "react-native-elements";
import StateContext from "../Context";
import { $post } from "../Util/Request";
import { NotificationDTO } from "../../../server/src/util/DBOperator";

export default function DetailModal({
  visible,
  notification: n,
  hideModal,
}: {
  visible: boolean | null;
  notification?: any;
  hideModal: () => void;
}) {
  const { id, getNotification } = useContext(StateContext);

  const isSnoozed = n && n.status === `scheduled` && !!n.scheduledTime;

  useEffect(() => {
    if (!visible && visible !== null) {
    }
  }, [visible]);

  const renderOption = (option: any) => {
    const { name, icon } = option;

    return (
      <TouchableHighlight
        activeOpacity={0.6}
        underlayColor="#DDDDDD"
        onPress={() =>
          Alert.alert("info", "Message", [
            {
              text: "ok",
              onPress: () => {
                hideModal();

                getNotification(id);
              },
            },
          ])
        }
      >
        <View
          style={{
            height: 70,
            alignItems: `center`,
            justifyContent: `center`,
            // backgroundColor: `lightgrey`,
            margin: 7,
          }}
        >
          <Icon name={icon} style={{ marginBottom: 5 }}></Icon>
          <Text>{name}</Text>
        </View>
      </TouchableHighlight>
    );
  };

  return (
    <View>
      <Overlay
        isVisible={!!visible}
        onBackdropPress={hideModal}
        overlayStyle={{ width: `100%`, maxWidth: 200 }}
      >
        <View>
          {renderOption({
            name: `2 hours later`,
            icon: `snooze`,
          })}

          {renderOption({
            name: `4 hours later`,
            icon: `snooze`,
          })}

          {renderOption({
            name: `Tomorrow Morning`,
            icon: `snooze`,
          })}

          {isSnoozed &&
            renderOption({
              name: `Cancel Snooze`,
              icon: `event-busy`,
            })}
        </View>
      </Overlay>
    </View>
  );
}
