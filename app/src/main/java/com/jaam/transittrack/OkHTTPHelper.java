package com.jaam.transittrack;


import android.util.Log;

import org.json.JSONObject;

import java.io.IOException;

import okhttp3.MediaType;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.RequestBody;
import okhttp3.Response;

public class OkHTTPHelper {
    static final private String BASE_URL = "http://10.0.2.2:3000";
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
        Response response = client.newCall(request).execute();

    }
    static String getRoute(JSONObject endPoints) throws IOException{
        RequestBody requestBody = RequestBody.create(endPoints.toString(), JSON);
        Request request = new Request.Builder()
                .url(BASE_URL + "/route")
                .post(requestBody)
                .build();
        Response response = client.newCall(request).execute();
        return response.body().string();
    }
}
