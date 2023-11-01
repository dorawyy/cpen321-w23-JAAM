package com.example.chatcomponent321;

import androidx.annotation.NonNull;
import androidx.appcompat.app.AppCompatActivity;
import androidx.core.app.ActivityCompat;
import androidx.core.app.NotificationCompat;

import android.Manifest;
import android.app.AlarmManager;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.os.Build;
import android.os.Bundle;
import android.util.Log;
import android.view.View;
import android.widget.Button;
import android.widget.EditText;
import android.widget.Toast;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;
import java.util.ArrayList;

import com.google.android.gms.tasks.OnCompleteListener;
import com.google.android.gms.tasks.Task;
import com.google.firebase.messaging.FirebaseMessaging;

import java.util.Calendar;

public class MainActivity extends AppCompatActivity {

    private static final String TAG ="MainActivity";
    ArrayList<Integer> alarmHours = new ArrayList<>();
    ArrayList<Integer> alarmMinutes = new ArrayList<>();


    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);



//        Alarm Notification Button


        createNotificationChannel();

        Button alarmBtn = findViewById(R.id.alarmButton);

        alarmBtn.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {

                String jsonString = "{\"times\": [\"18:35\", \"19:53\"]}";

                parseTimeJSON(jsonString);

                alertTransitNotification(alarmHours.get(0), alarmMinutes.get(0));


//                for(int i=0;i<alarmHours.size();i++) {
//                    alertTransitNotification(alarmHours.get(i), alarmMinutes.get(i));
//                }

//                Toast.makeText(MainActivity.this, "Reminder Set!", Toast.LENGTH_SHORT).show();
//
//                Calendar calendar = Calendar.getInstance();
//                calendar.setTimeInMillis(System.currentTimeMillis());
//                calendar.set(Calendar.HOUR_OF_DAY, 19);
//                calendar.set(Calendar.MINUTE, 35);
//                calendar.set(Calendar.SECOND, 0);
//
//                Intent intent = new Intent(MainActivity.this, AlarmNotification.class);
//                PendingIntent pendingIntent = PendingIntent.getBroadcast(MainActivity.this, 0, intent, PendingIntent.FLAG_UPDATE_CURRENT);
//
//                AlarmManager alarmManager = (AlarmManager) getSystemService(Context.ALARM_SERVICE);
//                if (alarmManager != null) {
//                    alarmManager.setExact(AlarmManager.RTC_WAKEUP, calendar.getTimeInMillis(), pendingIntent);
//                }
            }

        });





//        Bus Route Notifications

        BusRouteProcessor busRouteProcessor = new BusRouteProcessor();
        busRouteProcessor.processBusRoutes(this);


        FirebaseMessaging.getInstance().getToken()
                .addOnCompleteListener(new OnCompleteListener<String>() {
                    @Override
                    public void onComplete(@NonNull Task<String> task) {
                        if (!task.isSuccessful()) {
                            Log.w(TAG, "Fetching FCM registration token failed", task.getException());
                            return;
                        }

                        // Get new FCM registration token
                        String token = task.getResult();

                        // Log and toast
//                        String msg = getString(R.string.msg_token_fmt, token);
                        Log.d(TAG, "FCM Device Registration Token: "+token);

//                        TOKEN

//                        fNgnfEh4RumbR4af-LLGkR:APA91bFb4pNSVMx80FugZSt8u4aLj4Z-LnlTSUC-xpFsqUO1gfLOVBhMElmbYiE76mC_ceyK7j8Db-HsxWrfS6BhW0YLRx3s4b7rwfCYjT537oDkQ69_T1Vm-zVhfWq99XZODm_sWeXO
//                        Toast.makeText(MainActivity.this, "FCM Device Registration Token: "+token, Toast.LENGTH_SHORT).show();
                    }
                });


        if (ActivityCompat.checkSelfPermission(this, Manifest.permission.READ_EXTERNAL_STORAGE)
                != PackageManager.PERMISSION_GRANTED)
            ActivityCompat.requestPermissions(this, new String[]{Manifest.permission.READ_EXTERNAL_STORAGE}, 10);


        EditText editText = findViewById(R.id.editText);

        findViewById(R.id.enterBtn)
                .setOnClickListener(v -> {

                    Intent intent = new Intent(this, ChatActivity.class);
                    intent.putExtra("name", editText.getText().toString());
                    startActivity(intent);

                });

    }

    private void createNotificationChannel(){

        if(Build.VERSION.SDK_INT >= Build.VERSION_CODES.O){
            CharSequence name = "TransitTrack";
            String description = "Channel for TransitTrack";

            int importance = NotificationManager.IMPORTANCE_DEFAULT;

            NotificationChannel channel = new NotificationChannel("notifyTransit", name, importance);
            channel.setDescription(description);

            NotificationManager notificationManager = getSystemService(NotificationManager.class);
            notificationManager.createNotificationChannel(channel);
        }
    }


    private void alertTransitNotification(int hours, int minutes){

        Toast.makeText(MainActivity.this, "Reminder Set for "+ hours + ": " + minutes, Toast.LENGTH_SHORT).show();

        Calendar calendar = Calendar.getInstance();
        calendar.setTimeInMillis(System.currentTimeMillis());
        calendar.set(Calendar.HOUR_OF_DAY, hours);
        calendar.set(Calendar.MINUTE, minutes);
        calendar.set(Calendar.SECOND, 0);

        Intent intent = new Intent(MainActivity.this, AlarmNotification.class);
        PendingIntent pendingIntent = PendingIntent.getBroadcast(MainActivity.this, 0, intent, PendingIntent.FLAG_ONE_SHOT | PendingIntent.FLAG_IMMUTABLE);

        AlarmManager alarmManager = (AlarmManager) getSystemService(Context.ALARM_SERVICE);
        if (alarmManager != null) {
            alarmManager.setExact(AlarmManager.RTC_WAKEUP, calendar.getTimeInMillis(), pendingIntent);
        }
    }


    private void parseTimeJSON(String jsonString) {
        try {

            // Convert the JSON string to a JSONObject
            JSONObject jsonObject = new JSONObject(jsonString);

            // Get the 'times' array from the JSON object
            JSONArray timesArray = jsonObject.getJSONArray("times");

            // Loop through the 'times' array to extract hours and minutes
            for (int i = 0; i < timesArray.length(); i++) {
                String time = timesArray.getString(i);
                String[] timeParts = time.split(":");

                // Assuming the time is in "HH:MM" format
                if (timeParts.length == 2) {
                    int hour = Integer.parseInt(timeParts[0]);
                    int minute = Integer.parseInt(timeParts[1]);

                    alarmHours.add(hour);
                    alarmMinutes.add(minute);
                }
            }

            // Print or use the extracted data as needed
            // For example, printing the arrays
            for (int i = 0; i < alarmHours.size(); i++) {
//                Log.d(TAG, "Alarm Time " + (i + 1) + ": " + alarmHours.get(i) + ":" + alarmMinutes.get(i));
                Log.d(TAG, "Alarm Hours: "+ alarmHours.get(i));
                Log.d(TAG, "Alarm Minutes: "+ alarmMinutes.get(i));
            }


            // Use 'alarmHours' and 'alarmMinutes' ArrayLists as needed
        } catch (JSONException e) {
            e.printStackTrace();
        }
    }
}