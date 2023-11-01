package com.jaam.transittrack;

import androidx.activity.result.ActivityResultCallback;
import androidx.activity.result.ActivityResultLauncher;
import androidx.activity.result.contract.ActivityResultContracts;
import androidx.appcompat.app.AppCompatActivity;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;

import android.Manifest;
import android.accounts.Account;
import android.accounts.AccountManager;
import android.annotation.SuppressLint;
import android.app.Activity;
import android.app.AlarmManager;
import android.app.AlertDialog;
import android.app.Dialog;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.DialogInterface;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.location.Address;
import android.location.Geocoder;
import android.net.ConnectivityManager;
import android.net.NetworkInfo;
import android.os.AsyncTask;
import android.os.Build;
import android.os.Bundle;
import android.util.Log;
import android.view.View;
import android.widget.Button;
import android.widget.Toast;

import com.google.android.gms.auth.api.signin.GoogleSignIn;
import com.google.android.gms.common.ConnectionResult;
import com.google.android.gms.common.GoogleApiAvailability;
import com.google.android.gms.common.GooglePlayServicesUtil;
import com.google.api.client.googleapis.extensions.android.gms.auth.GoogleAccountCredential;
import com.google.api.client.googleapis.extensions.android.gms.auth.UserRecoverableAuthIOException;
import com.google.api.client.googleapis.javanet.GoogleNetHttpTransport;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.JsonFactory;
import com.google.api.client.json.gson.GsonFactory;
import com.google.api.client.util.DateTime;
import com.google.api.client.util.ExponentialBackOff;
import com.google.api.services.calendar.Calendar;
import com.google.api.services.calendar.CalendarScopes;
import com.google.api.services.calendar.model.Event;
import com.google.api.services.calendar.model.Events;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.io.IOException;
import java.security.GeneralSecurityException;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

public class CalendarActivity extends AppCompatActivity {
    /**
     * Global instance of the JSON factory.
     */
    private static final JsonFactory JSON_FACTORY = GsonFactory.getDefaultInstance();
    /**
     * Directory to store authorization tokens for this application.
     */

    com.google.api.services.calendar.Calendar mService;

    GoogleAccountCredential credential;
    final static String TAG = "CalendarActivity";

    /**
     * Global instance of the scopes required by this quickstart.
     * If modifying these scopes, delete your previously saved tokens/ folder.
     */
    private static final List<String> SCOPES =
            Collections.singletonList(CalendarScopes.CALENDAR_READONLY);

    private Button getGoogleCalendarButton;
    AccountManager am;

    ArrayList<Integer> alarmHours = new ArrayList<>();
    ArrayList<Integer> alarmMinutes = new ArrayList<>();

