package com.jaam.transittrack;

import androidx.appcompat.app.AppCompatActivity;

import android.os.Bundle;
import android.widget.Button;

public class CalendarActivity extends AppCompatActivity {
    private Button getGoogleCalendarButton;
    private Button uploadCalendarFileButton;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_calendar);
        getGoogleCalendarButton = findViewById(R.id.googleCalendarButton);
        uploadCalendarFileButton = findViewById(R.id.uploadFileButton);

    }
}