package com.jaam.transittrack;

import android.Manifest;
import android.app.Activity;
import android.app.AlarmManager;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.util.Log;
import android.widget.Toast;

import androidx.annotation.NonNull;
import androidx.core.app.ActivityCompat;
import androidx.core.app.NotificationCompat;
import androidx.core.app.NotificationManagerCompat;

import com.google.android.gms.auth.api.signin.GoogleSignIn;

import java.io.IOException;

import okhttp3.HttpUrl;
import okhttp3.OkHttpClient;
import okhttp3.Request;

public class AlarmNotification extends BroadcastReceiver {

    private static String TAG = "AlarmNotification";

    @Override
    public void onReceive(Context context, Intent intent) {
        NotificationCompat.Builder builder = new NotificationCompat.Builder(context, "notifyTransit")
                .setSmallIcon(R.drawable.baseline_add_alert_24)
                .setContentTitle("TransitTrack")
                .setContentText("Your transit journey leaves in 10 minutes!")
                .setPriority(NotificationCompat.PRIORITY_DEFAULT);


        Toast.makeText(context, "Time for your notification!", Toast.LENGTH_SHORT).show();

        HttpUrl url = HttpUrl.parse("https://4.205.17.106:8081/getFCM").newBuilder()
                .addQueryParameter("senderEmail", GoogleSignIn.getLastSignedInAccount(context).getEmail())
                .build();
        Request request = new Request.Builder()
                .url(url)
                .get()
                .build();
        try {
            new OkHttpClient().newCall(request).execute();
        } catch (IOException e) {
            throw new RuntimeException(e);
        }

        NotificationManagerCompat notificationManager = NotificationManagerCompat.from(context);
        if (ActivityCompat.checkSelfPermission(context, android.Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED) {
            Log.d(TAG, "Notification permissions not granted");
            // TODO: Consider calling
            //    ActivityCompat#requestPermissions
            // here to request the missing permissions, and then overriding
            //   public void onRequestPermissionsResult(int requestCode, String[] permissions,
            //                                          int[] grantResults)
            // to handle the case where the user grants the permission. See the documentation
            // for ActivityCompat#requestPermissions for more details.
            //ActivityCompat.requestPermissions((Activity) context, new String[]{Manifest.permission.POST_NOTIFICATIONS}, 1);
            return;
        }
        notificationManager.notify((int)System.currentTimeMillis(), builder.build());

    }
}