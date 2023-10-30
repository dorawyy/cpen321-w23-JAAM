package com.example.chatcomponent321;

import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.util.Base64;
import android.util.Log;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.ImageView;
import android.widget.TextView;

import androidx.annotation.NonNull;
import androidx.recyclerview.widget.RecyclerView;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

import okhttp3.Call;
import okhttp3.Callback;
import okhttp3.FormBody;
import okhttp3.MediaType;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.RequestBody;
import okhttp3.Response;

import android.os.Handler;


public class MessageAdapter extends RecyclerView.Adapter<RecyclerView.ViewHolder> {
    private static final String TAG ="MessageAdapter";
    private static final int TYPE_MESSAGE_SENT = 0;
    private static final int TYPE_MESSAGE_RECEIVED = 1;
    private static final int TYPE_IMAGE_SENT = 2;
    private static final int TYPE_IMAGE_RECEIVED = 3;
    private LayoutInflater inflater;
    private List<JSONObject> messages = new ArrayList<>();
    private OkHttpClient client = new OkHttpClient();
    private Handler mHandler = new Handler();
    private boolean mStopConditionCheck = false;

//    String currentUserID = "789";



    public MessageAdapter (LayoutInflater inflater) {

        this.inflater = inflater;
//        mHandler.postDelayed(mTimerRunnable, 5000);
    }

//    private Runnable mTimerRunnable = new Runnable() {
//        @Override
//        public void run() {
//            // Make GET request to fetch chat history
//            makeGetRequestForChatHistory();
//
//            // Repeat this runnable after 2 seconds
////            mHandler.postDelayed(this, 5000);
//        }
//    };

    private class SentMessageHolder extends RecyclerView.ViewHolder {
        TextView messageTxt;
        public SentMessageHolder(@NonNull View itemView) {
            super(itemView);
            messageTxt = itemView.findViewById(R.id.sentTxt);
//            messageTxt.setText();

            String messageStr = messageTxt.getText().toString();
//            Log.d(TAG, "Sent message: "+ messageStr);
        }
    }

    private class SentImageHolder extends RecyclerView.ViewHolder {
        ImageView imageView;
        public SentImageHolder(@NonNull View itemView) {
            super(itemView);
            imageView = itemView.findViewById(R.id.imageView);
        }
    }

    private class ReceivedMessageHolder extends RecyclerView.ViewHolder {
        TextView nameTxt, messageTxt;
        public ReceivedMessageHolder(@NonNull View itemView) {
            super(itemView);
            nameTxt = itemView.findViewById(R.id.nameTxt);
            messageTxt = itemView.findViewById(R.id.receivedTxt);
        }
    }

    private class ReceivedImageHolder extends RecyclerView.ViewHolder {
        ImageView imageView;
        TextView nameTxt;
        public ReceivedImageHolder(@NonNull View itemView) {
            super(itemView);
            imageView = itemView.findViewById(R.id.imageView);
            nameTxt = itemView.findViewById(R.id.nameTxt);

        }
    }


    @Override
    public int getItemViewType(int position) {
        JSONObject message = messages.get(position);

        try {
            if (message.getString("senderEmail").equals("d.trump@example.com")) {
                // Message is from the current user (sender)
                if (message.has("message")) {
                    return TYPE_MESSAGE_SENT;
                }else{
                    return  TYPE_MESSAGE_SENT;
                }
            } else {
                // Message is from the receiver
                if (message.has("message")) {
                    return TYPE_MESSAGE_RECEIVED;
                }
                else{
                    return TYPE_IMAGE_RECEIVED;
                }
            }
        } catch (JSONException e) {
            e.printStackTrace();
        }
        return -1;
    }

    public JSONObject getMessage(int position) {
        if (position >= 0 && position < messages.size()) {
            return messages.get(position);
        }
        return null;
    }

