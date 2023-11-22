package com.jaam.transittrack;

import androidx.appcompat.app.AlertDialog;
import androidx.appcompat.app.AppCompatActivity;

import android.content.DialogInterface;
import android.os.Bundle;
import android.os.StrictMode;
import android.text.Editable;
import android.text.TextWatcher;
import android.util.Log;
import android.view.View;
import android.widget.Button;
import android.widget.EditText;
import android.widget.ListView;
import android.widget.Toast;

import com.google.android.gms.auth.api.signin.GoogleSignIn;
import com.google.android.material.floatingactionbutton.FloatingActionButton;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.TimeoutException;

import okhttp3.Call;
import okhttp3.Callback;
import okhttp3.HttpUrl;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.Response;

public class FriendListActivity extends AppCompatActivity {

    private EditText friendEmailTextView;
    private ArrayList<String> friends = new ArrayList<>();

    private static final String TAG = "FriendsListActivity";
    private Button addFriendButton;
    private FloatingActionButton refreshFriendsListBtn;

    FriendEntryAdapter friendEntryAdapter;

    private OkHttpClient client = new OkHttpClient();

    //ChatGPT usage: No
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_friend_list);

        StrictMode.ThreadPolicy policy = new StrictMode.ThreadPolicy.Builder().permitAll().build();
        StrictMode.setThreadPolicy(policy);


        friendEntryAdapter = new FriendEntryAdapter(friends, this);
        ListView friendListView = findViewById(R.id.friendListView);
        friendListView.setAdapter(friendEntryAdapter);

        addFriendButton = findViewById(R.id.addFriendButton);

        refreshFriendsListBtn = findViewById(R.id.friendsListRefreshButton);

        friendEmailTextView = findViewById(R.id.friendEmailEditText);
        //ChatGPT usage: No
        friendEmailTextView.addTextChangedListener(new TextWatcher() {
            @Override
            public void beforeTextChanged(CharSequence s, int start, int count, int after) {
                //Intentionally left blank
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
                //Intentionally left blank
            }
        });
        //ChatGPT usage: No
        addFriendButton.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                String textViewContent = String.valueOf(friendEmailTextView.getText());
                JSONObject friendReqBody = new JSONObject();
                try {
                    friendReqBody.put("userEmail", GoogleSignIn.getLastSignedInAccount(FriendListActivity.this).getEmail());
                    friendReqBody.put("friendEmail", textViewContent);
                } catch (JSONException e) {
                    e.printStackTrace();
                }
                try {
                    String responseString = OkHTTPHelper.sendFriendRequest(friendReqBody);
                    if (responseString.equals("Friend not found in the database."))
                        showNewErrorAlertDialog("Friend", "Email is not registered with a user. \nPlease try a different one.");
                    else {
                        friends.add(textViewContent);
                        friendEntryAdapter.notifyDataSetChanged();
                    }
                } catch (IOException e) {
                    e.printStackTrace();
                } catch (TimeoutException e) {
                    Toast.makeText(FriendListActivity.this, "Server timeout, please try again", Toast.LENGTH_SHORT).show();
                }
            }
        });


        refreshFriendsListBtn.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                makeGetRequestForFriendsList();

                //Toast.makeText(FriendListActivity.this, "Friends List Received", Toast.LENGTH_SHORT).show();
            }
        });
        makeGetRequestForFriendsList();
    }

    public List<String> parseFriendsListJson(String jsonString) {
        List<String> emailList = new ArrayList<>();

        try {
            JSONObject jsonObject = new JSONObject(jsonString);
            JSONArray friendsList = jsonObject.getJSONArray("FriendsList");

            // Iterate through the array and extract emails
            for (int i = 0; i < friendsList.length(); i++) {
                String email = friendsList.getString(i);
                emailList.add(email);
            }

        } catch (JSONException e) {
            e.printStackTrace();
        }
        friends.clear();
        Log.d(TAG, "Parsed Email List: " + emailList);

        for (String email : emailList) {
            friends.add(email);
        }

        Log.d(TAG, "Friends post refresh: " + friends);

        friendEntryAdapter.notifyDataSetChanged();
        return emailList;
    }

    private void makeGetRequestForFriendsList() {

        HttpUrl url = HttpUrl.parse("https://20.200.125.197:8081/getFriendList").newBuilder()
                .addQueryParameter("userEmail", GoogleSignIn.getLastSignedInAccount(this).getEmail())
                .build();
        Request request = new Request.Builder()
                .url(url)
                .get()
                .header("Connection", "close")
                .build();

        client.newCall(request).enqueue(new Callback() {
            @Override
            public void onFailure(Call call, IOException e) {
                e.printStackTrace();
                // Handle failure here
                Log.e(TAG, "Failed to fetch friends list: " + e.getMessage());
            }

            @Override
            public void onResponse(Call call, Response response) throws IOException {
                if (response.isSuccessful()) {
                    String responseData = response.body().string();
                    Log.d(TAG, "makeGetRequestFriendsList successful: " + responseData);
                    try {
                        JSONObject historyArray = new JSONObject(responseData);
                        runOnUiThread(() -> parseFriendsListJson(String.valueOf(historyArray)));
                    } catch (JSONException e) {
                        Log.d(TAG, "makeGetRequestFriendsList Failed: " + e.getMessage());
                        e.printStackTrace();
                    }
                } else {
                    // Handle unsuccessful response
                    Log.e(TAG, "Failed to fetch friends list. Server returned non-successful response: " + response.code());
                }
            }
        });
    }

    private void showNewErrorAlertDialog(String title, String message) {
        new AlertDialog.Builder(FriendListActivity.this).setTitle(title).setMessage(message)
                .setPositiveButton("OK", new DialogInterface.OnClickListener() {
                    @Override
                    public void onClick(DialogInterface dialog, int which) {
                        dialog.dismiss();
                    }
                }).create().show();
    }
}