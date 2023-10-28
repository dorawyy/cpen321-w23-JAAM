package com.jaam.transittrack;

import androidx.annotation.NonNull;
import androidx.appcompat.app.AppCompatActivity;
import androidx.core.app.ActivityCompat;

import android.Manifest;
import android.content.pm.PackageManager;
import android.location.Address;
import android.location.Location;
import android.location.Geocoder;
import android.location.LocationListener;
import android.location.LocationManager;
import android.os.Bundle;
import android.text.Editable;
import android.text.TextWatcher;
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
import java.util.List;

public class RouteActivity extends AppCompatActivity implements LocationListener {

    private EditText searchTextView;
    private FloatingActionButton searchButton;
    private Location currLocation;

    private ListView stopListView;
    private ArrayList<String> stops;

    private String board, disembark;

    protected LocationManager locationManager;
    protected LocationListener locationListener;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_route);

        locationManager = (LocationManager) getSystemService(this.LOCATION_SERVICE);
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
        ArrayAdapter<String> arrayAdapter = new ArrayAdapter<String>(this, R.layout.activity_route, stops);
        stopListView.setAdapter(arrayAdapter);


        searchTextView.addTextChangedListener(new TextWatcher() {

            @Override
            public void beforeTextChanged(CharSequence s, int start, int count, int after) {

            }

            @Override
            public void onTextChanged(CharSequence s, int start, int before, int count) {
                if(s.length()<1){
                    searchButton.setAlpha(.5f);
                    searchButton.setClickable(false);

                }
                else{
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
                try {
                    JSONArray route = new JSONArray(getRoute(currLocation, String.valueOf(searchTextView.getText())));
                    JSONObject start, end;
                    for(int i = 0; i < route.length(); i++){
                        start = route.getJSONObject(i).getJSONObject("Start");
                        end = route.getJSONObject(i).getJSONObject("End");
                        board = start.getString("Time") +": Board "+ start.getString("Bus")+  " @ " + start.getString("Stop");
                        disembark = end.get("Time") + ": Disembark " + end.getString("Bus")+ " @ " + end.getString("Stop");
                        stops.add(board);
                        stops.add(disembark);
                    }
                } catch (JSONException e) {
                    throw new RuntimeException(e);
                } catch (IOException e) {
                    throw new RuntimeException(e);
                }
            }
        });
    }

    @Override
    public void onLocationChanged(@NonNull Location location) {
        currLocation = location;
    }

    private String getRoute(Location currLocation, String search) throws JSONException, IOException {
        Geocoder geocoder = new Geocoder(this);
        JSONObject endPoints = new JSONObject();
        endPoints.put("start", new double[]{currLocation.getLatitude(), currLocation.getLongitude()});
        List<Address> addressList = geocoder.getFromLocationName(search, 1);
        Address address = addressList.get(0);
        endPoints.put("end", new double[]{address.getLatitude(), address.getLongitude()});
        return OkHTTPHelper.getRoute(endPoints);
    }
}