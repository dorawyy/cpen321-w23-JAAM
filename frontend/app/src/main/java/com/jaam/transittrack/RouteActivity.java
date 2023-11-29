package com.jaam.transittrack;

import android.Manifest;
import android.content.DialogInterface;
import android.content.pm.PackageManager;
import android.location.Address;
import android.location.Geocoder;
import android.location.Location;
import android.location.LocationListener;
import android.location.LocationManager;
import android.os.Bundle;
import android.os.StrictMode;
import android.text.Editable;
import android.text.TextWatcher;
import android.util.Log;
import android.view.View;
import android.widget.ArrayAdapter;
import android.widget.EditText;
import android.widget.ListView;
import android.widget.Toast;

import androidx.annotation.NonNull;
import androidx.appcompat.app.AlertDialog;
import androidx.appcompat.app.AppCompatActivity;
import androidx.core.app.ActivityCompat;

import com.google.android.material.floatingactionbutton.FloatingActionButton;
import com.jaam.transittrack.exceptions.AddressException;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.io.IOException;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Date;
import java.util.List;
import java.util.Locale;
import java.util.concurrent.TimeoutException;

public class RouteActivity extends AppCompatActivity implements LocationListener{


    private Location currLocation;
    
    private static ArrayList<String> stops = new ArrayList<String>();

    protected LocationManager locationManager;
    final static String TAG = "RouteActivity";

    private EditText searchTextView;
    private ArrayAdapter<String> arrayAdapter;

