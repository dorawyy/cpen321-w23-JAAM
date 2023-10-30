package com.example.myapplication;

import androidx.appcompat.app.AppCompatActivity;

import android.os.Bundle;
import android.util.Log;
import android.view.View;
import android.widget.EditText;

import java.io.IOException;

import okhttp3.FormBody;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.RequestBody;
import okhttp3.Response;

public class MainActivity extends AppCompatActivity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
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

                RequestBody requestBody = new FormBody.Builder()
                        .add("friend_email", String.valueOf(field.getText()))
                        .add("requester_email", String.valueOf(field2.getText()))
                        .build();

                Request postRequest = new Request.Builder()
                        .url("http://4.205.17.106:8081/addFriend")
                        .post(requestBody)
                        .build();

                try {
                    Response response = client.newCall(postRequest).execute();
                    Log.d("REPSONSE", response.body().string());
                } catch (IOException e) {
                    e.printStackTrace();
                }

            }
        });
    }
}