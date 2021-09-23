import React, { useState } from "react";
import { StyleSheet, Dimensions, View } from "react-native";
import { NotificationDTO } from "../../../server/src/util/DBOperator";
import { ListItem, Text, Button, Badge } from "react-native-elements";

export default function NotificationRow({
  item: n,
  setSnoozeModalInfo,
}: {
  item: NotificationDTO;
  setSnoozeModalInfo: any;
}) {
  const [key, setKey] = useState(n._id.valueOf().toString());

  const timeDiff = new Date().getTime() - n.createdTime;
  const timeDiffStr = millisecondsToStr(timeDiff);

  const isUrgent = n.importance === `urgent`;

  let subject = n.subject || ``;

  if (isUrgent) {
    subject = subject?.replace("(URGENT)", "");
  }

  const screenWidth = Dimensions.get("window").width;

  return (
    <ListItem.Swipeable
      key={key}
      onPress={() => {}}
      bottomDivider
      // leftContent={
      //   <Button
      //     title="Info"
      //     icon={{ name: "info", color: "white" }}
      //     buttonStyle={{ minHeight: "100%" }}
      //   />
      // }
      rightContent={
        <Button
          onPress={() => {
            // Workaround: reset/recenter this swipeable row
            setKey(key + 1);

            setSnoozeModalInfo({
              snoozeModalVisible: true,
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

function millisecondsToStr(milliseconds: number) {
  // TIP: to find current time in milliseconds, use:
  // var  current_time_milliseconds = new Date().getTime();

  function numberEnding(number: number) {
    return number > 1 ? "s" : "";
  }

  var temp = Math.floor(milliseconds / 1000);
  var years = Math.floor(temp / 31536000);
  if (years) {
    return years + " year" + numberEnding(years);
  }
  //TODO: Months! Maybe weeks?
  var days = Math.floor((temp %= 31536000) / 86400);
  if (days) {
    return days + " day" + numberEnding(days);
  }
  var hours = Math.floor((temp %= 86400) / 3600);
  if (hours) {
    return hours + " hr" + numberEnding(hours);
  }
  var minutes = Math.floor((temp %= 3600) / 60);
  if (minutes) {
    return minutes + " min" + numberEnding(minutes);
  }
  var seconds = temp % 60;
  if (seconds) {
    return seconds + " sec" + numberEnding(seconds);
  }
  return "just now"; //'just now' //or other string you like;
}
