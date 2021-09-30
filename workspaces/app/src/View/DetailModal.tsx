import React, { useState, useEffect, useContext } from "react";
import { View, StyleSheet } from "react-native";
import { Divider, Overlay, Text } from "react-native-elements";
import StateContext from "../Context";
import { $post } from "../Util/Request";
import * as Linking from "expo-linking";
import { millisecondsToStr } from "../Util/Index";

export default function DetailModal({
  visible,
  notification: n,
  hideModal,
}: {
  visible: boolean | null;
  notification: any;
  hideModal: () => void;
}) {
  if (!visible || !n) {
    return <View></View>;
  }

  const isProposal = n._type === `proposal`;
  const isUrgent = n.importance === `urgent`;
  const isSnoozed = n.status === `scheduled` && !!n.scheduledTime;

  const onLinkPress = (url: string) => {
    Linking.openURL(url);
  };

  const renderLinks = (links: any) => {
    if (Array.isArray(links) && links.length > 0) {
      return (
        <View>
          <Divider style={{ marginBottom: 5 }}></Divider>
          {links.map((l) => (
            <Text
              h4
              onPress={() => onLinkPress(l.url)}
              key={l.name}
              style={{
                color: `blue`,
                textDecorationLine: `underline`,
                fontWeight: `bold`,
                marginBottom: 10,
              }}
            >
              {l.name}
            </Text>
          ))}
        </View>
      );
    }

    return <View></View>;
  };

  const renderSnoozeInfo = () => {
    if (!isSnoozed) {
      return undefined;
    }

    const timeDiff = n.scheduledTime - new Date().getTime();
    const timeDiffStr = millisecondsToStr(timeDiff, true);

    return (
      <View style={{ backgroundColor: `black`, alignItems: `center` }}>
        <Text style={{ color: `white`, fontWeight: `bold` }}>
          {`Snoozed until ${timeDiffStr} later`}
        </Text>
      </View>
    );
  };

  const renderContent = () => {
    const links =
      n.link ||
      [
        // {
        //   name: `Expo`,
        //   url: `https://expo.dev`,
        // },
        // {
        //   name: `Google`,
        //   url: `https://google.com`,
        // },
      ];

    if (isProposal) {
      return (
        <View>
          {renderSnoozeInfo()}
          <Text style={{ marginBottom: 10, marginTop: 10 }}>
            Please click the link to view detail
          </Text>
          {renderLinks(links)}
        </View>
      );
    }

    return (
      <View>
        {isUrgent && (
          <View style={{ backgroundColor: `red`, alignItems: `center` }}>
            <Text style={{ color: `white`, fontWeight: `bold` }}>URGENT</Text>
          </View>
        )}

        {renderSnoozeInfo()}

        <View style={{ marginBottom: 10, marginTop: 10 }}>
          <Text>{n.content}</Text>
        </View>

        {renderLinks(links)}
      </View>
    );
  };

  return (
    <View>
      <Overlay
        overlayStyle={{ width: `80%` }}
        isVisible={!!visible}
        onBackdropPress={hideModal}
      >
        {renderContent()}
      </Overlay>
    </View>
  );
}
