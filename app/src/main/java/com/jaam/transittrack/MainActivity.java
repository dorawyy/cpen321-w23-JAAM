package com.jaam.transittrack;

import androidx.activity.result.ActivityResult;
import androidx.activity.result.ActivityResultCallback;
import androidx.activity.result.ActivityResultLauncher;
import androidx.activity.result.contract.ActivityResultContracts;
import androidx.annotation.NonNull;
import androidx.appcompat.app.AppCompatActivity;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;

import android.Manifest;
import android.app.AlertDialog;
import android.content.DialogInterface;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.location.Address;
import android.location.Geocoder;
import android.os.Bundle;
import android.os.StrictMode;
import android.util.Log;
import android.view.View;
import android.widget.EditText;
import android.widget.Toast;

import com.google.android.gms.auth.api.signin.GoogleSignIn;
import com.google.android.gms.auth.api.signin.GoogleSignInAccount;
import com.google.android.gms.auth.api.signin.GoogleSignInClient;
import com.google.android.gms.auth.api.signin.GoogleSignInOptions;
import com.google.android.gms.common.api.ApiException;
import com.google.android.gms.tasks.OnCompleteListener;
import com.google.android.gms.tasks.Task;
import com.google.firebase.FirebaseApp;
import com.google.firebase.messaging.FirebaseMessaging;

import org.json.JSONException;
import org.json.JSONObject;

import java.io.IOException;
import java.util.List;
import java.util.UUID;

public class MainActivity extends AppCompatActivity {

    final static String TAG = "MainActivity";
    private GoogleSignInClient mGoogleSignInClient;

    private double defaultLat;
    private double defaultLon;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        checkLocationPermissions();
        checkInternetPerms();
        //TODO fix strictmode in MainActivity
        //work around for not running http requests off main thread. really don't want to deal with race conditions/synchronization
        StrictMode.ThreadPolicy policy = new StrictMode.ThreadPolicy.Builder().permitAll().build();
        StrictMode.setThreadPolicy(policy);

