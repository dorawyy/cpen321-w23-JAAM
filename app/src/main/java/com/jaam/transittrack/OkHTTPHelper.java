package com.jaam.transittrack;


import org.json.JSONObject;

import java.io.IOException;

import okhttp3.MediaType;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.RequestBody;
import okhttp3.Response;

public class OkHTTPHelper {
    static final private String BASE_URL = "127.0.0.1";
    public static final MediaType JSON
            = MediaType.parse("application/json; charset=utf-8");

    static OkHttpClient client = new OkHttpClient();
    //@POST
    static String createUser(JSONObject user) throws IOException {
        RequestBody requestBody = RequestBody.create(user.toString(), JSON);
        Request request = new Request.Builder()
                .url(BASE_URL + "/createUser")
                .post(requestBody)
                .build();
        Response response = client.newCall(request).execute();
        return response.body().string();

    }
}
