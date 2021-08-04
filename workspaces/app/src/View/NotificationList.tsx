import React, { useEffect, useContext } from "react";
import { View, StyleSheet, FlatList } from "react-native";
import { ListItem, Text } from "react-native-elements";
import StateContext from "../Context";
import { useState } from "react";
import { $post } from "../Util/Request";
import { NotificationDTO } from "../../../server/src/util/DBOperator";

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

        setState({
          user: userInfo,
        });
      }
    })();
  }, []);

  if (!user) {
    return (
      <View style={styles.container}>
        <Text>Loading Data...</Text>
      </View>
    );
  }

  const { notifications } = user;

  const renderNotification = ({ item: n }: { item: NotificationDTO }) => {
    const timeDiff = new Date().getTime() - n.createdTime;
    const timeDiffStr = millisecondsToStr(timeDiff);

    return (
      <ListItem bottomDivider>
        <ListItem.Content>
          <View style={styles.subtitleView}>
            <View style={{ flex: 1 }}>
              <Text style={{ color: `grey` }}>{n.subject}</Text>
            </View>
            <View style={{ flex: 1, flexDirection: `row-reverse` }}>
              <Text style={{ color: `grey` }}>{timeDiffStr}</Text>
            </View>
          </View>
          <ListItem.Title>{n.content}</ListItem.Title>
        </ListItem.Content>
      </ListItem>
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
        renderItem={renderNotification}
      ></FlatList>
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
