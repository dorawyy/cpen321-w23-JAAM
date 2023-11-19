package com.jaam.transittrack;

import androidx.activity.result.ActivityResult;
import androidx.activity.result.ActivityResultCallback;
import androidx.activity.result.ActivityResultLauncher;
import androidx.activity.result.contract.ActivityResultContracts;
import androidx.annotation.NonNull;
import androidx.appcompat.app.AlertDialog;
import androidx.appcompat.app.AppCompatActivity;

import android.content.DialogInterface;
import android.content.Intent;
import android.location.Address;
import android.location.Geocoder;
import android.os.Bundle;
import android.os.StrictMode;
import android.util.Log;
import android.view.View;
import android.widget.EditText;
import android.widget.ProgressBar;

import com.google.android.gms.auth.api.signin.GoogleSignIn;
import com.google.android.gms.auth.api.signin.GoogleSignInAccount;
import com.google.android.gms.auth.api.signin.GoogleSignInClient;
import com.google.android.gms.auth.api.signin.GoogleSignInOptions;
import com.google.android.gms.common.api.ApiException;
import com.google.android.gms.tasks.OnCompleteListener;
import com.google.android.gms.tasks.Task;
import com.google.firebase.FirebaseApp;
import com.google.firebase.messaging.FirebaseMessaging;
import com.jaam.transittrack.exceptions.AddressException;

import org.json.JSONException;
import org.json.JSONObject;

import java.io.IOException;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;

public class MainActivity extends AppCompatActivity {

    final static String TAG = "MainActivity";
    private GoogleSignInClient mGoogleSignInClient;

    private double defaultLat;
    private double defaultLon;
    static private String[] cityCoverage = {"Vancouver", "West Vancouver", "North Vancouver",
            "Lions Bay", "Bowen Island", "Burnaby", "New Westminister", "Richmond", "Surrey",
            "Delta", "White Rock", "Langley", "Coquitlam", "Port Moody", "Port Coquitlam",
            "Belcarra", "Anmore", "Pitt Meadows", "Maple Ridge"};

    //ChatGPT usage: No
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        PermissionChecker pc = new PermissionChecker();
        pc.checkLocationPermissions(this);
        pc.checkInternetPerms(this);

        //TODO fix strictmode in MainActivity
        //work around for not running http requests off main thread. really don't want to deal with race conditions/synchronization
        StrictMode.ThreadPolicy policy = new StrictMode.ThreadPolicy.Builder().permitAll().build();
        StrictMode.setThreadPolicy(policy);
        ProgressBar loginProgressBar = findViewById(R.id.loginProgressBar);
        loginProgressBar.setVisibility(View.INVISIBLE);


        // Configure sign-in to request the user's ID, email address, and basic
// profile. ID and basic profile are included in DEFAULT_SIGN_IN.
        GoogleSignInOptions gso = new GoogleSignInOptions.Builder(GoogleSignInOptions.DEFAULT_SIGN_IN)
                .requestEmail()
                .build();
        // Build a GoogleSignInClient with the options specified by gso.
        mGoogleSignInClient = GoogleSignIn.getClient(this, gso);

