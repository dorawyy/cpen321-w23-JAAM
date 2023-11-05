package com.jaam.transittrack;



import org.json.JSONObject;

import java.io.IOException;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.TimeoutException;


import okhttp3.MediaType;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.RequestBody;
import okhttp3.Response;

public class OkHTTPHelper {
    static final private String BASE_URL = "https://4.205.17.106:8081";
    public static final MediaType JSON
            = MediaType.parse("application/json");

    static OkHttpClient client = new OkHttpClient.Builder()
            .connectTimeout(20, TimeUnit.SECONDS)
            .readTimeout(60, TimeUnit.SECONDS)
            .writeTimeout(60, TimeUnit.SECONDS)
            .build();

    //ChatGPT usage: No
    //@POST
    static void createUser(JSONObject user) throws IOException {
        RequestBody requestBody = RequestBody.create(user.toString(), JSON);
        Request request = new Request.Builder()
                .url(BASE_URL + "/createUser")
                .post(requestBody)
                .header("Connection", "close")
                .build();
        client.newCall(request).execute();

    }
    //ChatGPT usage: No
    static String getRoute(JSONObject endPoints) throws IOException , TimeoutException{

        RequestBody requestBody = RequestBody.create(endPoints.toString(), JSON);
        Request request = new Request.Builder()
                .url(BASE_URL + "/getRoute")
                .post(requestBody)
                .header("Connection", "close")
                .build();
        Response response = client.newCall(request).execute();
        return response.body().string();
    }
    //ChatGPT usage: No
    static String getChatHistory() throws IOException, TimeoutException{
        Request request = new Request.Builder()
                .url(BASE_URL + "/api/chat/history")
                .header("Connection", "close")
                .build();
        Response response = client.newCall(request).execute();
        return response.body().string();
    }
    //ChatGPT usage: No
    static void sendFriendRequest(JSONObject body) throws IOException, TimeoutException{
        RequestBody reqBody = RequestBody.create(body.toString(), JSON);
        Request request = new Request.Builder()
                .url(BASE_URL + "/addFriend")
                .post(reqBody)
                .header("Connection", "close")
                .build();
        client.newCall(request).execute();
    }
    //ChatGPT usage: No
    static String sendCalendar(JSONObject req) throws IOException, TimeoutException{
        RequestBody reqBody = RequestBody.create(req.toString(), JSON);
        Request request = new Request.Builder()
                .url(BASE_URL + "/getFormattedSubtractedTime")
                .post(reqBody)
                .header("Connection", "close")
                .build();
        Response response = client.newCall(request).execute();
        return response.body().string();
    }
    //ChatGPT usage: No
    static String getFriendRoute(JSONObject jsonObj) throws IOException, TimeoutException {
        RequestBody requestBody = RequestBody.create(jsonObj.toString(),JSON);
        Request request = new Request.Builder()
                .url(BASE_URL + "/getFriendRoute")
                .post(requestBody)
                .header("Connection", "close")
                .build();
        Response response = client.newCall(request).execute();
        return response.body().string();
    }
}
