package com.example.chatcomponent321;

import androidx.annotation.NonNull;
import androidx.appcompat.app.AppCompatActivity;
import androidx.core.app.ActivityCompat;

import android.Manifest;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.os.Bundle;
import android.util.Log;
import android.widget.EditText;
import android.widget.Toast;

import com.google.android.gms.tasks.OnCompleteListener;
import com.google.android.gms.tasks.Task;
import com.google.firebase.messaging.FirebaseMessaging;

public class MainActivity extends AppCompatActivity {

    private static final String TAG ="MainActivity";

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

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
}