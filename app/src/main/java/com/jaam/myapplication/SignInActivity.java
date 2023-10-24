package com.jaam.myapplication;

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

public class SignInActivity extends AppCompatActivity {
    private GoogleSignInClient mGoogleSignInClient;
    final static String TAG = "MainActivity";

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);
        checkLocationPermissions();
        ActivityResultLauncher<Intent> signInLauncher = registerForActivityResult(new ActivityResultContracts.StartActivityForResult(), result -> {
            if (result.getResultCode() == RESULT_OK) {
                Intent data = result.getData();
                Task<GoogleSignInAccount> task = GoogleSignIn.getSignedInAccountFromIntent(data);
                handleSignInResult(task);

            }
        });
        GoogleSignInOptions gso = new GoogleSignInOptions.Builder(GoogleSignInOptions.DEFAULT_SIGN_IN)
                .requestEmail()
                .build();
        mGoogleSignInClient = GoogleSignIn.getClient(this, gso);
        GoogleSignInAccount account = GoogleSignIn.getLastSignedInAccount(this);
        updateUI(account);

        findViewById(R.id.sign_in_button).setOnClickListener(view -> {
            Intent signInIntent = mGoogleSignInClient.getSignInIntent();
            signInLauncher.launch(signInIntent);
        });
    }

    private void updateUI(GoogleSignInAccount account) {
        if(account == null) {
            Log.d(TAG, "There is no user signed in.");
        }
        else{
            Log.d(TAG, "Pref Name: " + account.getDisplayName());
            Log.d(TAG, "Family Name: " + account.getFamilyName());
            Log.d(TAG, "Email: " + account.getEmail());
            Log.d(TAG, "Given Name: " + account.getGivenName());
            Log.d(TAG, "Display URI: " + account.getPhotoUrl());
            Log.d(TAG, "Sanity Checked! :)");
        }

    }
    private void handleSignInResult(Task<GoogleSignInAccount> completedTask) {
        try {
            GoogleSignInAccount account = completedTask.getResult(ApiException.class);

            // Signed in successfully, show authenticated UI.
            updateUI(account);
            Toast.makeText(SignInActivity.this, "Sign In Successful!", Toast.LENGTH_SHORT).show();
            //Eventually do this
//            Intent serverInfoIntent = new Intent(SignInActivity.this, MapsActivity.class);
//            startActivity(serverInfoIntent);
        } catch (ApiException e) {
            // The ApiException status code indicates the detailed failure reason.
            // Please refer to the GoogleSignInStatusCodes class reference for more information.
            Log.w(TAG, "signInResult:failed code=" + e.getStatusCode());
            updateUI(null);
        }
    }
    private void checkLocationPermissions() {
        if (ContextCompat.checkSelfPermission(this, android.Manifest.permission.ACCESS_COARSE_LOCATION) == PackageManager.PERMISSION_GRANTED
                && ContextCompat.checkSelfPermission(this, android.Manifest.permission.ACCESS_FINE_LOCATION) == PackageManager.PERMISSION_GRANTED) {
            Toast.makeText(SignInActivity.this, "We have these permissions yay! :) ", Toast.LENGTH_LONG).show();
            Log.d(TAG, "Permissions Granted!");
        } else {
            if (ActivityCompat.shouldShowRequestPermissionRationale(this, android.Manifest.permission.ACCESS_COARSE_LOCATION)
                    || ActivityCompat.shouldShowRequestPermissionRationale(this, android.Manifest.permission.ACCESS_FINE_LOCATION)) {
                Log.d(TAG, "Permissions Denied!");
                new AlertDialog.Builder(SignInActivity.this)
                        .setTitle("Need Location Permissions")
                        .setMessage("We need the location permissions to mark your location on a map")
                        .setNegativeButton("CANCEL", (dialogInterface, i) -> {
                            Toast.makeText(SignInActivity.this, "We need location permissions to run!", Toast.LENGTH_LONG).show();
                            dialogInterface.dismiss();
                        })
                        .setPositiveButton("OK", (dialogInterface, i) -> ActivityCompat.requestPermissions(SignInActivity.this, new String[]{Manifest.permission.ACCESS_COARSE_LOCATION, Manifest.permission.ACCESS_FINE_LOCATION}, 1)).create().show();
            } else {
                ActivityCompat.requestPermissions(this, new String[]{android.Manifest.permission.ACCESS_COARSE_LOCATION, Manifest.permission.ACCESS_FINE_LOCATION}, 1);
            }
        }
    }
}