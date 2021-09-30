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
  const { id, getNotification, snoozeNotification } = useContext(StateContext);

  const isSnoozed = n && n.status === `scheduled` && !!n.scheduledTime;

  useEffect(() => {
    if (!visible && visible !== null) {
    }
  }, [visible]);

  const onSnooze = async (option: any) => {
    const { key } = option;

    let scheduledUntil = null;

    const now = new Date().getTime();

    switch (key) {
      case `2hrlater`:
        scheduledUntil = new Date().setTime(now + 2 * 60 * 60 * 1000);
        break;
      case `4hrlater`:
        scheduledUntil = new Date().setTime(now + 4 * 60 * 60 * 1000);
        break;
      case `tomorrow10am`:
        const d = new Date();
        d.setDate(d.getDate() + 1);
        d.setHours(10);
        d.setMinutes(0);
        d.setMilliseconds(0);

        scheduledUntil = d.getTime();
        break;
      case `cancel`:
        scheduledUntil = null;
        break;

      default:
        break;
    }

    await snoozeNotification({
      userId: id,
      notificationKey: n._key,
      snoozedUntil: scheduledUntil,
    });

    getNotification(id);

    hideModal();
  };

  const renderOption = (option: any) => {
    const { name, icon } = option;

    return (
      <TouchableHighlight
        activeOpacity={0.6}
        underlayColor="#DDDDDD"
        onPress={() => onSnooze(option)}
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
            key: `2hrlater`,
            name: `2 hours later`,
            icon: `snooze`,
          })}

          {renderOption({
            key: `4hrlater`,
            name: `4 hours later`,
            icon: `snooze`,
          })}

          {renderOption({
            key: `tomorrow10am`,
            name: `Tomorrow 10am`,
            icon: `snooze`,
          })}

          {isSnoozed &&
            renderOption({
              key: `cancel`,
              name: `Cancel Snooze`,
              icon: `event-busy`,
            })}
        </View>
      </Overlay>
    </View>
  );
}
