package com.jaam.transittrack;

import androidx.annotation.NonNull;
import androidx.appcompat.app.AppCompatActivity;
import androidx.core.app.ActivityCompat;

import android.Manifest;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.location.Address;
import android.location.Location;
import android.location.Geocoder;
import android.location.LocationListener;
import android.location.LocationManager;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.os.StrictMode;
import android.text.Editable;
import android.text.TextWatcher;
import android.util.Log;
import android.view.View;
import android.widget.ArrayAdapter;
import android.widget.EditText;
import android.widget.ListView;

import com.google.android.material.floatingactionbutton.FloatingActionButton;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.io.IOException;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

public class RouteActivity extends AppCompatActivity implements LocationListener {

    private EditText searchTextView;
    private FloatingActionButton searchButton;

    private FloatingActionButton chatButton;
    private FloatingActionButton friendListButton;
    private Location currLocation;

    private ListView stopListView;
    private static ArrayList<String> stops = new ArrayList<String>();

    private String board, disembark;

    protected LocationManager locationManager;
    final static String TAG = "RouteActivity";

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_route);
        //work around for not running http requests off main thread. really don't want to deal with race conditions/synchronization
        StrictMode.ThreadPolicy policy = new StrictMode.ThreadPolicy.Builder().permitAll().build();
        StrictMode.setThreadPolicy(policy);
        Log.d(TAG, "In Route Activity");
        locationManager = (LocationManager) getSystemService(this.LOCATION_SERVICE);
        ExecutorService executor = Executors.newSingleThreadExecutor();
        Handler handler = new Handler(Looper.getMainLooper());
        if (ActivityCompat.checkSelfPermission(this, Manifest.permission.ACCESS_FINE_LOCATION) != PackageManager.PERMISSION_GRANTED && ActivityCompat.checkSelfPermission(this, Manifest.permission.ACCESS_COARSE_LOCATION) != PackageManager.PERMISSION_GRANTED) {
            // TODO: Consider calling
            //    ActivityCompat#requestPermissions
            // here to request the missing permissions, and then overriding
            //   public void onRequestPermissionsResult(int requestCode, String[] permissions,
            //                                          int[] grantResults)
            // to handle the case where the user grants the permission. See the documentation
            // for ActivityCompat#requestPermissions for more details.
            return;
        }
        locationManager.requestLocationUpdates(LocationManager.GPS_PROVIDER, 0, 0, this);

        searchButton = findViewById(R.id.searchButton);
        searchTextView = findViewById(R.id.searchTextField);
        stopListView = findViewById(R.id.stopList);
        findViewById(R.id.routeLoadingProgressBar).setVisibility(View.INVISIBLE);

        chatButton = findViewById(R.id.chatButton);
        friendListButton = findViewById(R.id.friendListButton);


        findViewById(R.id.calendarActivityButton).setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                Intent calendarIntent = new Intent(RouteActivity.this, CalendarActivity.class);
                startActivity(calendarIntent);
            }
        });

        ArrayAdapter<String> arrayAdapter = new ArrayAdapter<String>(this, R.layout.route_layout, R.id.textView2, stops);
        stopListView.setAdapter(arrayAdapter);

        searchTextView.addTextChangedListener(new TextWatcher() {

            @Override
            public void beforeTextChanged(CharSequence s, int start, int count, int after) {

            }

            @Override
            public void onTextChanged(CharSequence s, int start, int before, int count) {
                //TODO maybe put in its own function
                if (s.length() < 1) {
                    searchButton.setAlpha(.5f);
                    searchButton.setClickable(false);

                } else {
                    searchButton.setAlpha(1f);
                    searchButton.setClickable(true);
                }
            }

            @Override
            public void afterTextChanged(Editable s) {

            }
        });
        searchButton.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                //TODO put this in its own function
                try {
                    findViewById(R.id.routeLoadingProgressBar).setVisibility(View.VISIBLE);
                    stops.clear();
                    JSONArray[] routeArray = new JSONArray[1];
                    JSONObject start, end;

                    String routeString = null;
                    try {
                        routeString = getRoute(currLocation, String.valueOf(searchTextView.getText()));
                    } catch (JSONException e) {
                        throw new RuntimeException(e);
                    } catch (IOException e) {
                        throw new RuntimeException(e);
                    }
                    Log.d(TAG, routeString);
                    try {
                        routeArray[0] = new JSONArray(routeString);
                    } catch (JSONException e) {
                        throw new RuntimeException(e);
                    }
                    Log.d(TAG, Arrays.toString(routeArray));
                    Log.d(TAG, String.valueOf(routeArray[0]));
                    Log.d(TAG, String.valueOf(routeArray[0].length()));
                    JSONArray route = routeArray[0];
                    for (int i = 0; i < route.length(); i++) {
                        Log.d(TAG, "Adding route" + i);
                        start = route.getJSONObject(i).getJSONObject("Start");
                        end = route.getJSONObject(i).getJSONObject("End");
                        board = start.getString("Time") + ": Board " + start.getString("Bus") + " @ " + start.getString("Stop");
                        disembark = end.get("Time") + ": Disembark " + end.getString("Bus") + " @ " + end.getString("Stop");
                        arrayAdapter.add(board);
                        arrayAdapter.add(disembark);
                        arrayAdapter.notifyDataSetChanged();

                    }

                } catch (JSONException e) {
                    throw new RuntimeException(e);
                }
                findViewById(R.id.routeLoadingProgressBar).setVisibility(View.INVISIBLE);
            }
        });

        chatButton.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                Intent chatIntent = new Intent(RouteActivity.this, ChatActivity.class);
                startActivity(chatIntent);

            }
        });

    }

    @Override
    public void onLocationChanged(@NonNull Location location) {
        currLocation = location;
    }

    /**
     * Retrieves a route between the current location and a destination using a geocoder and an HTTP request.
     * <p>
     * This method takes the current location and a destination address as input, geocodes the address to obtain its
     * latitude and longitude, and then sends an HTTP request to a server to obtain a route between the current location
     * and the destination. The route information is returned as a JSON string.
     *
     * @param currLocation The current location from which the route will start.
     * @param search       The destination address or place to which the route is needed.
     * @return A JSON string containing route information between the current location and the destination.
     * @throws JSONException If there are issues with JSON parsing.
     * @throws IOException   If there are network or I/O-related issues.
     *                       <p>
     *                       Usage:
     *                       - Call this method to obtain a route between the current location and a destination.
     *                       - Ensure that the device has an internet connection for geocoding and making HTTP requests.
     *                       <p>
     *                       Example usage:
     *                       ```
     *                       Location currentLocation = // Get the current location from a LocationProvider.
     *                       String destination = "1600 Amphitheatre Parkway, Mountain View, CA"; // Destination address or place.
     *                       String routeJson = getRoute(currentLocation, destination);
     *                       // Process the routeJson to display the route information on a map, for example.
     *                       ```
     *                       <p>
     *                       Note:
     *                       - This method assumes that the `OkHTTPHelper.getRoute` method is implemented and functioning as expected.
     *                       - It also assumes that the `BASE_URL` and JSON format are correctly configured in the `OkHTTPHelper` class.
     */
    private String getRoute(Location currLocation, String search) throws JSONException, IOException {
        Geocoder geocoder = new Geocoder(this);
        JSONObject endPoints = new JSONObject();
        endPoints.put("start", new double[]{currLocation.getLatitude(), currLocation.getLongitude()});
        List<Address> addressList = geocoder.getFromLocationName(search, 1);
        Address address;
        if (addressList.size() > 0) {
            address = addressList.get(0);
            endPoints.put("end", new double[]{address.getLatitude(), address.getLongitude()});
        }
        return OkHTTPHelper.getRoute(endPoints);
    }

}