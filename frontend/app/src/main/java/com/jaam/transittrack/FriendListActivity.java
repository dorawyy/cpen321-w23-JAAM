package com.jaam.transittrack;

import androidx.appcompat.app.AppCompatActivity;

import android.os.Bundle;
import android.os.StrictMode;
import android.text.Editable;
import android.text.TextWatcher;
import android.view.View;
import android.widget.Button;
import android.widget.EditText;
import android.widget.ListView;
import android.widget.Toast;

import com.google.android.gms.auth.api.signin.GoogleSignIn;

import org.json.JSONException;
import org.json.JSONObject;

import java.io.IOException;
import java.util.ArrayList;
import java.util.concurrent.TimeoutException;

public class FriendListActivity extends AppCompatActivity {

    private EditText friendEmailTextView;
    private ArrayList<String> friends = new ArrayList<>();


    private Button addFriendButton;

    //ChatGPT usage: No
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_friend_list);

        StrictMode.ThreadPolicy policy = new StrictMode.ThreadPolicy.Builder().permitAll().build();
        StrictMode.setThreadPolicy(policy);

        // for testing
//        friends.add("k.west@example.com");

        FriendEntryAdapter friendEntryAdapter = new FriendEntryAdapter(friends, this);
        ListView friendListView = findViewById(R.id.friendListView);
        friendListView.setAdapter(friendEntryAdapter);

        addFriendButton = findViewById(R.id.addFriendButton);
        friendEmailTextView = findViewById(R.id.friendEmailEditText);
        //ChatGPT usage: No
        friendEmailTextView.addTextChangedListener(new TextWatcher() {
            @Override
            public void beforeTextChanged(CharSequence s, int start, int count, int after) {

            }

            @Override
            public void onTextChanged(CharSequence s, int start, int before, int count) {
                if (s.length() < 1) {
                    addFriendButton.setAlpha(.5f);
                    addFriendButton.setClickable(false);

                } else {
                    addFriendButton.setAlpha(1f);
                    addFriendButton.setClickable(true);
                }
            }

            @Override
            public void afterTextChanged(Editable s) {

            }
        });
        //ChatGPT usage: No
        addFriendButton.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                String textViewContent = String.valueOf(friendEmailTextView.getText());
                JSONObject friendReqBody = new JSONObject();
                try {
                    friendReqBody.put("userEmail",GoogleSignIn.getLastSignedInAccount(FriendListActivity.this).getEmail());
                    friendReqBody.put("friendEmail",textViewContent);
                } catch (JSONException e) {
                    e.printStackTrace();
                }
                try {
                    OkHTTPHelper.sendFriendRequest(friendReqBody);
                } catch (IOException e) {
                    e.printStackTrace();
                } catch (TimeoutException e) {
                    Toast.makeText(FriendListActivity.this, "Server timeout, please try again", Toast.LENGTH_SHORT).show();
                }

                friends.add(textViewContent);
                friendEntryAdapter.notifyDataSetChanged();
            }
        });

    }
}