const fetch = require('node-fetch');


async function sendNotification(arg) {

  const { deviceIds, message, title } = arg;

  let notifications = [];
  let result =[];
  for (let pushToken of deviceIds) {  
    const fcmResponse = await fetch('https://fcm.googleapis.com/fcm/send', { 
      method: 'POST',
      headers: { 
      'Content-Type': 'application/json', 
      'Authorization': 'key=AAAAkNMMP9I:APA91bF85pNwFnB6R2DZjtBqZb7Ub4YwDn4apT4x5IhJS1n0jmFdVblfdVE-jEjZdOylJfN5VtxCZVWQIrjCA7WlPlDUeioF3r0zYjWtwH7jAHwCPJxmqhbiTmesoA0usFNweAjk6BOM',
      'project_id': 'sacoapp2020-d6be7' },
      body: JSON.stringify({
         to: pushToken,
         notification: { title, message },
         }),
        });
      const fcmResponseJSON = await fcmResponse.json();
      result.push(fcmResponseJSON);
  }
  console.log({error: false, data: result}); 
  // for (let pushToken of deviceIds) {
    
  //   if (!Expo.isExpoPushToken(pushToken)) {
  //     console.error(`Push token ${pushToken} is not a valid Expo push token`);
  //     continue;
  //   }
  //   notifications.push({
  //     to: pushToken,
  //     sound: 'default',
  //     title: title,
  //     body: message,
  //     data: data,
  //     navigate: 'ChatBox'
  //   })
  // }

  // let chunks = expo.chunkPushNotifications(notifications);
  // (async () => {
  //   for (let chunk of chunks) {
  //     try {
  //       let receipts = await expo.sendPushNotificationsAsync(chunk);
  //       console.log(receipts);
  //     } catch (error) {
  //       console.error(error);
  //     }
  //   }
  // })();

}

module.exports.sendNotification = sendNotification;