    @NonNull
    @Override
    public RecyclerView.ViewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        View view;
        switch (viewType) {
            case TYPE_MESSAGE_SENT:
                view = inflater.inflate(R.layout.item_sent_message, parent, false);
                return new SentMessageHolder(view);
            case TYPE_MESSAGE_RECEIVED:
                view = inflater.inflate(R.layout.item_received_message, parent, false);
                return new ReceivedMessageHolder(view);
//            case TYPE_IMAGE_SENT:
//                view = inflater.inflate(R.layout.item_sent_image, parent, false);
//                return new SentImageHolder(view);
//            case TYPE_IMAGE_RECEIVED:
//                view = inflater.inflate(R.layout.item_receive_photo, parent, false);
//                return new ReceivedImageHolder(view);
        }
        return null;
    }



    @Override
    public void onBindViewHolder(@NonNull RecyclerView.ViewHolder holder, int position) {
        JSONObject message = messages.get(position);

        try {
//            if (message.getBoolean("isSent"))
            if (message.getString("senderEmail").equals("d.trump@example.com"))
            {
                if (message.has("message")) {
                    SentMessageHolder messageHolder = (SentMessageHolder) holder;
                    String final_message = message.getString("message");
                    String final_message_userID = message.getString("name");
                    messageHolder.messageTxt.setText(final_message);

                    Log.d(TAG, "POST Sent Message: " + final_message);
                    Log.d(TAG, "POST Sent User ID: " + final_message_userID);

//                    postMessageToServer(final_message);
                }
//                else {
//                    SentImageHolder imageHolder = (SentImageHolder) holder;
//                    Bitmap bitmap = getBitmapFromString(message.getString("image"));
//                    imageHolder.imageView.setImageBitmap(bitmap);
//                }
            } else {
                if (message.has("message")) {
                    ReceivedMessageHolder messageHolder = (ReceivedMessageHolder) holder;
//                    String final_receiverID = message.getString("name");
                    String final_receiverID = "k.west@example.com";
                    messageHolder.nameTxt.setText(final_receiverID);
                    String final_message = message.getString("message");
                    messageHolder.messageTxt.setText(final_message);

                    Log.d(TAG, "POST Receiver ID: " + final_receiverID);
                    Log.d(TAG, "Received Message: " + final_message);

//                    postMessageToServer(final_message);
                }
            }
        } catch (JSONException e) {
            e.printStackTrace();
        }
    }


    private void makeGetRequestForChatHistory() {
        String url = "http://4.205.17.106:8081/api/chat/history";
        // Replace 'currentUserID' with the actual ID of the current user
        String currentUserID = "789";

        Request request = new Request.Builder()
                .url(url)
                .get()
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
                    // Process the chat history data here and update the adapter
                    try {
                        JSONArray historyArray = new JSONArray(responseData);
                        // Clear existing messages before adding new ones
//                        messages.clear();
//                        parseChatHistory(historyArray);

                        for (int i = 0; i < historyArray.length(); i++) {
                            JSONObject message = historyArray.getJSONObject(i);
                            Log.d(TAG, historyArray.toString());
                            messages.add(message);
                        }
                        // Notify adapter about data changes on the main thread
//                        mHandler.post(() -> notifyDataSetChanged());
                    } catch (JSONException e) {
                        e.printStackTrace();
                    }
                } else {
                    // Handle unsuccessful response
                    Log.e(TAG, "Failed to fetch chat history. Server returned non-successful response: " + response.code());
                }
            }
        });
    }


    public void parseChatHistory(JSONArray chatHistory) {

        clearMessages();

        for (int i = 0; i < chatHistory.length(); i++) {
            try {
                JSONObject message = chatHistory.getJSONObject(i);
                String senderEmail = message.getString("senderEmail");

                if (senderEmail.equals("d.trump@example.com")) {
                    // If the message is from "d.trump@example.com", display as sent message
                    addMessage(message, TYPE_MESSAGE_SENT);
                } else {
                    // If the message is from another sender, display as received message
                    addMessage(message, TYPE_MESSAGE_RECEIVED);
                }
            } catch (JSONException e) {
                e.printStackTrace();
            }
        }
    }

    private void addMessage(JSONObject message, int messageType) {
        try {
            if (message.has("text")) {
                // Add message to the adapter based on the message type (sent or received)
                switch (messageType) {
                    case TYPE_MESSAGE_SENT:
                        addSentMessage(message.getString("text"));
                        break;
                    case TYPE_MESSAGE_RECEIVED:
                        addReceivedMessage(message.getString("text"));
                        break;
                    // Add cases for other message types if necessary
                }
            }
        } catch (JSONException e) {
            e.printStackTrace();
        }
    }

    private void addSentMessage(String message) {
        JSONObject sentMessage = new JSONObject();
        try {
            sentMessage.put("message", message);
            messages.add(sentMessage);
            notifyDataSetChanged();
        } catch (JSONException e) {
            e.printStackTrace();
        }
    }

    public void clearMessages() {
        messages.clear();
        notifyDataSetChanged();
    }
    private void addReceivedMessage(String message) {
        JSONObject receivedMessage = new JSONObject();
        try {
            receivedMessage.put("message", message);
            messages.add(receivedMessage);
            notifyDataSetChanged();
        } catch (JSONException e) {
            e.printStackTrace();
        }
    }

    @Override
    public int getItemCount() {
        return messages.size();
    }

    public void addItem (JSONObject jsonObject) {
        messages.add(jsonObject);
        notifyDataSetChanged();
    }

}


