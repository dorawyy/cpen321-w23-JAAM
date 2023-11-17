package com.jaam.transittrack;


import android.Manifest;

import android.app.AlertDialog;
import android.content.Context;
import android.content.DialogInterface;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.location.Address;
import android.location.Geocoder;
import android.location.Location;
import android.location.LocationListener;
import android.location.LocationManager;
import android.util.Log;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.BaseAdapter;
import android.widget.Button;
import android.widget.EditText;
import android.widget.ListAdapter;
import android.widget.TextView;
import android.widget.Toast;

import androidx.annotation.NonNull;
import androidx.core.app.ActivityCompat;


import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.io.IOException;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Date;
import java.util.List;
import java.util.Locale;
import java.util.concurrent.TimeoutException;

public class FriendEntryAdapter extends BaseAdapter implements ListAdapter, LocationListener {
    private static String TAG = "FriendEntryAdapter";

    private ArrayList<String> list;
    private Context context;

    private Location currLocation;
    protected LocationManager locationManager;

    static private String[] cityCoverage = {"Vancouver", "West Vancouver", "North Vancouver",
            "Lions Bay", "Bowen Island", "Burnaby", "New Westminister", "Richmond", "Surrey",
            "Delta", "White Rock", "Langley", "Coquitlam", "Port Moody", "Port Coquitlam",
            "Belcarra", "Anmore", "Pitt Meadows", "Maple Ridge"};
    //ChatGPT usage: No
    public FriendEntryAdapter(ArrayList<String> list, Context context) {
        //TODO avoid repeating again
        locationManager = (LocationManager) context.getSystemService(context.LOCATION_SERVICE);
        if (ActivityCompat.checkSelfPermission(context, Manifest.permission.ACCESS_FINE_LOCATION) != PackageManager.PERMISSION_GRANTED && ActivityCompat.checkSelfPermission(context, Manifest.permission.ACCESS_COARSE_LOCATION) != PackageManager.PERMISSION_GRANTED) {
            // TODO: Consider calling
            //    ActivityCompat#requestPermissions
            // here to request the missing permissions, and then overriding
            //   public void onRequestPermissionsResult(int requestCode, String[] permissions,
            //                                          int[] grantResults)
            // to handle the case where the user grants the permission. See the documentation
            // for ActivityCompat#requestPermissions for more details.

        }
        locationManager.requestLocationUpdates(LocationManager.GPS_PROVIDER, 0, 0, this);
        this.list = list;
        this.context = context;
    }

    @Override
    public int getCount() {
        return list.size();
    }

    @Override
    public Object getItem(int position) {
        return list.get(position);
    }

    @Override
    public long getItemId(int position) {
        return -1;
    }


    //ChatGPT usage: No
    @Override
    public View getView(int position, View convertView, ViewGroup parent) {
        View view = convertView;
        if (view == null) {
            LayoutInflater inflater = (LayoutInflater) context.getSystemService(Context.LAYOUT_INFLATER_SERVICE);
            view = inflater.inflate(R.layout.layout_friend_entry, null);
        }

        //Handle TextView and display string from your list
        TextView tvContact= view.findViewById(R.id.emailTextView);
        tvContact.setText(list.get(position));

        //Handle buttons and add onClickListeners
        Button sendMessageButton= view.findViewById(R.id.friendMessageButton);

        sendMessageButton.setOnClickListener(new View.OnClickListener(){
            @Override
            public void onClick(View v) {
                Intent chatIntent = new Intent(context, ChatActivity.class);
                chatIntent.putExtra("receiverEmail", tvContact.getText());
                context.startActivity(chatIntent);
            }
        });
        Button friendRouteButton = view.findViewById(R.id.friendRouteButton);
        friendRouteButton.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {

                String friendEmail = tvContact.getText().toString();
                Double startLat1 = currLocation.getLatitude();
                Double startLon1 = currLocation.getLongitude();
                AlertDialog.Builder alertDialog = new AlertDialog.Builder(context);
                alertDialog.setTitle("Destination");
                alertDialog.setMessage("Enter a destination");
                final EditText destinationText = new EditText(context);
                alertDialog.setView(destinationText);
                alertDialog.setPositiveButton("GO", new DialogInterface.OnClickListener() {
                    @Override
                    public void onClick(DialogInterface dialog, int which) {
                        String addressSearch = destinationText.getText().toString();
                        Geocoder geocoder = new Geocoder(context);
                        List<Address> addressList = null;
                        try {
                            addressList = geocoder.getFromLocationName(addressSearch, 1);
                        } catch (IOException e) {
                            e.printStackTrace();
                            Log.d(TAG, "Could not get location");
                        }
                        Address address;
                        if(addressList.size() > 0) {
                            if(addressList.get(0).getCountryName().equals("Canada") && Collections.singletonList(cityCoverage).contains(addressList.get(0).getLocality())) {
                                address = addressList.get(0);
                                Double endLat = address.getLatitude();
                                Double endLon = address.getLongitude();
                                JSONObject jsonObject = new JSONObject();

                                try {
                                    jsonObject.put("startLat1", startLat1);
                                    jsonObject.put("startLon1", startLon1);
                                    jsonObject.put("friendEmail", friendEmail);
                                    jsonObject.put("endLat", endLat);
                                    jsonObject.put("endLon", endLon);
                                    jsonObject.put("endTime", new SimpleDateFormat("HH:mm:ss", Locale.getDefault()).format(new Date(System.currentTimeMillis() + 7200000)));
                                } catch (JSONException e) {
                                    e.printStackTrace();
                                    Log.d(TAG, "Could not parse JSON");
                                }
                                try {
                                    Intent routeIntent = new Intent(context, RouteActivity.class);
                                    JSONObject responseObj = new JSONObject(OkHTTPHelper.getFriendRoute(jsonObject));

                                    Log.d(TAG, "Friend Route response: " + responseObj.toString());
                                    JSONArray commonArray = responseObj.getJSONObject("result").getJSONArray("Common");
                                    JSONArray aArray = responseObj.getJSONObject("result").getJSONArray("A");
                                    JSONArray combinedArray = new JSONArray();
                                    for (int i = 0; i < aArray.length(); i++) {
                                        combinedArray.put(aArray.getJSONObject(i));
                                    }
                                    for (int i = 0; i < commonArray.length(); i++) {
                                        combinedArray.put(commonArray.getJSONObject(i));
                                    }
                                    String routeString = combinedArray.toString();
                                    Log.d(TAG, routeString);
                                    routeIntent.putExtra("routeString", routeString);
                                    context.startActivity(routeIntent);
                                } catch (IOException e) {
                                    e.printStackTrace();
                                    Log.d(TAG, "OkHTTPHelper failed");
                                } catch (TimeoutException | JSONException e) {
                                    Toast.makeText(context, "No route found", Toast.LENGTH_SHORT).show();
                                }
                            }
                            else{
                                Toast.makeText(context, "Please enter an address covered by Translink", Toast.LENGTH_SHORT).show();
                            }
                        }
                        Toast.makeText(context, "Could not find address.", Toast.LENGTH_SHORT).show();
                    }
                });
                alertDialog.setNegativeButton("Cancel", new DialogInterface.OnClickListener() {
                    @Override
                    public void onClick(DialogInterface dialog, int which) {
                        dialog.dismiss();
                    }
                });
                alertDialog.show();
            }
        });

        return view;
    }
    //ChatGPT usage: No
    @Override
    public void onLocationChanged(@NonNull Location location) {
        currLocation = location;
    }
}
