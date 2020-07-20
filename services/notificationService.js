const fetch = require('node-fetch');


async function sendNotification(arg) {

  const { deviceIds, message, title } = arg;
  let result =[];
  for (let pushToken of deviceIds) {  
    const fcmResponse = await fetch('https://fcm.googleapis.com/fcm/send', { 
      method: 'POST',
      headers: { 
      'Content-Type': 'application/json', 
      'Authorization': 'key=AAAAb962VmA:APA91bG2F1SCLr4VS87EQoFdm735Wk7sI2jgkB1GTneyixs-ns6JkUopy6N_kup5ik6-iTvy2kzgzY28FtjIVkJF0bF_sXRGW_L5F1Fnzj6N4TK_dT1CfQFaFD87F15v3_yZ6mthIrvj',
      'project_id': 'hotta-app' },
      body: JSON.stringify({
         to: pushToken,
         notification: { title, message,"sound" : "default" },
         }),
        });
      const fcmResponseJSON = await fcmResponse.json();
      result.push(fcmResponseJSON);
  }
  //console.log({error: false, data: result}); 
  console.log(result); 
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
