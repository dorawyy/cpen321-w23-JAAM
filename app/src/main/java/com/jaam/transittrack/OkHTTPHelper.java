package com.jaam.transittrack;


import android.util.Log;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.IOException;

import okhttp3.MediaType;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.RequestBody;
import okhttp3.Response;

public class OkHTTPHelper {
    static final private String BASE_URL = "http://4.205.17.106:8081";
    public static final MediaType JSON
            = MediaType.parse("application/json");

    static OkHttpClient client = new OkHttpClient();

    //@POST
    static void createUser(JSONObject user) throws IOException {
        RequestBody requestBody = RequestBody.create(user.toString(), JSON);
        Request request = new Request.Builder()
                .url(BASE_URL + "/createUser")
                .post(requestBody)
                .build();
        client.newCall(request).execute();

    }

    static String getRoute(JSONObject endPoints) throws IOException {
        RequestBody requestBody = RequestBody.create(endPoints.toString(), JSON);
        Request request = new Request.Builder()
                .url("http://10.0.2.2:3000" + "/route")
                .post(requestBody)
                .build();
        Response response = client.newCall(request).execute();
        return response.body().string();
    }

    static String getChatHistory() throws IOException{
        Request request = new Request.Builder()
                .url(BASE_URL + "/api/chat/history")
                .build();
        Response response = client.newCall(request).execute();
        return response.body().string();
    }

    static String getLastMessage() throws IOException{
        Request request = new Request.Builder()
                .url(BASE_URL + "/getLastMessage")
                .build();
        Response response = client.newCall(request).execute();
        return response.body().string();
    }

    static void sendFriendRequest(JSONObject body) throws IOException{
        RequestBody reqBody = RequestBody.create(body.toString(), JSON);
        Request request = new Request.Builder()
                .url(BASE_URL + "/addFriend")
                .post(reqBody)
                .build();
        Response response = client.newCall(request).execute();
    }

    static String sendCalendar(JSONArray calendarEvents) throws IOException{
        RequestBody reqBody = RequestBody.create(calendarEvents.toString(), JSON);
        Request request = new Request.Builder()
                .url(BASE_URL + "/getFormattedSubtractedTime")
                .post(reqBody)
                .build();
        Response response = client.newCall(request).execute();
        return response.body().string();
    }
}
