package com.jaam.transittrack;

import android.content.Intent;
import android.os.Bundle;
import android.text.Editable;
import android.text.TextWatcher;
import android.util.Log;
import android.view.View;
import android.widget.ArrayAdapter;
import android.widget.EditText;
import android.widget.ListView;
import android.widget.Toast;

import androidx.annotation.Nullable;
import androidx.appcompat.app.AppCompatActivity;
import androidx.recyclerview.widget.RecyclerView;

import com.google.android.gms.auth.api.signin.GoogleSignIn;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

import okhttp3.Call;
import okhttp3.Callback;
import okhttp3.HttpUrl;
import okhttp3.MediaType;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.RequestBody;
import okhttp3.Response;
import okhttp3.WebSocket;
import okhttp3.WebSocketListener;

public class ChatActivity extends AppCompatActivity implements TextWatcher {
    private static final String TAG = "ChatActivity";
    private String name;
    private WebSocket webSocket;
    private String SERVER_PATH = "ws://4.205.17.106:8081"; // WebSocket server path

    private EditText messageEdit;
    private View sendBtn;
    private OkHttpClient client = new OkHttpClient();
    private static ArrayList<Message> messagesArrayList = new ArrayList<>();
    private static ArrayList<String> messageHistory = new ArrayList<>();
    private ArrayAdapter<String> arrayAdapter;


    private String receiverEmail = "d.trump@example.com";
    //ChatGPT usage: No
        @Override
        protected void onCreate(Bundle savedInstanceState) {
            super.onCreate(savedInstanceState);
            setContentView(R.layout.activity_chat);

            arrayAdapter = new ArrayAdapter<>(this, R.layout.layout_message, R.id.messageTextView, messageHistory);
            ListView chatHistory = findViewById(R.id.messageListView);
            chatHistory.setAdapter(arrayAdapter);

            name = getIntent().getStringExtra("name");
        receiverEmail = getIntent().getStringExtra("receiverEmail");
        getIntent().removeExtra("receiverEmail");
        initiateSocketConnection();
        initializeView();
        makeGetRequestForChatHistory();

    }
    //ChatGPT usage: Partial
    private void sendHttpMessage(String message) {
        JSONObject jsonObject = new JSONObject();
        try {
            jsonObject.put("name", name);
            jsonObject.put("message", message);

            MediaType JSON = MediaType.parse("application/json; charset=utf-8");
            RequestBody requestBody = RequestBody.create(JSON, jsonObject.toString());

            Request request = new Request.Builder()
                    .url(SERVER_PATH) // Use your server URL for posting messages
                    .post(requestBody)
                    .build();

            OkHttpClient client = new OkHttpClient();
            client.newCall(request).execute();

            // Clear the message edit text or perform any UI update after sending the message
        } catch (JSONException e) {
            e.printStackTrace();
        } catch (IOException e) {
            throw new RuntimeException(e);
        }
    }
    //ChatGPT usage: No
    private void initiateSocketConnection() {
        OkHttpClient client = new OkHttpClient();
        Request request = new Request.Builder().url(SERVER_PATH).build();
        webSocket = client.newWebSocket(request, new SocketListener());
    }

    @Override
    public void beforeTextChanged(CharSequence s, int start, int count, int after) {

    }

    @Override
    public void onTextChanged(CharSequence charSequence, int i, int i1, int i2) {

    }

    //ChatGPT usage: No
    @Override
    public void afterTextChanged(Editable s) {

        String string = s.toString().trim();

        String str = s.toString();

        if (string.isEmpty()) {
            resetMessageEdit();
        } else {

            sendHttpMessage(string); // Invoke sending message via HTTP
            Log.d("Sent message inside ChatActivity: ", str);

            sendBtn.setVisibility(View.VISIBLE);
        }

    }
    //ChatGPT usage: No
    private void resetMessageEdit() {

        messageEdit.removeTextChangedListener(this);

        messageEdit.setText("");
        sendBtn.setVisibility(View.INVISIBLE);

        messageEdit.addTextChangedListener(this);


    }
    //ChatGPT usage: No
    private class SocketListener extends WebSocketListener {

