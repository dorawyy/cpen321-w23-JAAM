package com.jaam.transittrack;


import static androidx.test.espresso.action.ViewActions.typeText;

import android.content.Context;
import android.content.Intent;
import android.util.Log;

import androidx.test.core.app.ApplicationProvider;
import androidx.test.espresso.matcher.ViewMatchers;
import androidx.test.platform.app.InstrumentationRegistry;
import androidx.test.ext.junit.runners.AndroidJUnit4;

import org.junit.Test;
import org.junit.runner.RunWith;
import org.junit.Before;
import androidx.test.uiautomator.UiDevice;
import androidx.test.uiautomator.By;
import androidx.test.uiautomator.UiObject2;
import androidx.test.uiautomator.Until;
import androidx.test.espresso.Espresso;

import static org.hamcrest.core.IsNull.notNullValue;
import static org.junit.Assert.*;

import java.lang.reflect.InvocationTargetException;

/**
 * Instrumented test, which will execute on an Android device.
 *
 * @see <a href="http://d.android.com/tools/testing">Testing documentation</a>
 */
@RunWith(AndroidJUnit4.class)
public class AuthenticationTest {

    private static final int LAUNCH_TIMEOUT = 5000;
    private static final String PACKAGE_NAME = "com.jaam.transittrack";
    private UiDevice device = UiDevice.getInstance(InstrumentationRegistry.getInstrumentation());
    private int DEFAULT_TIMEOUT = 2000;
    @Test
    public void useAppContext() {
        // Context of the app under test.
        Context appContext = InstrumentationRegistry.getInstrumentation().getTargetContext();
        assertEquals("com.jaam.transittrack", appContext.getPackageName());
    }

    @Test
    public void testAutentication(){
//        Context context = InstrumentationRegistry.getInstrumentation().getTargetContext();
//        Intent startIntent = context.getPackageManager().getLaunchIntentForPackage(context.getPackageName());
//        context.startActivity(startIntent);


        //device = UiDevice.getInstance(InstrumentationRegistry.getInstrumentation());

        UiObject2 allowLocationPermsButton = device.findObject(By.text("Allow only while using the app"));
        if(allowLocationPermsButton != null){
            allowLocationPermsButton.click();
        }
        else{
            Log.d("AUTHENTICATION TESTING", "Location permission request dialog not found");
        }
        String defaultAddress = "SFU";
        Espresso.onView(ViewMatchers.withId(R.id.addressEditText)).perform(typeText(defaultAddress));
        UiObject2 signInButton = device.findObject(By.text("Sign in"));
        if(signInButton != null){
            signInButton.click();
        }
        else{
            Log.d("AUTHENTICATION TESTING", "Google Sign in Button Not Found");
        }
        UiObject2 emailSelectorButton = device.wait(Until.findObject((By.text("crabapple569@gmail.com"))), DEFAULT_TIMEOUT);
        if(emailSelectorButton != null){
            emailSelectorButton.click();
        }
        else{
            Log.d("AUTHENTICATION TESTING", "Cannot find email: crabapple569@gmail.com");
        }
    }

    @Test
    public void testNoLocationPerms(){

    }

    @Test()
    public void testBadDefaultLocation() throws InvocationTargetException, IllegalAccessException, NoSuchMethodException {
        String defaultAddress = "Calgary Tower";
        Espresso.onView(ViewMatchers.withId(R.id.addressEditText)).perform(typeText(defaultAddress));
        UiObject2 signInButton = device.findObject(By.text("Sign in"));
        if(signInButton != null){
            signInButton.click();
        }
        else{
            Log.d("AUTHENTICATION TESTING", "Google Sign in Button Not Found");
        }
        UiObject2 positiveDialogButton = device.findObject(By.text("OK"));
        if(positiveDialogButton != null){
            positiveDialogButton.click();
        }
        else{
            fail("Dialog not found");
        }
    }

    @Before
    public void startMainActivityFromHomeScreen() {
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
    }


}