        FirebaseApp.initializeApp(this);
        // Configure sign-in to request the user's ID, email address, and basic
// profile. ID and basic profile are included in DEFAULT_SIGN_IN.
        GoogleSignInOptions gso = new GoogleSignInOptions.Builder(GoogleSignInOptions.DEFAULT_SIGN_IN)
                .requestEmail()
                .build();
        // Build a GoogleSignInClient with the options specified by gso.
        mGoogleSignInClient = GoogleSignIn.getClient(this, gso);
        findViewById(R.id.sign_in_button).setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View view) {
                String addressText = String.valueOf(((EditText)findViewById(R.id.addressEditText)).getText());
                if(addressText.length() > 0){
                    Geocoder geocoder = new Geocoder(MainActivity.this);
                    List<Address> addressList = null;
                    try {
                        addressList = geocoder.getFromLocationName(addressText, 1);
                    } catch (IOException e) {
                        Log.d(TAG,"address search failed: " + e.getMessage());
                        Toast.makeText(MainActivity.this, "Network connection not available. Please try again later!", Toast.LENGTH_LONG).show();
                    }
                    Address address;
                    if(addressList.size() > 0) {
                        address = addressList.get(0);
                        defaultLat = address.getLatitude();
                        defaultLon = address.getLongitude();
                        Log.d(TAG, "launching sign in intent");
                        Intent signInIntent = mGoogleSignInClient.getSignInIntent();
                        signInLauncher.launch(signInIntent);
                    }
                    else{
                        Toast.makeText(MainActivity.this, "Could not find address, please try again.", Toast.LENGTH_LONG).show();
                    }
                }
                else{
                    Toast.makeText(MainActivity.this, "Please enter a default address from where you'd like to start your journeys!", Toast.LENGTH_LONG).show();
                }

            }
        });
    }

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
            Log.d(TAG, "result: "+ result.getResultCode());

        }
    });

    private void updateUI(GoogleSignInAccount account) {
        if (account == null) {
            return;
        } else {
            //do something
            Log.d(TAG, "Starting Route Intent");
            Intent mapsIntent = new Intent(MainActivity.this, RouteActivity.class);
            startActivity(mapsIntent);
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
                                    } catch (IOException e) {
                                        Log.d(TAG, "Create user post request failed: "+e.getMessage());
                                        Toast.makeText(MainActivity.this, "Server unavailable, please try again later.",Toast.LENGTH_LONG).show();
                                        //don't want to crash
                                        //throw new RuntimeException(e);
                                    }
                                } catch (JSONException e) {
                                    throw new RuntimeException(e);
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
            updateUI(account);

        } catch (ApiException e) {
            // The ApiException status code indicates the detailed failure reason.
            // Please refer to the GoogleSignInStatusCodes class reference for more information.
            Log.w(TAG, "signInResult:failed code=" + e.getStatusCode());
            updateUI(null);
        }
    }

    /**
     * Checks and requests location permissions if not granted.
     * <p>
     * This method checks if the app has been granted the ACCESS_COARSE_LOCATION and ACCESS_FINE_LOCATION
     * permissions. If the permissions are not granted, it displays a rationale dialog explaining why
     * the permissions are required. If the user agrees, it requests these permissions. If the permissions
     * are already granted or the user declines to grant them, appropriate actions are taken, and the app's
     * functionality is communicated to the user via UI elements.
     * <p>
     * Usage:
     * - Call this method to check and request location permissions in your app. You typically call this
     * method at a point in your app where location access is required.
     * - Ensure you handle the permission request result in your activity's onRequestPermissionsResult method.
     * <p>
     * Example usage:
     * ```
     * checkLocationPermissions();
     * ```
     */
    private void checkLocationPermissions() {
        if (ContextCompat.checkSelfPermission(this, Manifest.permission.ACCESS_COARSE_LOCATION) == PackageManager.PERMISSION_GRANTED
                && ContextCompat.checkSelfPermission(this, Manifest.permission.ACCESS_FINE_LOCATION) == PackageManager.PERMISSION_GRANTED) {
            //Toast.makeText(MainActivity.this, "We have these permissions yay! :) ", Toast.LENGTH_LONG).show();
            Log.d(TAG, "Location Permissions Granted!");
        } else {
            if (ActivityCompat.shouldShowRequestPermissionRationale(this, Manifest.permission.ACCESS_COARSE_LOCATION)
                    || ActivityCompat.shouldShowRequestPermissionRationale(this, Manifest.permission.ACCESS_FINE_LOCATION)) {
                Log.d(TAG, "Permissions Denied!");
                new AlertDialog.Builder(MainActivity.this)
                        .setTitle("Need Location Permissions")
                        .setMessage("We need the location permissions to mark your location on a map")
                        .setNegativeButton("CANCEL", new DialogInterface.OnClickListener() {
                            @Override
                            public void onClick(DialogInterface dialogInterface, int i) {
                                Toast.makeText(MainActivity.this, "We need location permissions to run!", Toast.LENGTH_LONG).show();
                                dialogInterface.dismiss();
                            }
                        })
                        .setPositiveButton("OK", new DialogInterface.OnClickListener() {
                            @Override
                            public void onClick(DialogInterface dialogInterface, int i) {
                                ActivityCompat.requestPermissions(MainActivity.this, new String[]{Manifest.permission.ACCESS_COARSE_LOCATION, Manifest.permission.ACCESS_FINE_LOCATION}, 1);

                            }
                        }).create().show();
            } else {
                ActivityCompat.requestPermissions(this, new String[]{Manifest.permission.ACCESS_COARSE_LOCATION, Manifest.permission.ACCESS_FINE_LOCATION}, 1);
            }
        }
    }

    /**
     * Checks and requests Internet permission if not granted.
     * <p>
     * This method checks if the app has been granted the INTERNET permission. If the permission is
     * not granted, it displays a rationale dialog explaining why the permission is required. If the user
     * agrees, it requests the INTERNET permission. If the permission is already granted or the user
     * declines to grant it, appropriate actions are taken, and the app's functionality is communicated
     * to the user via UI elements.
     * <p>
     * Usage:
     * - Call this method to check and request INTERNET permission in your app. Typically, you call this
     * method at a point in your app where INTERNET access is required.
     * - Ensure you handle the permission request result in your activity's onRequestPermissionsResult method.
     * <p>
     * Example usage:
     * ```
     * checkInternetPerms();
     * ```
     */
    private void checkInternetPerms() {
        if (ContextCompat.checkSelfPermission(this, Manifest.permission.INTERNET) == PackageManager.PERMISSION_GRANTED) {
            Log.d(TAG, "Internet permissions granted");
        } else {
            if (ActivityCompat.shouldShowRequestPermissionRationale(this, Manifest.permission.INTERNET)) {
                new AlertDialog.Builder(MainActivity.this)
                        .setTitle("Need Internet Permissions")
                        .setMessage("We need to access the internet to make requests to the server")
                        .setNegativeButton("CANCEL", new DialogInterface.OnClickListener() {
                            @Override
                            public void onClick(DialogInterface dialogInterface, int i) {
                                Toast.makeText(MainActivity.this, "We need internet permissions to run!", Toast.LENGTH_LONG).show();
                                dialogInterface.dismiss();
                            }
                        })
                        .setPositiveButton("OK", new DialogInterface.OnClickListener() {
                            @Override
                            public void onClick(DialogInterface dialogInterface, int i) {
                                ActivityCompat.requestPermissions(MainActivity.this, new String[]{Manifest.permission.INTERNET}, 1);
                            }
                        }).create().show();
            }
        }
    }

}