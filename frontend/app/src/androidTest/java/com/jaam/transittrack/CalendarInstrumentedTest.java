package com.jaam.transittrack;

import static androidx.test.espresso.action.ViewActions.typeText;
import static org.hamcrest.core.IsNull.notNullValue;
import static org.junit.Assert.assertThat;
import static org.junit.Assert.fail;
import static java.lang.Thread.sleep;

import android.content.Context;
import android.content.Intent;
import android.util.Log;

import androidx.test.core.app.ApplicationProvider;
import androidx.test.espresso.Espresso;
import androidx.test.espresso.matcher.ViewMatchers;
import androidx.test.ext.junit.runners.AndroidJUnit4;
import androidx.test.platform.app.InstrumentationRegistry;
import androidx.test.uiautomator.By;
import androidx.test.uiautomator.UiDevice;
import androidx.test.uiautomator.UiObject2;
import androidx.test.uiautomator.Until;

import org.junit.Before;
import org.junit.Test;
import org.junit.runner.RunWith;

@RunWith(AndroidJUnit4.class)
public class CalendarInstrumentedTest {

    private static final int LAUNCH_TIMEOUT = 5000;
    private static final String PACKAGE_NAME = "com.jaam.transittrack";
    private UiDevice device = UiDevice.getInstance(InstrumentationRegistry.getInstrumentation());
    private int DEFAULT_TIMEOUT = 2000;

    @Test
    public void testCalendarUpload() throws InterruptedException {

        UiObject2 calendarButton = device.findObject(By.text("Get Google Calendar"));
        if(calendarButton != null){
            calendarButton.click();
        }
        //wait 10 seconds for calendar to sync
        sleep(10000);
        //checks for alert dialog
        UiObject2 positiveDialogButton = device.findObject(By.text("OK"));
        if(positiveDialogButton != null){
            positiveDialogButton.click();
        }
        else{
            fail("Dialog not found");
        }
        Log.d("CALENDAR TEST", "get calendar test pass");
    }

    @Before
    public void startMainActivityFromHomeScreen() throws InterruptedException {
        // Initialize UiDevice instance
        device = UiDevice.getInstance(InstrumentationRegistry.getInstrumentation());

        // Start from the home screen
        device.pressHome();

        // Wait for launcher
        final String launcherPackage = device.getLauncherPackageName();
        assertThat(launcherPackage, notNullValue());
        device.wait(Until.hasObject(By.pkg(launcherPackage).depth(0)),
                LAUNCH_TIMEOUT);

        // Launch the app
        Context context = ApplicationProvider.getApplicationContext();
        final Intent intent = context.getPackageManager()
                .getLaunchIntentForPackage(PACKAGE_NAME);
        // Clear out any previous instances
        intent.addFlags(Intent.FLAG_ACTIVITY_CLEAR_TASK);
        context.startActivity(intent);

        // Wait for the app to appear
        device.wait(Until.hasObject(By.pkg(PACKAGE_NAME).depth(0)),
                LAUNCH_TIMEOUT);

        navigateToCalendar();
    }

    private void navigateToCalendar() throws InterruptedException {
        UiObject2 allowLocationPermsButton = device.findObject(By.text("Allow only while using the app"));
        if(allowLocationPermsButton != null){
            allowLocationPermsButton.click();
        }
        String defaultAddress = "2142 E 53rd Ave, Vancouver BC";
        Espresso.onView(ViewMatchers.withId(R.id.addressEditText)).perform(typeText(defaultAddress));
        UiObject2 signInButton = device.findObject(By.text("Sign in"));
        if(signInButton != null){
            signInButton.click();
        }
        UiObject2 emailSelectorButton = device.wait(Until.findObject((By.text("crabapple569@gmail.com"))), DEFAULT_TIMEOUT);
        if(emailSelectorButton != null){
            emailSelectorButton.click();
        }
        UiObject2 calendarActivityButton = device.findObject(By.text("Calendar"));
        if(calendarActivityButton != null){
            calendarActivityButton.click();
        }
        sleep(1000);
    }
}
