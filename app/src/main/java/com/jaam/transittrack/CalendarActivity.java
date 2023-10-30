package com.jaam.transittrack;

import androidx.activity.result.ActivityResultCallback;
import androidx.activity.result.ActivityResultLauncher;
import androidx.activity.result.contract.ActivityResultContracts;
import androidx.appcompat.app.AppCompatActivity;

import android.accounts.Account;
import android.accounts.AccountManager;
import android.app.Activity;
import android.app.Dialog;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.net.ConnectivityManager;
import android.net.NetworkInfo;
import android.os.AsyncTask;
import android.os.Bundle;
import android.util.Log;
import android.view.View;
import android.widget.Button;

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


import java.io.IOException;
import java.security.GeneralSecurityException;
import java.util.Collections;
import java.util.List;

public class CalendarActivity extends AppCompatActivity {
    /**
     * Application name.
     */
    private static final String APPLICATION_NAME = "TransitTrack";
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
    //TODO double check account name
    private static final String PREF_ACCOUNT_NAME = "accountName";
    //TODO find out where these come from
    static final int REQUEST_ACCOUNT_PICKER = 1000;
    static final int REQUEST_AUTHORIZATION = 1001;
    static final int REQUEST_GOOGLE_PLAY_SERVICES = 1002;
    private Button getGoogleCalendarButton;
    AccountManager am;
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






        getGoogleCalendarButton = findViewById(R.id.googleCalendarButton);
        getGoogleCalendarButton.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {

                AsyncTask.execute(new Runnable() {
                    @Override
                    public void run() {
                        getCalendarData();

                    }
                });

            }
        });

    }
//    private static Credential getCredentials(final NetHttpTransport HTTP_TRANSPORT)
//            throws IOException {
//        // Load client secrets.
//        InputStream in = CalendarActivity.class.getResourceAsStream(CREDENTIALS_FILE_PATH);
//        if (in == null) {
//            throw new FileNotFoundException("Resource not found: " + CREDENTIALS_FILE_PATH);
//        }
//        GoogleClientSecrets clientSecrets =
//                GoogleClientSecrets.load(JSON_FACTORY, new InputStreamReader(in));
//
//        // Build flow and trigger user authorization request.
//        GoogleAuthorizationCodeFlow flow = new GoogleAuthorizationCodeFlow.Builder(
//                HTTP_TRANSPORT, JSON_FACTORY, clientSecrets, SCOPES)
//                .setDataStoreFactory(new FileDataStoreFactory(new java.io.File(TOKENS_DIRECTORY_PATH)))
//                .setAccessType("offline")
//                .build();
//        LocalServerReceiver receiver = new LocalServerReceiver.Builder().setPort(8888).build();
//        Credential credential = new AuthorizationCodeInstalledApp(flow, receiver).authorize("user");
//        //returns an authorized Credential object.
//        return credential;
//    }

//    private void chooseAccount() {
////        startActivityForResult(
////                credential.newChooseAccountIntent(), REQUEST_ACCOUNT_PICKER);
//        ActivityResultLauncher activityResultLauncher = registerForActivityResult(new ActivityResultContracts.StartActivityForResult(), new ActivityResultCallback(){
//
//            @Override
//            public void onActivityResult(Object result) {
//
//            }
//        });
//    }
    private boolean isDeviceOnline() {
        ConnectivityManager connMgr =
                (ConnectivityManager) getSystemService(Context.CONNECTIVITY_SERVICE);
        NetworkInfo networkInfo = connMgr.getActiveNetworkInfo();
        return (networkInfo != null && networkInfo.isConnectedOrConnecting());
    }
    private boolean isGooglePlayServicesAvailable() {
        final int connectionStatusCode =
                GoogleApiAvailability.getInstance().isGooglePlayServicesAvailable(this);
        if (connectionStatusCode != ConnectionResult.SUCCESS ) {
            return false;
        }
        return true;
    }
//    void showGooglePlayServicesAvailabilityErrorDialog(
//            final int connectionStatusCode) {
//        runOnUiThread(new Runnable() {
//            @Override
//            public void run() {
//                Dialog dialog = GooglePlayServicesUtil.getErrorDialog(
//                        connectionStatusCode,
//                        CalendarActivity.this,
//                        REQUEST_GOOGLE_PLAY_SERVICES);
//                dialog.show();
//            }
//        });
//    }
//    private void refreshResults() {
//        if (credential.getSelectedAccountName() == null) {
//            chooseAccount();
//        } else {
//            if (isDeviceOnline()) {
//                //new ApiAsyncTask(this).execute();
//            } else {
//
//            }
//        }
//    }
    private ActivityResultLauncher<Intent> requestPermissionLauncher = registerForActivityResult(
            new ActivityResultContracts.StartActivityForResult(),
            result -> {
                if (result.getResultCode() == Activity.RESULT_OK) {
                    getCalendarData();
                } else {
                    // The user denied the permission request. Handle this case appropriately.
                    Log.d(TAG, "my misery is endless, result code");
                }
            }
    );

    private void getCalendarData(){
        DateTime now = new DateTime(System.currentTimeMillis());
        Events events = null;
        try {
            events = mService.events().list("primary")
                    .setTimeMin(now)
                    .execute();
        }
        catch(UserRecoverableAuthIOException e){

            Intent permissionIntent = e.getIntent();
            requestPermissionLauncher.launch(permissionIntent);
        }
        catch (IOException e) {
            Log.e(TAG, "API Request Exception: " + e.getMessage());
            e.printStackTrace();
            throw new RuntimeException(e);
        }

        List<Event> items = events.getItems();
        if (items.isEmpty()) {
            System.out.println("No upcoming events found.");
        } else {
            System.out.println("Upcoming events");
            for (Event event : items) {
                DateTime start = event.getStart().getDateTime();
                String loc = event.getLocation();
                if (start == null) {
                    start = event.getStart().getDate();
                }
                Log.d(TAG,event.getSummary() + " (" + start+ ") @ " +loc);
                System.out.printf("%s (%s)\n", event.getSummary(), start);
            }
        }
    }

}