package com.jaam.transittrack;

import android.Manifest;
import android.app.Activity;
import android.app.AlertDialog;
import android.content.Context;
import android.content.DialogInterface;
import android.content.pm.PackageManager;
import android.util.Log;
import android.widget.Toast;

import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;

public class PermissionChecker {


    private static String TAG = "PermissionChecker";
    public PermissionChecker() {

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
    //ChatGPT usage: No
    void checkLocationPermissions(Context context) {
        if (ContextCompat.checkSelfPermission(context, Manifest.permission.ACCESS_COARSE_LOCATION) == PackageManager.PERMISSION_GRANTED
                && ContextCompat.checkSelfPermission(context, Manifest.permission.ACCESS_FINE_LOCATION) == PackageManager.PERMISSION_GRANTED) {
            //Toast.makeText(MainActivity.this, "We have these permissions yay! :) ", Toast.LENGTH_LONG).show();
            Log.d(TAG, "Location Permissions Granted!");
        } else {
            if (ActivityCompat.shouldShowRequestPermissionRationale((Activity)context, Manifest.permission.ACCESS_COARSE_LOCATION)
                    || ActivityCompat.shouldShowRequestPermissionRationale((Activity)context, Manifest.permission.ACCESS_FINE_LOCATION)) {
                Log.d(TAG, "Permissions Denied!");
                new AlertDialog.Builder(context)
                        .setTitle("Need Location Permissions")
                        .setMessage("We need the location permissions to mark your location on a map")
                        .setNegativeButton("CANCEL", new DialogInterface.OnClickListener() {
                            @Override
                            public void onClick(DialogInterface dialogInterface, int i) {
                                Toast.makeText(context, "We need location permissions to run!", Toast.LENGTH_LONG).show();
                                dialogInterface.dismiss();
                            }
                        })
                        .setPositiveButton("OK", new DialogInterface.OnClickListener() {
                            @Override
                            public void onClick(DialogInterface dialogInterface, int i) {
                                ActivityCompat.requestPermissions((Activity)context , new String[]{Manifest.permission.ACCESS_COARSE_LOCATION, Manifest.permission.ACCESS_FINE_LOCATION}, 1);

                            }
                        }).create().show();
            } else {
                ActivityCompat.requestPermissions((Activity)context, new String[]{Manifest.permission.ACCESS_COARSE_LOCATION, Manifest.permission.ACCESS_FINE_LOCATION}, 1);
            }
        }
    }
    //ChatGPT usage: No
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
    void checkInternetPerms(Context context) {
        if (ContextCompat.checkSelfPermission(context, Manifest.permission.INTERNET) == PackageManager.PERMISSION_GRANTED) {
            Log.d(TAG, "Internet permissions granted");
        } else {
            if (ActivityCompat.shouldShowRequestPermissionRationale((Activity) context, Manifest.permission.INTERNET)) {
                new AlertDialog.Builder(context)
                        .setTitle("Need Internet Permissions")
                        .setMessage("We need to access the internet to make requests to the server")
                        .setNegativeButton("CANCEL", new DialogInterface.OnClickListener() {
                            @Override
                            public void onClick(DialogInterface dialogInterface, int i) {
                                Toast.makeText(context, "We need internet permissions to run!", Toast.LENGTH_LONG).show();
                                dialogInterface.dismiss();
                            }
                        })
                        .setPositiveButton("OK", new DialogInterface.OnClickListener() {
                            @Override
                            public void onClick(DialogInterface dialogInterface, int i) {
                                ActivityCompat.requestPermissions((Activity) context, new String[]{Manifest.permission.INTERNET}, 1);
                            }
                        }).create().show();
            }
        }
    }
    //ChatGPT usage: No
    void checkAlarmPerms(Context context) {
        if (ContextCompat.checkSelfPermission(context, Manifest.permission.SET_ALARM) == PackageManager.PERMISSION_GRANTED) {
            //Toast.makeText(MainActivity.this, "We have these permissions yay! :) ", Toast.LENGTH_LONG).show();
            Log.d(TAG, "Notification Permissions Granted!");
        } else {
            if (ActivityCompat.shouldShowRequestPermissionRationale((Activity)context, Manifest.permission.SET_ALARM)) {
                Log.d(TAG, "Alarm Notifications Denied!");
                new AlertDialog.Builder(context)
                        .setTitle("Need Location Permissions")
                        .setMessage("We need the location permissions to mark your location on a map")
                        .setNegativeButton("CANCEL", new DialogInterface.OnClickListener() {
                            @Override
                            public void onClick(DialogInterface dialogInterface, int i) {
                                Toast.makeText(context, "We need notification permissions to send departure reminders!", Toast.LENGTH_LONG).show();
                                dialogInterface.dismiss();
                            }
                        })
                        .setPositiveButton("OK", new DialogInterface.OnClickListener() {
                            @Override
                            public void onClick(DialogInterface dialogInterface, int i) {
                                ActivityCompat.requestPermissions((Activity)context, new String[]{Manifest.permission.SET_ALARM}, 1);

                            }
                        }).create().show();
            } else {
                ActivityCompat.requestPermissions((Activity)context, new String[]{Manifest.permission.SET_ALARM}, 1);
            }
        }
    }
    //ChatGPT usage: No
    void checkExactAlarmPerms(Context context) {
        if (ContextCompat.checkSelfPermission(context, Manifest.permission.SCHEDULE_EXACT_ALARM) == PackageManager.PERMISSION_GRANTED) {
            //Toast.makeText(MainActivity.this, "We have these permissions yay! :) ", Toast.LENGTH_LONG).show();
            Log.d(TAG, "Notification Permissions Granted!");
        } else {
            if (ActivityCompat.shouldShowRequestPermissionRationale((Activity)context, Manifest.permission.SCHEDULE_EXACT_ALARM)) {
                Log.d(TAG, "Alarm Notifications Denied!");
                new AlertDialog.Builder(context)
                        .setTitle("Need Location Permissions")
                        .setMessage("We need the location permissions to mark your location on a map")
                        .setNegativeButton("CANCEL", new DialogInterface.OnClickListener() {
                            @Override
                            public void onClick(DialogInterface dialogInterface, int i) {
                                Toast.makeText(context, "We need notification permissions to send departure reminders!", Toast.LENGTH_LONG).show();
                                dialogInterface.dismiss();
                            }
                        })
                        .setPositiveButton("OK", new DialogInterface.OnClickListener() {
                            @Override
                            public void onClick(DialogInterface dialogInterface, int i) {
                                ActivityCompat.requestPermissions((Activity)context, new String[]{Manifest.permission.SCHEDULE_EXACT_ALARM}, 1);

                            }
                        }).create().show();
            } else {
                ActivityCompat.requestPermissions((Activity)context, new String[]{Manifest.permission.SCHEDULE_EXACT_ALARM}, 1);
            }
        }
    }
    //ChatGPT usage: No
    void checkNotificationPerms (Context context) {
        if (ContextCompat.checkSelfPermission(context, Manifest.permission.POST_NOTIFICATIONS) == PackageManager.PERMISSION_GRANTED) {
            //Toast.makeText(MainActivity.this, "We have these permissions yay! :) ", Toast.LENGTH_LONG).show();
            Log.d(TAG, "Notification Permissions Granted!");
        } else {
            if (ActivityCompat.shouldShowRequestPermissionRationale((Activity) context, Manifest.permission.POST_NOTIFICATIONS)) {
                Log.d(TAG, "Notifications Denied!");
                new AlertDialog.Builder(context)
                        .setTitle("Need Location Permissions")
                        .setMessage("We need the location permissions to mark your location on a map")
                        .setNegativeButton("CANCEL", new DialogInterface.OnClickListener() {
                            @Override
                            public void onClick(DialogInterface dialogInterface, int i) {
                                Toast.makeText(context, "We need notification permissions to send departure reminders!", Toast.LENGTH_LONG).show();
                                dialogInterface.dismiss();
                            }
                        })
                        .setPositiveButton("OK", new DialogInterface.OnClickListener() {
                            @Override
                            public void onClick(DialogInterface dialogInterface, int i) {
                                ActivityCompat.requestPermissions((Activity) context, new String[]{Manifest.permission.POST_NOTIFICATIONS}, 1);

                            }
                        }).create().show();
            } else {
                ActivityCompat.requestPermissions((Activity) context, new String[]{Manifest.permission.POST_NOTIFICATIONS}, 1);
            }
        }
    }

}
