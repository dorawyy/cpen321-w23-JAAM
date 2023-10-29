package com.example.chatcomponent321;

import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.media.RingtoneManager;
import android.net.Uri;
import android.os.Build;
import android.os.Handler;
import android.os.Looper;
import android.util.Log;
import android.widget.Toast;
import android.view.LayoutInflater;
import androidx.core.app.NotificationCompat;
import com.google.firebase.messaging.FirebaseMessagingService;
import com.google.firebase.messaging.RemoteMessage;
import org.json.JSONException;
import org.json.JSONObject;


import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.media.RingtoneManager;
import android.net.Uri;
import android.os.Build;

import androidx.core.app.NotificationCompat;

import com.google.firebase.messaging.FirebaseMessagingService;
import com.google.firebase.messaging.RemoteMessage;

public class MyFirebaseMessagingService extends FirebaseMessagingService {

    private static final String TAG ="MyFirebaseMessagingService";

    @Override
    public void onMessageReceived(RemoteMessage remoteMessage) {
        if (remoteMessage.getNotification() != null) {
            // Handle FCM message with a notification payload.
            String messageBody = remoteMessage.getNotification().getBody();
            Log.d(TAG, "Received FCM message: " + messageBody);
            sendNotification(messageBody);
        }


        // You can also add handling for data payloads if needed.
    }

    private void sendNotification(String messageBody) {
        Intent intent = new Intent(this, MainActivity.class);
        intent.addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP);
        PendingIntent pendingIntent = PendingIntent.getActivity(this, 0, intent, PendingIntent.FLAG_ONE_SHOT | PendingIntent.FLAG_IMMUTABLE);

        String channelId = "fcm_default_channel";
        Uri defaultSoundUri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION);
        NotificationCompat.Builder notificationBuilder =
                new NotificationCompat.Builder(this, channelId)
                        .setSmallIcon(R.mipmap.ic_launcher)
                        .setContentTitle("FCM Message")
                        .setContentText(messageBody)
                        .setAutoCancel(true)
                        .setSound(defaultSoundUri)
                        .setContentIntent(pendingIntent);

        NotificationManager notificationManager =
                (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);

        // Since Android Oreo, notification channels are needed.
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                    channelId,
                    "Channel human-readable title",
                    NotificationManager.IMPORTANCE_DEFAULT
            );
            notificationManager.createNotificationChannel(channel);
        }

        notificationManager.notify(0, notificationBuilder.build());
    }
}


//public class MyFirebaseMessagingService extends FirebaseMessagingService {
//
//    private static final String TAG ="MyFirebaseMessagingService";
//
////
////    LayoutInflater inflater = LayoutInflater.from(this);
////    MessageAdapter messageAdapter = new MessageAdapter(inflater);
////    JSONObject message = messageAdapter.getMessage(0);
//
//    @Override
//    public void onMessageReceived(RemoteMessage remoteMessage) {
//        // TODO(developer): Handle FCM messages here.
//        // Not getting messages here? See why this may be: https://goo.gl/39bRNJ
//        Log.d(TAG, "From: " + remoteMessage.getFrom());
//
//        // Check if message contains a notification payload.
//        if (remoteMessage.getNotification() != null) {
//            Log.d(TAG, "Message Notification Body: " + remoteMessage.getNotification().getBody());
//        }
//
//        sendNotification(remoteMessage.getNotification().getBody());
//
////        Notification for Route
//
//
//        /*
//
//   [
//   {
//      "Start":{
//         "Stop":"Northbound King George Blvd @ 60 Ave",
//         "Lat":49.112374,
//         "Long":-122.840708,
//         "Time":"07:07",
//         "Bus":"394"
//      },
//      "End":{
//         "Stop":"King George Station @ Bay 2",
//         "Lat":49.183124,
//         "Long":-122.845136,
//         "Time":"07:25",
//         "Bus":"394"
//      }
//   },
//   {
//      "Start":{
//         "Stop":"King George Station @ Platform 1",
//         "Lat":49.182812,
//         "Long":-122.844691,
//         "Time":"07:32",
//         "Bus":"Expo Line"
//      },
//      "End":{
//         "Stop":"Joyce-Collingwood Station @ Platform 1",
//         "Lat":49.23843,
//         "Long":-123.031759,
//         "Time":"07:58",
//         "Bus":"Expo Line"
//      }
//   },
//   {
//      "Start":{
//         "Stop":"Joyce Station @ Bay 4",
//         "Lat":49.237907,
//         "Long":-123.031047,
//         "Time":"08:06",
//         "Bus":"R4"
//      },
//      "End":{
//         "Stop":"UBC Exchange @ Bay 1",
//         "Lat":49.267415,
//         "Long":-123.247954,
//         "Time":"08:54",
//         "Bus":"R4"
//      }
//   }
//]
//         */
//
//
//
//
////        try {
////            Log.d(TAG, "Expected Notification Obj: "+ message.getString("message"));
////        } catch (JSONException e) {
////            throw new RuntimeException(e);
////        }
//
//
////        // Check if message contains a data payload.
////        if (remoteMessage.getData().size() > 0) {
////            Log.d(TAG, "Message data payload: " + remoteMessage.getData());
////
////            if (/* Check if data needs to be processed by long running job */ true) {
////                // For long-running tasks (10 seconds or more) use WorkManager.
////                scheduleJob();
////            } else {
////                // Handle message within 10 seconds
////                handleNow();
////            }
////
////        }
//
//
//        // Also if you intend on generating your own notifications as a result of a received FCM
//        // message, here is where that should be initiated. See sendNotification method below.
//
////        sendNotification(remoteMessage.getFrom(), remoteMessage.getNotification().getBody());
//
//
//
//
//
//    }
//
////    private void sendNotification(String from, String body) {
////
////        new Handler(Looper.getMainLooper()).post(new Runnable(){
////
////            @Override
////            public void run(){
////                Toast.makeText(MyFirebaseMessagingService.this.getApplicationContext(),
////                        from + "-> "+ body, Toast.LENGTH_SHORT).show();
////
////            }
////        });
////    }
//
//    private void sendNotification(String messageBody) {
//
//        Intent intent = new Intent(this, MainActivity.class);
//        intent.addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP);
//        PendingIntent pendingIntent = PendingIntent.getActivity(this, 0 /* Request code */, intent,
//                PendingIntent.FLAG_IMMUTABLE);
//
//
//        String channelId = "fcm_default_channel";
//        Uri defaultSoundUri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION);
//        NotificationCompat.Builder notificationBuilder =
//                new NotificationCompat.Builder(this, channelId)
//                        .setSmallIcon(R.mipmap.ic_launcher)
//                        .setContentTitle("FCM Message")
//                        .setContentText(messageBody)
//                        .setAutoCancel(true)
//                        .setSound(defaultSoundUri)
//                        .setContentIntent(pendingIntent);
//
//        NotificationManager notificationManager =
//                (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
//
//        // Since android Oreo notification channel is needed.
//        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
//            NotificationChannel channel = new NotificationChannel(channelId,
//                    "Channel human readable title",
//                    NotificationManager.IMPORTANCE_DEFAULT);
//            notificationManager.createNotificationChannel(channel);
//        }
//
//        notificationManager.notify(0 /* ID of notification */, notificationBuilder.build());
//    }
//
//
//}
