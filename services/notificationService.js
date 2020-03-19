const { Expo } = require('expo-server-sdk');
let expo = new Expo();


async function sendNotification(arg) {

  const { deviceIds, data, message, title } = arg;

  let notifications = [];

  for (let pushToken of deviceIds) {
    
    if (!Expo.isExpoPushToken(pushToken)) {
      console.error(`Push token ${pushToken} is not a valid Expo push token`);
      continue;
    }
    notifications.push({
      to: pushToken,
      sound: 'default',
      title: title,
      body: message,
      data: data,
      navigate: 'ChatBox'
    })
  }

  let chunks = expo.chunkPushNotifications(notifications);
  (async () => {
    for (let chunk of chunks) {
      try {
        let receipts = await expo.sendPushNotificationsAsync(chunk);
        console.log(receipts);
      } catch (error) {
        console.error(error);
      }
    }
  })();

}

module.exports.sendNotification = sendNotification;