//    @NonNull
//    @Override
//    public RecyclerView.ViewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
//
//        View view;
//
//        switch (viewType) {
//            case TYPE_MESSAGE_SENT:
//                view = inflater.inflate(R.layout.item_sent_message, parent, false);
//                return new SentMessageHolder(view);
//            case TYPE_MESSAGE_RECEIVED:
//
//                view = inflater.inflate(R.layout.item_received_message, parent, false);
//                return new ReceivedMessageHolder(view);
//
//            case TYPE_IMAGE_SENT:
//
//                view = inflater.inflate(R.layout.item_sent_image, parent, false);
//                return new SentImageHolder(view);
//
//            case TYPE_IMAGE_RECEIVED:
//
//                view = inflater.inflate(R.layout.item_receive_photo, parent, false);
//                return new ReceivedImageHolder(view);
//
//        }
//
//        return null;
//    }


//    private Bitmap getBitmapFromString(String image) {
//
//        byte[] bytes = Base64.decode(image, Base64.DEFAULT);
//        return BitmapFactory.decodeByteArray(bytes, 0, bytes.length);
//    }



//    @Override
//    public void onBindViewHolder(@NonNull RecyclerView.ViewHolder holder, int position) {
//
//        JSONObject message = messages.get(position);
//
//        try {
//            if (message.getBoolean("isSent")) {
//
//                if (message.has("message")) {
//
//                    SentMessageHolder messageHolder = (SentMessageHolder) holder;
//                    messageHolder.messageTxt.setText(message.getString("message"));
//
//                } else {
//
//                    SentImageHolder imageHolder = (SentImageHolder) holder;
//                    Bitmap bitmap = getBitmapFromString(message.getString("image"));
//
//                    imageHolder.imageView.setImageBitmap(bitmap);
//
//                }
//
//            } else {
//
//                if (message.has("message")) {
//
//                    ReceivedMessageHolder messageHolder = (ReceivedMessageHolder) holder;
//                    messageHolder.nameTxt.setText(message.getString("name"));
//                    messageHolder.messageTxt.setText(message.getString("message"));
//
//                } else {
//
//                    ReceivedImageHolder imageHolder = (ReceivedImageHolder) holder;
//                    imageHolder.nameTxt.setText(message.getString("name"));
//
//                    Bitmap bitmap = getBitmapFromString(message.getString("image"));
//                    imageHolder.imageView.setImageBitmap(bitmap);
//
//                }
//
//            }
//        } catch (JSONException e) {
//            e.printStackTrace();
//        }
//
//    }



//    @Override
//    public int getItemViewType(int position) {
//
//        JSONObject message = messages.get(position);
//
//        try {
//            if (message.getBoolean("isSent")) {
//
//                if (message.has("message")) {
//                    String final_message = message.getString("message");
//                    String final_message_userID = message.getString("name");
//
//
////                    Log.d(TAG,"Final message:" + message.get("message"));
//                    Log.d(TAG,"Final message Sent:" + final_message);
//                    Log.d(TAG,"Final message Name:" + final_message_userID);
//                    return TYPE_MESSAGE_SENT;
//                }
//                else
//                    return TYPE_IMAGE_SENT;
//
//            } else {
//
//                if (message.has("message"))
//                    return TYPE_MESSAGE_RECEIVED;
//                else
//                    return TYPE_IMAGE_RECEIVED;
//
//            }
//        } catch (JSONException e) {
//            e.printStackTrace();
//        }
//
//        return -1;
//    }


//    private void postMessageToServer(String message) {
//        String url = "http://4.205.17.106:8081/api/chat/send";
//
//        String username = "963";
//        String credentials1 = username;
//        String base64Credentials = Base64.encodeToString(credentials1.getBytes(), Base64.NO_WRAP);
//
//
//        if (message != null || !message.isEmpty()) {
//
//            JSONObject jsonBody = new JSONObject();
//            try {
//
//                jsonBody.put("text", message);
//            } catch (JSONException e) {
//                e.printStackTrace();
//            }
//
//            // Create a RequestBody with the JSON data
//            RequestBody requestBody = RequestBody.create(
//                    MediaType.parse("application/json"), jsonBody.toString());
//
//            Request request = new Request.Builder()
//                    .url(url)
//                    .addHeader("Authorization", "Basic " + base64Credentials)
//                    .post(requestBody)
//                    .build();
//
//
//            Log.d(TAG, "Req: " + request.toString());
//
//            client.newCall(request).enqueue(new Callback() {
//                @Override
//                public void onFailure(Call call, IOException e) {
//                    e.printStackTrace();
//                    // Handle the failure here
//                    Log.e(TAG, "Failed to send message: " + e.getMessage());
//                }
//
//                @Override
//                public void onResponse(Call call, Response response) throws IOException {
//                    if (response.isSuccessful()) {
//                        // Handle the successful response here
//                        String responseString = response.body().string();
//                        // You can process the response as needed
//                        Log.d(TAG, "Message sent successfully. Response: " + responseString);
//                    } else {
//                        // Handle the unsuccessful response here
//                        Log.e(TAG, "Failed to send message. Server returned non-successful response: " + response.code());
//                    }
//                }
//            });
//        } else {
//            // Log or handle the case where the values are missing or empty
//            Log.e(TAG, "Missing or empty message");
//        }
//    }



