package com.jaam.transittrack;

import androidx.appcompat.app.AppCompatActivity;

import android.content.Intent;
import android.os.Bundle;
import android.util.Log;
import android.view.View;
import android.widget.Button;

import com.google.android.gms.auth.api.signin.GoogleSignIn;

import java.io.IOException;

import okhttp3.HttpUrl;
import okhttp3.OkHttpClient;
import okhttp3.Request;

public class NavigationActivity extends AppCompatActivity {
    private Button chatButton;
    private Button friendListButton;

    private Button notifyButton;
    static private String TAG = "NavigationActivity";

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_navigation);
        chatButton = findViewById(R.id.chatButton);
        friendListButton = findViewById(R.id.friendListButton);
        friendListButton.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                Intent friendsListIntent = new Intent(NavigationActivity.this, FriendListActivity.class);
                startActivity(friendsListIntent);
            }
        });


        findViewById(R.id.calendarActivityButton).setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                Intent calendarIntent = new Intent(NavigationActivity.this, CalendarActivity.class);
                startActivity(calendarIntent);
            }
        });

        //ChatGPT usage: No
        chatButton.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                Intent chatIntent = new Intent(NavigationActivity.this, ChatActivity.class);
                chatIntent.putExtra("receiverEmail", "johndoe@example.com");
                startActivity(chatIntent);

            }
        });
        notifyButton = findViewById(R.id.notifyButton);
        notifyButton.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                HttpUrl url = HttpUrl.parse("https://4.205.17.106:8081/getFCM").newBuilder()
                        .addQueryParameter("userEmail", GoogleSignIn.getLastSignedInAccount(NavigationActivity.this).getEmail())
                        .build();
                Request request = new Request.Builder()
                        .url(url)
                        .get()
                        .build();
                Log.d(TAG, request.toString());
                try {
                    new OkHttpClient().newCall(request).execute();
                } catch (IOException e) {
                    throw new RuntimeException(e);
                }
            }
        });

        findViewById(R.id.routeActivityButton).setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                Intent routeIntent = new Intent(NavigationActivity.this, RouteActivity.class);
                startActivity(routeIntent);
            }
        });
    }
}