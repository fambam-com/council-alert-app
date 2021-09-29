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
  notification?: NotificationDTO;
  hideModal: () => void;
}) {
  const { id, getNotification } = useContext(StateContext);

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
            width: 100,
            height: 70,
            alignItems: `center`,
            justifyContent: `center`,
            // backgroundColor: `lightgrey`,
            margin: 7,
          }}
        >
          <Icon name={icon}></Icon>
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
        overlayStyle={{ width: `100%`, maxWidth: 250 }}
      >
        <View style={{ flexDirection: `row`, flexWrap: `wrap` }}>
          {renderOption({
            name: `2 hours later`,
            icon: `rowing`,
          })}
          {renderOption({
            name: `4 hours later`,
            icon: `rowing`,
          })}
          {renderOption({
            name: `4 hours later`,
            icon: `rowing`,
          })}
        </View>
      </Overlay>
    </View>
  );
}
