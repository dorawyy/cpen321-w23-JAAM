package com.example.chatcomponent321;

import androidx.annotation.NonNull;
import androidx.appcompat.app.AppCompatActivity;
import androidx.core.app.ActivityCompat;
import androidx.core.app.NotificationCompat;

import android.Manifest;
import android.annotation.SuppressLint;
import android.app.AlarmManager;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
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

    private Handler handler;
    private Runnable timeChecker;


    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);



//        Alarm Notification Button


        createNotificationChannel();

        Button timeBtn = findViewById(R.id.timeBtn);

        timeBtn.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
//                Calendar currentTime = Calendar.getInstance();
//
//                // Get hours and minutes from the current time
//                int notifyHours = currentTime.get(Calendar.HOUR_OF_DAY);
//                Log.d(TAG, "Current Hour: "+ notifyHours);
//                int notifyMinutes = currentTime.get(Calendar.MINUTE);
//                Log.d(TAG, "Current Minute: "+notifyMinutes);

                logTimeChanges();




            }
        });

        Button alarmBtn = findViewById(R.id.alarmButton);



        alarmBtn.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {

                String jsonString = "{\"times\": [\"22:54\", \"19:53\"]}";

                parseTimeJSON(jsonString);

                alertTransitNotification(alarmHours.get(0), alarmMinutes.get(0));

            }

        });


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

                        Log.d(TAG, "FCM Device Registration Token: "+token);
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

    @Override
    protected void onResume() {
        super.onResume();
        startLoggingTime();
    }

    @Override
    protected void onPause() {
        super.onPause();
        stopLoggingTime();
    }

    private void startLoggingTime() {
        handler = new Handler();
        timeChecker = new Runnable() {
            @Override
            public void run() {
                logTimeChanges();
                handler.postDelayed(this, 60000); // Check every minute (60,000 milliseconds)
            }
        };
        handler.postDelayed(timeChecker, 0); // Start immediately
    }

    private void stopLoggingTime() {
        handler.removeCallbacks(timeChecker);
    }

    private void logTimeChanges() {
        Calendar currentTime = Calendar.getInstance();

        int notifyHours = currentTime.get(Calendar.HOUR_OF_DAY);
        int notifyMinutes = currentTime.get(Calendar.MINUTE);

        Log.d(TAG, "Current Time: " + notifyHours + ":" + notifyMinutes);
    }



    @SuppressLint("ScheduleExactAlarm")
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