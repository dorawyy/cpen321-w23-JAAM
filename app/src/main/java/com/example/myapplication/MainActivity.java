package com.example.myapplication;

import androidx.appcompat.app.AppCompatActivity;

import android.os.Bundle;
import android.os.StrictMode;
import android.util.Log;
import android.view.View;
import android.widget.EditText;
import android.util.Base64;
import java.io.IOException;

import okhttp3.FormBody;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.RequestBody;
import okhttp3.Response;
import okhttp3.internal.http.RetryAndFollowUpInterceptor;

public class MainActivity extends AppCompatActivity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        String username = "963";
        String credentials1 = username;
        String base64Credentials = Base64.encodeToString(credentials1.getBytes(), Base64.NO_WRAP);

        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);
        EditText field = findViewById(R.id.addFriendInput);
        EditText field2 = findViewById(R.id.addFriendInput2);
        findViewById(R.id.addFriendButton).setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View view) {
                Log.d("BUTTON", "Button CLicked");
                Log.d("BUTTON", "Field is:" + String.valueOf(field.getText()));
                Log.d("BUTTON", "Field is:" + String.valueOf(field2.getText()));
                OkHttpClient client = new OkHttpClient();

                StrictMode.ThreadPolicy gfgPolicy = new StrictMode.ThreadPolicy.Builder().permitAll().build();
                StrictMode.setThreadPolicy(gfgPolicy);

                RequestBody requestBody = new FormBody.Builder()
//                        .addHeader("Authorization", "Basic " + base64Credentials)
                        .add("friendEmail", String.valueOf(field.getText()))
                        .add("userEmail", String.valueOf(field2.getText()))
                        .build();

                Request postRequest = new Request.Builder()
                        .url("http://4.205.17.106:8081/addFriend")
                        .post(requestBody)
                        .build();

                try {
                    Log.d("RESPONSE", "BEFORE");
                    Response response = client.newCall(postRequest).execute();
                    Log.d("REPSONSE", response.body().string());
                } catch (IOException e) {
                    e.printStackTrace();
                }

            }
        });
    }
}