        FirebaseApp.initializeApp(this);
        findViewById(R.id.sign_in_button).setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View view) {
                loginProgressBar.setVisibility(View.VISIBLE);
                String addressText = String.valueOf(((EditText)findViewById(R.id.addressEditText)).getText());
                if(addressText.length() > 0){
                    try {
                        Address address =  getAddressFromString(addressText);
                        defaultLat = address.getLatitude();
                        defaultLon = address.getLongitude();
                        Log.d(TAG, "launching sign in intent");
                        Intent signInIntent = mGoogleSignInClient.getSignInIntent();
                        signInLauncher.launch(signInIntent);
                    } catch (AddressException e) {
                        e.printStackTrace();
                    }
                }
                else{
                    showNewErrorAlertDialog("Default Address", "Please enter a default address from where you'd like to start your journeys!");
                }

            }
        });
    }
    //ChatGPT usage: No
    ActivityResultLauncher<Intent> signInLauncher = registerForActivityResult(new ActivityResultContracts.StartActivityForResult(), new ActivityResultCallback<ActivityResult>() {
        @Override
        public void onActivityResult(ActivityResult result) {
            Log.d(TAG, "got sign in result");
            if (result.getResultCode() == RESULT_OK) {
                Intent data = result.getData();
                Task<GoogleSignInAccount> task = GoogleSignIn.getSignedInAccountFromIntent(data);
                Log.d(TAG, "handling sign in result");
                handleSignInResult(task);

            }
            else{
                Log.d(TAG, "result data:" + result.getData());
                //Log.d(TAG, result.getData()?.getDataString());
//                Toast.makeText(MainActivity.this, "Could not sign into google account. Please check internet connection.", Toast.LENGTH_LONG).show();
                showNewErrorAlertDialog("Google Sign In Error", "Please contact the developer.");
            }
            Log.d(TAG, "result: "+ result.getResultCode());

        }
    });
    //ChatGPT usage: No
    private void updateUI(GoogleSignInAccount account) {
        if (account == null) {
            return;
        } else {
            //do something
            Log.d(TAG, "Starting Route Intent");
            Intent navigationIntent = new Intent(MainActivity.this, NavigationActivity.class);
            startActivity(navigationIntent);
        }
    }

    /**
     * Handles the result of a Google Sign-In task and updates the user interface accordingly.
     * <p>
     * This method is called when a Google Sign-In task is completed. It attempts to retrieve the
     * GoogleSignInAccount, and if successful, it updates the UI to reflect the authenticated state,
     * and then starts a new activity (MapsActivity in this case).
     *
     * @param completedTask A Task<GoogleSignInAccount> representing the completed sign-in task.
     *                      <p>
     *                      Usage:
     *                      - This method is typically called as a callback when a Google Sign-In task is completed.
     * @Override public void onComplete(Task<GoogleSignInAccount> task) {
     * handleSignInResult(task);
     * }
     * });
     * ```
     * @see GoogleSignInStatusCodes For detailed information on status codes and failure reasons.
     * <p>
     * Example usage:
     * ```
     * GoogleSignIn.getClient(...).signIn()
     * .addOnCompleteListener(this, new OnCompleteListener<GoogleSignInAccount>() {
     */
    //ChatGPT usage: No
    private void handleSignInResult(Task<GoogleSignInAccount> completedTask) {
        Log.d(TAG, "getting account");
        try {
            GoogleSignInAccount account = completedTask.getResult(ApiException.class);
            if (account != null) {
                // Signed in successfully
                Log.d(TAG, "Signed in successfully");
                JSONObject user = new JSONObject();
                final String[] deviceToken = {""};
                FirebaseMessaging.getInstance().getToken()
                        .addOnCompleteListener(new OnCompleteListener<String>() {
                            @Override
                            public void onComplete(@NonNull Task<String> task) {
                                if (!task.isSuccessful()) {
                                    Log.w(TAG, "Fetching FCM registration token failed", task.getException());
                                    return;
                                }

                                // Get new FCM registration token
                                deviceToken[0] = task.getResult();
                                try {
                                    //TODO put in its own function
                                    user.put("deviceToken", deviceToken[0]);
                                    String uidKey = account.getGivenName()+account.getFamilyName()+account.getEmail();
                                    String uuidString = UUID.nameUUIDFromBytes(uidKey.getBytes()).toString();
                                    Log.d(TAG, "UUID:"+ uuidString);
                                    user.put("UUID", uuidString);
                                    user.put("email", account.getEmail());
                                    user.put("defaultLat", defaultLat);
                                    user.put("defaultLon", defaultLon);
                                    Log.d(TAG, user.toString());
                                    try {
                                        OkHTTPHelper.createUser(user);
                                        updateUI(account);
                                    } catch (IOException e) {
                                        Log.d(TAG, "Error: "+ e);
                                        Log.d(TAG, "Create user post request failed: "+e.getMessage());
                                        Log.d(TAG, "Failure Status Code: "+ e.getCause());
                                        //maybe better to have alert dialog
//                                        Toast.makeText(MainActivity.this, "Server unavailable, please try again later.",Toast.LENGTH_LONG).show();
                                        showNewErrorAlertDialog("Server Error", "The server is unavailable, please try again later.");
                                        //don't want to crash
                                        //throw new RuntimeException(e);
                                    }
                                } catch (JSONException e) {
                                    e.printStackTrace();
                                }

                                // Log and toast
//                        String msg = getString(R.string.msg_token_fmt, token);
                                Log.d(TAG, "FCM Device Registration Token: "+deviceToken[0]);

//                        TOKEN

//                        fNgnfEh4RumbR4af-LLGkR:APA91bFb4pNSVMx80FugZSt8u4aLj4Z-LnlTSUC-xpFsqUO1gfLOVBhMElmbYiE76mC_ceyK7j8Db-HsxWrfS6BhW0YLRx3s4b7rwfCYjT537oDkQ69_T1Vm-zVhfWq99XZODm_sWeXO
//                        Toast.makeText(MainActivity.this, "FCM Device Registration Token: "+token, Toast.LENGTH_SHORT).show();
                            }
                        });

            }


        } catch (ApiException e) {
            // The ApiException status code indicates the detailed failure reason.
            // Please refer to the GoogleSignInStatusCodes class reference for more information.
            Log.w(TAG, "signInResult:failed code=" + e.getStatusCode());
            updateUI(null);
        }
    }
    private Address getAddressFromString(String search) throws AddressException{
        Address address = null;
        Geocoder geocoder = new Geocoder(MainActivity.this);
        List<Address> addressList = null;
        try {
            addressList = geocoder.getFromLocationName(search, 1);
        }catch (IOException e){
            showNewErrorAlertDialog("Network Error", "Try turning airplane mode on and off.");
//            Toast.makeText(MainActivity.this, "Network error! Try turning airplane mode on and off.", Toast.LENGTH_LONG).show();
            throw new AddressException(e.getMessage());
        }
        if(addressList.size() == 0 ){
            showNewErrorAlertDialog("Address Error", "Could not find address, please enter a different one.");
//            Toast.makeText(MainActivity.this, "Could not find address, please enter a different one.", Toast.LENGTH_LONG).show();
            throw new AddressException("Could not find address");
        }
        address = addressList.get(0);
        if (!address.getCountryName().equals("Canada") || !Arrays.stream(cityCoverage).anyMatch(addressList.get(0).getLocality()::equals)){
            showNewErrorAlertDialog("Address Error", "Please enter an address covered by Translink.");
            throw new AddressException("Address is outside Greater Vancouver Area");
        }

        return address;
    }

    private void showNewErrorAlertDialog(String title, String message){
        new AlertDialog.Builder(MainActivity.this).setTitle(title).setMessage(message)
                .setPositiveButton("OK", new DialogInterface.OnClickListener() {
                    @Override
                    public void onClick(DialogInterface dialog, int which) {
                        dialog.dismiss();
                    }
                }).create().show();
    }
}