    //ChatGPT usage: No
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_calendar);

        final NetHttpTransport HTTP_TRANSPORT;
        HTTP_TRANSPORT = new NetHttpTransport();
        SharedPreferences settings = getPreferences(Context.MODE_PRIVATE);
        credential = GoogleAccountCredential.usingOAuth2(
                        getApplicationContext(), SCOPES)
                .setBackOff(new ExponentialBackOff())
                .setSelectedAccountName(GoogleSignIn.getLastSignedInAccount(this).getEmail());

        mService = new Calendar.Builder(
                HTTP_TRANSPORT, JSON_FACTORY, credential)
                .setApplicationName("TransitTrack")
                .build();
        //Account[] accounts = am.getAccounts();

        PermissionChecker pc = new PermissionChecker();
        pc.checkAlarmPerms(CalendarActivity.this);
        pc.checkExactAlarmPerms(CalendarActivity.this);
        pc.checkNotificationPerms(CalendarActivity.this);
        createNotificationChannel();


        getGoogleCalendarButton = findViewById(R.id.googleCalendarButton);
        getGoogleCalendarButton.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {

                AsyncTask.execute(new Runnable() {
                    @Override
                    public void run() {
                        try {
                            getCalendarData();
                        } catch (IOException e) {
                            throw new RuntimeException(e);
                        } catch (JSONException e) {
                            throw new RuntimeException(e);
                        }

                    }
                });

            }
        });

    }

    //ChatGPT usage: No
    private ActivityResultLauncher<Intent> requestPermissionLauncher = registerForActivityResult(
            new ActivityResultContracts.StartActivityForResult(),
            result -> {
                if (result.getResultCode() == Activity.RESULT_OK) {
                    try {
                        getCalendarData();
                    } catch (IOException e) {
                        throw new RuntimeException(e);
                    } catch (JSONException e) {
                        throw new RuntimeException(e);
                    }
                } else {
                    // The user denied the permission request. Handle this case appropriately.
                    Log.d(TAG, "my misery is endless, result code: " + result.getResultCode());
                }
            }
    );

    //ChatGPT usage: Partial
    private void getCalendarData() throws IOException, JSONException {
        DateTime now = new DateTime(System.currentTimeMillis());
        Events events = null;
        try {
            events = mService.events().list("primary")
                    .setTimeMin(now)
                    .execute();
        } catch (UserRecoverableAuthIOException e) {

            Intent permissionIntent = e.getIntent();
            requestPermissionLauncher.launch(permissionIntent);
        } catch (IOException e) {
            Log.e(TAG, "API Request Exception: " + e.getMessage());
            e.printStackTrace();
            throw new RuntimeException(e);
        }

        List<Event> items = events.getItems();
        if (items.isEmpty()) {
//            Toast.makeText(CalendarActivity.this, "No upcoming events found!", Toast.LENGTH_LONG).show();
            Log.d(TAG, "No upcoming events");
            //System.out.println("No upcoming events found.");
        } else {
            //ChatGPT usage: Partial
            Log.d(TAG, "Upcoming events");
            Geocoder geocoder = new Geocoder(this);
            JSONArray calendarEvents = new JSONArray();
            for (Event event : items) {
                DateTime start = event.getStart().getDateTime();
                String loc = event.getLocation();
                List<Address> addressList = geocoder.getFromLocationName(loc, 1);
                Address address;
                if (addressList.size() > 0) {
                    address = addressList.get(0);
                    JSONObject calendarJSON = new JSONObject();
                    calendarJSON.put("email", GoogleSignIn.getLastSignedInAccount(this).getEmail());
                    calendarJSON.put("eventName", event.getSummary());
                    JSONObject destinationLocation = new JSONObject();
                    destinationLocation.put("latitude", address.getLatitude());
                    destinationLocation.put("longitude", address.getLongitude());
                    calendarJSON.put("location", destinationLocation);
                    calendarJSON.put("time", start);
                    String time = OkHTTPHelper.sendCalendar(calendarJSON);
                    parseTimeJSON(time);
                    alertTransitNotification(alarmHours.get(0), alarmMinutes.get(0));
                }
                if (start == null) {
                    start = event.getStart().getDate();
                }
                Log.d(TAG, event.getSummary() + " (" + start + ") @ " + loc);
                JSONObject request = new JSONObject();

                request.put("events", calendarEvents);

                //Toast.makeText(this, "Successfully synced calendar with server!", Toast.LENGTH_SHORT);

            }
        }
    }
    //ChatGPT usage: No

    //ChatGPT usage: No
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

    @SuppressLint("ScheduleExactAlarm")
    private void alertTransitNotification(int hours, int minutes) {

//        Toast.makeText(CalendarActivity.this, "Reminder Set for "+ hours + ": " + minutes, Toast.LENGTH_SHORT).show();
        Log.d(TAG, "Reminder Set for " + hours + ": " + minutes);

        java.util.Calendar calendar = java.util.Calendar.getInstance();
        calendar.setTimeInMillis(System.currentTimeMillis());
        calendar.set(java.util.Calendar.HOUR_OF_DAY, hours);
        calendar.set(java.util.Calendar.MINUTE, minutes);
        calendar.set(java.util.Calendar.SECOND, 0);

        Intent intent = new Intent(CalendarActivity.this, AlarmNotification.class);
        PendingIntent pendingIntent = PendingIntent.getBroadcast(CalendarActivity.this, 0, intent, PendingIntent.FLAG_ONE_SHOT | PendingIntent.FLAG_IMMUTABLE);

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
                Log.d(TAG, "Alarm Hours: " + alarmHours.get(i));
                Log.d(TAG, "Alarm Minutes: " + alarmMinutes.get(i));
            }


            // Use 'alarmHours' and 'alarmMinutes' ArrayLists as needed
        } catch (JSONException e) {
            e.printStackTrace();
        }
    }

}