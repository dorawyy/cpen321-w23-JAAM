package com.jaam.transittrack;

import androidx.activity.result.ActivityResult;
import androidx.activity.result.ActivityResultCallback;
import androidx.activity.result.ActivityResultLauncher;
import androidx.activity.result.contract.ActivityResultContracts;
import androidx.appcompat.app.AppCompatActivity;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;

import android.Manifest;
import android.app.AlertDialog;
import android.content.DialogInterface;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.os.Bundle;
import android.util.Log;
import android.view.View;
import android.widget.Toast;

import com.google.android.gms.auth.api.signin.GoogleSignIn;
import com.google.android.gms.auth.api.signin.GoogleSignInAccount;
import com.google.android.gms.auth.api.signin.GoogleSignInClient;
import com.google.android.gms.auth.api.signin.GoogleSignInOptions;
import com.google.android.gms.common.api.ApiException;
import com.google.android.gms.tasks.Task;

public class MainActivity extends AppCompatActivity {

    final static String TAG = "MainActivity";
    private GoogleSignInClient mGoogleSignInClient;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);
        checkLocationPermissions();
        checkInternetPerms();
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
                Intent signInIntent = mGoogleSignInClient.getSignInIntent();
                signInLauncher.launch(signInIntent);
            }
        });
    }
    ActivityResultLauncher<Intent> signInLauncher = registerForActivityResult(new ActivityResultContracts.StartActivityForResult(), new ActivityResultCallback<ActivityResult>() {
        @Override
        public void onActivityResult(ActivityResult result) {
            if (result.getResultCode() == RESULT_OK) {
                Intent data = result.getData();
                Task<GoogleSignInAccount> task = GoogleSignIn.getSignedInAccountFromIntent(data);
                handleSignInResult(task);

            }
        }
    });

    private void updateUI(GoogleSignInAccount account) {
        if(account == null){
            return;
        }
        else{
            //do something
        }
    }
    /**
     * Handles the result of a Google Sign-In task and updates the user interface accordingly.
     *
     * This method is called when a Google Sign-In task is completed. It attempts to retrieve the
     * GoogleSignInAccount, and if successful, it updates the UI to reflect the authenticated state,
     * and then starts a new activity (MapsActivity in this case).
     *
     * @param completedTask A Task<GoogleSignInAccount> representing the completed sign-in task.
     *
     * Usage:
     * - This method is typically called as a callback when a Google Sign-In task is completed.
     *
     * @see GoogleSignInStatusCodes For detailed information on status codes and failure reasons.
     *
     * Example usage:
     * ```
     * GoogleSignIn.getClient(...).signIn()
     *     .addOnCompleteListener(this, new OnCompleteListener<GoogleSignInAccount>() {
     *         @Override
     *         public void onComplete(Task<GoogleSignInAccount> task) {
     *             handleSignInResult(task);
     *         }
     *     });
     * ```
     */
    private void handleSignInResult(Task<GoogleSignInAccount> completedTask) {
        try {
            GoogleSignInAccount account = completedTask.getResult(ApiException.class);

            // Signed in successfully, show authenticated UI.
            updateUI(account);
            Intent mapsIntent = new Intent(MainActivity.this, MapsActivity.class);
            startActivity(mapsIntent);
        } catch (ApiException e) {
            // The ApiException status code indicates the detailed failure reason.
            // Please refer to the GoogleSignInStatusCodes class reference for more information.
            Log.w(TAG, "signInResult:failed code=" + e.getStatusCode());
            updateUI(null);
        }
    }
    /**
     * Checks and requests location permissions if not granted.
     *
     * This method checks if the app has been granted the ACCESS_COARSE_LOCATION and ACCESS_FINE_LOCATION
     * permissions. If the permissions are not granted, it displays a rationale dialog explaining why
     * the permissions are required. If the user agrees, it requests these permissions. If the permissions
     * are already granted or the user declines to grant them, appropriate actions are taken, and the app's
     * functionality is communicated to the user via UI elements.
     *
     * Usage:
     * - Call this method to check and request location permissions in your app. You typically call this
     * method at a point in your app where location access is required.
     * - Ensure you handle the permission request result in your activity's onRequestPermissionsResult method.
     *
     * Example usage:
     * ```
     * checkLocationPermissions();
     * ```
     */
    private void checkLocationPermissions() {
        if (ContextCompat.checkSelfPermission(this, Manifest.permission.ACCESS_COARSE_LOCATION) == PackageManager.PERMISSION_GRANTED
                && ContextCompat.checkSelfPermission(this, Manifest.permission.ACCESS_FINE_LOCATION) == PackageManager.PERMISSION_GRANTED) {
            Toast.makeText(MainActivity.this, "We have these permissions yay! :) ", Toast.LENGTH_LONG).show();
            Log.d(TAG, "Permissions Granted!");
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
     *
     * This method checks if the app has been granted the INTERNET permission. If the permission is
     * not granted, it displays a rationale dialog explaining why the permission is required. If the user
     * agrees, it requests the INTERNET permission. If the permission is already granted or the user
     * declines to grant it, appropriate actions are taken, and the app's functionality is communicated
     * to the user via UI elements.
     *
     * Usage:
     * - Call this method to check and request INTERNET permission in your app. Typically, you call this
     *   method at a point in your app where INTERNET access is required.
     * - Ensure you handle the permission request result in your activity's onRequestPermissionsResult method.
     *
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