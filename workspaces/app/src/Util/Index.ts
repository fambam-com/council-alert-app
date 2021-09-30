export function millisecondsToStr(
  milliseconds: number,
  detail: boolean = false
) {
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

  var days = Math.floor((temp %= 31536000) / 86400);
  if (days) {
    return days + " day" + numberEnding(days);
  }

  var hours = Math.floor((temp %= 86400) / 3600);
  if (hours) {
    const hoursStr = hours + " hr" + numberEnding(hours);

    const minutes = Math.floor((temp %= 3600) / 60);

    if (!detail || !minutes) {
      return hoursStr;
    }

    return `${hoursStr} ${minutes + " min" + numberEnding(minutes)}`;
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
