import React, { useState } from "react";
import { StyleSheet, Dimensions, View } from "react-native";
import { ListItem, Text, Button, Badge, Image } from "react-native-elements";
import { millisecondsToStr } from "../Util/Index";

export default function NotificationRow({
  item: n,
  setSnoozeModalInfo,
  setDetailModalInfo,
}: {
  item: any;
  setSnoozeModalInfo: any;
  setDetailModalInfo: any;
}) {
  const [key, setKey] = useState(n._id.valueOf().toString());

  const timeDiff = new Date().getTime() - n.createdTime;
  const timeDiffStr = millisecondsToStr(timeDiff);

  const isUrgent = n.importance === `urgent`;
  const isProposal = n._type === `proposal`;
  const isSnoozed = n.status === `scheduled` && !!n.scheduledTime;

  let subject = n.subject || ``;

  if (isProposal) {
    subject = `Proposal ${n.method}`;
  }

  if (isUrgent) {
    subject = subject?.replace("(URGENT)", "");
  }

  const screenWidth = Dimensions.get("window").width;

  return (
    <ListItem.Swipeable
      key={key}
      onPress={() => {
        setDetailModalInfo({
          visible: true,
          notification: n,
        });
      }}
      bottomDivider
      leftContent={
        <Button
          title="Info"
          icon={{ name: "info", color: "white" }}
          buttonStyle={{ minHeight: "100%", backgroundColor: `black` }}
          onPress={() => {
            // Workaround: reset/recenter this swipeable row
            setKey(key + 1);

            setDetailModalInfo({
              visible: true,
              notification: n,
            });
          }}
        />
      }
      rightContent={
        <Button
          onPress={() => {
            // Workaround: reset/recenter this swipeable row
            setKey(key + 1);

            setSnoozeModalInfo({
              visible: true,
              notification: n,
            });
          }}
          title="Snooze"
          icon={{ name: "snooze", color: "white" }}
          buttonStyle={{ minHeight: "100%", backgroundColor: `black` }}
        />
      }
    >
      <ListItem.Content>
        <View style={styles.subtitleView}>
          <View style={{ flex: 2, flexDirection: `row` }}>
            <Text style={{ color: `grey` }}>{subject}</Text>
            {isUrgent && (
              <Badge
                badgeStyle={{ marginLeft: 3 }}
                status="error"
                value="URGENT"
              />
            )}

            {isSnoozed && (
              <Badge
                badgeStyle={{ marginLeft: 3, backgroundColor: `black` }}
                value="SNOOZED"
              />
            )}
          </View>
          <View style={{ flex: 1, flexDirection: `row-reverse` }}>
            <Text style={{ color: `grey` }}>{timeDiffStr}</Text>
          </View>
        </View>
        <ListItem.Title>{n.content}</ListItem.Title>
      </ListItem.Content>
    </ListItem.Swipeable>
  );
}

const styles = StyleSheet.create({
  subtitleView: {
    justifyContent: `space-between`,
    flexDirection: `row`,
  },
});