        @Override
        public void onOpen(WebSocket webSocket, Response response) {
            super.onOpen(webSocket, response);

            runOnUiThread(() -> {
                Toast.makeText(ChatActivity.this,
                        "Socket Connection Successful!",
                        Toast.LENGTH_SHORT).show();

                Log.d(TAG, "Socket Connection Successful!");

                initializeView();
            });

        }
        //ChatGPT usage: No
        @Override
        public void onMessage(WebSocket webSocket, String text) {
            super.onMessage(webSocket, text);

            runOnUiThread(() -> {

                try {
                    JSONObject jsonObject = new JSONObject(text);

                    Log.d(TAG, "Message sent: " + jsonObject);

                    postMessageToServer(jsonObject.toString());

                } catch (JSONException e) {
                    e.printStackTrace();
                }

            });

        }
    }
    //ChatGPT usage: No
    private void initializeView() {

        messageEdit = findViewById(R.id.messageEdit);
        sendBtn = findViewById(R.id.sendBtn);

        messageEdit.addTextChangedListener(this);


        sendBtn.setOnClickListener(v -> {

            JSONObject jsonObject = new JSONObject();


            try {
                jsonObject.put("message", messageEdit.getText().toString());

                webSocket.send(jsonObject.toString());

                arrayAdapter.clear();
                messagesArrayList.clear();
                postMessageToServer(jsonObject.getString("message"));



                resetMessageEdit();

            } catch (JSONException e) {
                e.printStackTrace();
            }

            for (Message msg : messagesArrayList) {
                arrayAdapter.add(msg.getSender() + ": " + msg.getMessageContent());
            }

        });

    }
    //ChatGPT usage: No
    public void parseChatHistory(JSONArray chatHistory) {

//        clearMessages();

        for (int i = 0; i < chatHistory.length(); i++) {
            try {
                JSONObject message = chatHistory.getJSONObject(i);
                Message currMsg = new Message(message.getString("senderEmail"), message.getString("receiverEmail"), message.getString("text"));
                messagesArrayList.add(currMsg);
                arrayAdapter.add(message.getString("senderEmail") +": "+ message.getString("text"));
                Log.d(TAG, message.toString());
                arrayAdapter.notifyDataSetChanged();

            } catch (JSONException e) {
                e.printStackTrace();
            }
        }
    }

    //ChatGPT usage: No
    private void makeGetRequestForChatHistory() {
        //String url = "http://4.205.17.106:8081/api/chat/history";

        HttpUrl url = HttpUrl.parse("https://4.205.17.106:8081/api/chat/history").newBuilder()
                .addQueryParameter("senderEmail", GoogleSignIn.getLastSignedInAccount(this).getEmail())
                .addQueryParameter("receiverEmail", receiverEmail)
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
                Log.e(TAG, "Failed to fetch chat history: " + e.getMessage());
            }

            @Override
            public void onResponse(Call call, Response response) throws IOException {
                if (response.isSuccessful()) {
                    String responseData = response.body().string();
                    Log.d(TAG,"makeGetRequestForChatHistory successful: "+ responseData);
                    // Process the chat history data here and update the adapter
                    try {
                        JSONArray historyArray = new JSONArray(responseData);
//                        parseChatHistory(historyArray);
                        runOnUiThread(() -> parseChatHistory(historyArray));
                    } catch (JSONException e) {
                        Log.d(TAG, "makeGetRequestForChatHistory Failed: "+ e.getMessage());
                        e.printStackTrace();
                    }
                } else {
                    // Handle unsuccessful response
                    Log.e(TAG, "Failed to fetch chat history. Server returned non-successful response: " + response.code());
                }
            }
        });
    }


    @Override
    protected void onActivityResult(int requestCode, int resultCode, @Nullable Intent data) {
        super.onActivityResult(requestCode, resultCode, data);

    }


    private void postMessageToServer(String message) {
        String url = "https://4.205.17.106:8081/api/chat/send";


        if (message != null && !message.isEmpty()) {

            JSONObject jsonBody = new JSONObject();
            try {

                jsonBody.put("text", message);
                // for testing notifications
//                jsonBody.put("receiverEmail", GoogleSignIn.getLastSignedInAccount(ChatActivity.this).getEmail());
//                jsonBody.put("senderEmail", "k.west@example.com");
                jsonBody.put("senderEmail", GoogleSignIn.getLastSignedInAccount(ChatActivity.this).getEmail());
                jsonBody.put("receiverEmail", receiverEmail);
            } catch (JSONException e) {
                e.printStackTrace();
            }

            // Create a RequestBody with the JSON data
            RequestBody requestBody = RequestBody.create(
                    MediaType.parse("application/json"), jsonBody.toString());

            Request request = new Request.Builder()
                    .url(url)
                    .post(requestBody)
                    .header("Connection", "close")
                    .build();


            Log.d(TAG, "Req: " + request.toString());

            client.newCall(request).enqueue(new Callback() {
                @Override
                public void onFailure(Call call, IOException e) {
                    e.printStackTrace();
                    // Handle the failure here
                    Log.e(TAG, "Failed to send message: " + e.getMessage(), e);
                    Log.e(TAG, "Message content:" + request);
                    runOnUiThread(new Runnable() {
                        @Override
                        public void run() {
                            Toast.makeText(ChatActivity.this, "Failed to send message please try again", Toast.LENGTH_SHORT).show();
                        }
                    });
                }

                @Override
                public void onResponse(Call call, Response response) throws IOException {
                    if (response.isSuccessful()) {
                        String responseString = response.body().string();
//                        // You can process the response as needed
//                        arrayAdapter.add("d.trump@example.com" + message);
                        Log.d(TAG, "Message sent successfully. Response: " + responseString);
                        makeGetRequestForChatHistory();
                    } else {
                        // Handle the unsuccessful response here
                        Log.e(TAG, "Failed to send message. Server returned non-successful response: " + response.code());
                    }
                }
            });
        } else {
            // Log or handle the case where the values are missing or empty
            Log.e(TAG, "Missing or empty message");
        }
    }

}