    static private String[] cityCoverage = {"University Endowment Lands","Vancouver", "West Vancouver", "North Vancouver",
            "Lions Bay", "Bowen Island", "Burnaby", "New Westminister", "Richmond", "Surrey",
            "Delta", "White Rock", "Langley", "Coquitlam", "Port Moody", "Port Coquitlam",
            "Belcarra", "Anmore", "Pitt Meadows", "Maple Ridge"};
    //ChatGPT usage: No
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_route);
        //work around for not running http requests off main thread. really don't want to deal with race conditions/synchronization
        StrictMode.ThreadPolicy policy = new StrictMode.ThreadPolicy.Builder().permitAll().build();
        StrictMode.setThreadPolicy(policy);
        Log.d(TAG, "In Route Activity");
        locationManager = (LocationManager) getSystemService(this.LOCATION_SERVICE);
        if (ActivityCompat.checkSelfPermission(this, Manifest.permission.ACCESS_FINE_LOCATION) != PackageManager.PERMISSION_GRANTED && ActivityCompat.checkSelfPermission(this, Manifest.permission.ACCESS_COARSE_LOCATION) != PackageManager.PERMISSION_GRANTED) {
            // TODO: Consider calling
            //    ActivityCompat#requestPermissions
            // here to request the missing permissions, and then overriding
            //   public void onRequestPermissionsResult(int requestCode, String[] permissions,
            //                                          int[] grantResults)
            // to handle the case where the user grants the permission. See the documentation
            // for ActivityCompat#requestPermissions for more details.
            PermissionChecker pc = new PermissionChecker();
            pc.checkLocationPermissions(this);
            return;
        }
        locationManager.requestLocationUpdates(LocationManager.GPS_PROVIDER,
                10000, //10-second interval
                10, //10 meters
                this);

        FloatingActionButton searchButton = findViewById(R.id.searchButton);
        searchButton.setAlpha(.5f);
        searchButton.setClickable(false);
        searchTextView = findViewById(R.id.searchTextField);
        ListView stopListView = findViewById(R.id.stopList);
        findViewById(R.id.routeLoadingProgressBar).setVisibility(View.INVISIBLE);

        arrayAdapter = new ArrayAdapter<>(this, R.layout.route_layout, R.id.textView2, stops);
        stopListView.setAdapter(arrayAdapter);

        //ChatGPT usage: No
        searchTextView.addTextChangedListener(new TextWatcher() {

            @Override
            public void beforeTextChanged(CharSequence s, int start, int count, int after) {
                //Intentionally left blank
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
                //Intentionally left blank
            }
        });
        //ChatGPT usage: No
        searchButton.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                //TODO put this in its own function
                searchRoute();
            }
        });

        if(getIntent().getStringExtra("routeString") !=null && !getIntent().getStringExtra("routeString").isEmpty()){
            String routeString = getIntent().getStringExtra("routeString");
            Log.d(TAG, "friend route string: " + routeString);
            getIntent().removeExtra("routeString");
            try {
                displayRoute(routeString, arrayAdapter);
            } catch (JSONException e) {
                e.printStackTrace();
            }
        }

    }

    /**
     * Retrieves a route between the current location and a destination using a geocoder and an HTTP request.
     * <p>
     * This method takes the current location and a destination address as input, geocodes the address to obtain its
     * latitude and longitude, and then sends an HTTP request to a server to obtain a route between the current location
     * and the destination. The route information is returned as a JSON string.
     *
     * @param currLocationFromListener The current location from which the route will start.
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
    //ChatGPT usage: No
    private String getRoute(Location currLocationFromListener, String search) throws JSONException, IOException, TimeoutException {
        JSONObject endPoints = new JSONObject();
        if(currLocationFromListener == null){
            try {
                currLocation = locationManager.getLastKnownLocation(LocationManager.GPS_PROVIDER);
            } catch (SecurityException e){
                new PermissionChecker().checkLocationPermissions(this);
            }
        }
        endPoints.put("startLat", currLocation.getLatitude());
        endPoints.put("startLon", currLocation.getLongitude());
        try {
            Address address = getAddressFromString(search);
            endPoints.put("endLat", address.getLatitude());
            endPoints.put("endLon", address.getLongitude());
        } catch (AddressException e) {
            e.printStackTrace();
        }
        String arrivalTime = new SimpleDateFormat("HH:mm:ss", Locale.getDefault()).format(new Date(System.currentTimeMillis()+ 7200000));
        endPoints.put("startTime", arrivalTime);
        return OkHTTPHelper.getRoute(endPoints);
    }
    //ChatGPT usage: No
    private void displayRoute(String routeString, ArrayAdapter<String> arrayAdapter) throws JSONException {
        String board;
        String disembark;
        JSONArray route = new JSONArray(routeString);
        JSONObject start;
        JSONObject end;
        Log.d(TAG, "route array: "+ route);
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

    }
    private void showNewErrorAlertDialog(String title, String message){
        new AlertDialog.Builder(RouteActivity.this).setTitle(title).setMessage(message)
                .setPositiveButton("OK", new DialogInterface.OnClickListener() {
                    @Override
                    public void onClick(DialogInterface dialog, int which) {
                        dialog.dismiss();
                    }
                }).create().show();
    }
    private Address getAddressFromString(String search) throws AddressException {
        Address address = null;
        Geocoder geocoder = new Geocoder(RouteActivity.this);
        List<Address> addressList = null;
        try {
            addressList = geocoder.getFromLocationName(search, 1);
        }catch (IOException e){
            showNewErrorAlertDialog("Network Error", "Try turning airplane mode on and off.");
//            Toast.makeText(MainActivity.this, "Network error! Try turning airplane mode on and off.", Toast.LENGTH_LONG).show();
            throw new AddressException(e.getMessage());
        }
        if(addressList.size() == 0 ){
            showNewErrorAlertDialog("Address Error", "Could not find address, please enter a different one.");
//            Toast.makeText(MainActivity.this, "Could not find address, please enter a different one.", Toast.LENGTH_LONG).show();
            throw new AddressException("Could not find address");
        }
        address = addressList.get(0);
        if (!address.getCountryName().equals("Canada") || !Arrays.stream(cityCoverage).anyMatch(addressList.get(0).getLocality()::equals)){
            showNewErrorAlertDialog("Address Error", "Please enter an address covered by Translink.");
            System.err.println("Address got from search: "+address);
            throw new AddressException("Address is outside Greater Vancouver Area");
        }

        return address;
    }

    @Override
    public void onLocationChanged(@NonNull Location location) {
        currLocation = location;
    }
    private void searchRoute(){
        findViewById(R.id.routeLoadingProgressBar).setVisibility(View.VISIBLE);
        stops.clear();

        String routeString;
        try {
            if(String.valueOf(searchTextView.getText()).length() < 1){
                showNewErrorAlertDialog("Route", "Please enter an address.");
                return;
            }
            routeString = getRoute(currLocation, String.valueOf(searchTextView.getText()));

            Log.d(TAG, "Solo route string: " + routeString);
            if(routeString != null) {
                try{
                    Log.d(TAG, "displaying route");
                    displayRoute(routeString, arrayAdapter);
                }catch (JSONException e){
                    String error = new JSONArray(routeString).getString(0);
                    if(error.equals("Could not find Route")){
                        throw new TimeoutException();
                    }
                    Toast.makeText(RouteActivity.this, "Cannot find route, please try again later", Toast.LENGTH_LONG).show();
                }
            }
        } catch (JSONException e) {
            e.printStackTrace();
            Log.d(TAG, "Could not parse JSON");
        } catch (IOException e) {
            e.printStackTrace();
            Log.d(TAG, "Could not getRoute lmao :`)");
        } catch (TimeoutException e) {
            showNewErrorAlertDialog("Route", "No route found.\nPlease try again later.");
        }
        findViewById(R.id.routeLoadingProgressBar).setVisibility(View.INVISIBLE);
    }
}