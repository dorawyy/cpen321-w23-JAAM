package com.example.chatcomponent321;

import android.app.AlarmManager;
import android.app.PendingIntent;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;

import org.json.JSONArray;
import org.json.JSONObject;

public class BusRouteProcessor {

    // Sample JSON data as a string
    private static final String busRouteJSON = "Your JSON Data Here";

    public void processBusRoutes(Context context) {
        try {
            JSONArray routes = new JSONArray(busRouteJSON);

            for (int i = 0; i < routes.length(); i++) {
                JSONObject journey = routes.getJSONObject(i);

                JSONObject start = journey.getJSONObject("Start");
                String startStop = start.getString("Stop");
                String startTime = start.getString("Time");

                JSONObject end = journey.getJSONObject("End");
                String endStop = end.getString("Stop");
                String endTime = end.getString("Time");

                // Log the first and last stops
                String logMessage = "Journey " + (i + 1) + " - First Stop: " + startStop + ", Last Stop: " + endStop;
                // You can store 'logMessage' in a variable or display it to the user as needed.

                // Schedule a notification for the first stop (5 minutes before start time)
                scheduleNotification(context, startStop, startTime, logMessage);

                // Schedule a notification for the last stop (5 minutes before end time)
                scheduleNotification(context, endStop, endTime, logMessage);
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    private void scheduleNotification(Context context, String stop, String time, String logMessage) {
        // Convert time to milliseconds (assuming time is in "HH:mm" format)
        String[] timeParts = time.split(":");
        int hours = Integer.parseInt(timeParts[0]);
        int minutes = Integer.parseInt(timeParts[1]);
        long notificationTime = System.currentTimeMillis() + ((hours * 60 + minutes - 5) * 60 * 1000);

        // Create an intent to handle the notification
        Intent intent = new Intent(context, NotificationReceiver.class);
        intent.putExtra("message", logMessage);

        PendingIntent pendingIntent = PendingIntent.getBroadcast(context, 0, intent, PendingIntent.FLAG_UPDATE_CURRENT);

        // Schedule the notification using AlarmManager
        AlarmManager alarmManager = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
        alarmManager.set(AlarmManager.RTC_WAKEUP, notificationTime, pendingIntent);
    }

    public static class NotificationReceiver extends BroadcastReceiver {
        @Override
        public void onReceive(Context context, Intent intent) {
            // Retrieve the message and display a notification
            String message = intent.getStringExtra("message");
            // You can use the message to display a notification to the user.
        }
    }
}
