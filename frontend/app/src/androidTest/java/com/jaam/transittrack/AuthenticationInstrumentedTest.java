package com.jaam.transittrack;


import static androidx.test.espresso.action.ViewActions.typeText;
import static org.junit.Assert.fail;
import static java.lang.Thread.sleep;

import android.util.Log;

import androidx.test.espresso.Espresso;
import androidx.test.espresso.matcher.ViewMatchers;
import androidx.test.ext.junit.rules.ActivityScenarioRule;
import androidx.test.ext.junit.runners.AndroidJUnit4;
import androidx.test.platform.app.InstrumentationRegistry;
import androidx.test.rule.GrantPermissionRule;
import androidx.test.uiautomator.By;
import androidx.test.uiautomator.UiDevice;
import androidx.test.uiautomator.UiObject2;
import androidx.test.uiautomator.Until;

import org.junit.Rule;
import org.junit.Test;
import org.junit.runner.RunWith;

import java.lang.reflect.InvocationTargetException;

/**
 * Instrumented test, which will execute on an Android device.
 *
 * @see <a href="http://d.android.com/tools/testing">Testing documentation</a>
 */
@RunWith(AndroidJUnit4.class)
public class AuthenticationInstrumentedTest {

    private static final int LAUNCH_TIMEOUT = 5000;
    private static final String PACKAGE_NAME = "com.jaam.transittrack";
    private UiDevice device = UiDevice.getInstance(InstrumentationRegistry.getInstrumentation());
    private int DEFAULT_TIMEOUT = 2000;
    @Rule
    public ActivityScenarioRule<MainActivity> mActivityScenarioRule =
            new ActivityScenarioRule<>(MainActivity.class);

    @Rule
    public GrantPermissionRule mGrantPermissionRule =
            GrantPermissionRule.grant(
                    "android.permission.ACCESS_FINE_LOCATION",
                    "android.permission.ACCESS_COARSE_LOCATION");

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
            fail();
        }
        UiObject2 emailSelectorButton = device.wait(Until.findObject((By.text("crabapple569@gmail.com"))), DEFAULT_TIMEOUT);
        if(emailSelectorButton != null){
            emailSelectorButton.click();
        }
        else{
            Log.d("AUTHENTICATION TESTING", "Cannot find email: crabapple569@gmail.com");
        }
        Log.d("AUTHENTICATION TEST", "authentication test pass");
    }

    @Test
    public void testNoAddress() throws InterruptedException {
        UiObject2 signInButton = device.findObject(By.text("Sign in"));
        if(signInButton != null){
            signInButton.click();
        }
        else{
            Log.d("AUTHENTICATION TESTING", "Google Sign in Button Not Found");
            fail();
        }
        sleep(1000);
        UiObject2 dialogText = device.findObject(By.text("Please enter a default address from where you'd like to start your journeys!"));
        if(dialogText == null){
            fail("Dialog not found");
        }
        UiObject2 positiveDialogButton = device.findObject(By.text("OK"));
        if(positiveDialogButton != null){
            positiveDialogButton.click();
        }
        Log.d("AUTHENTICATION TEST", "no address test pass");
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
            fail();
        }
        UiObject2 positiveDialogButton = device.findObject(By.text("OK"));
        if(positiveDialogButton != null){
            positiveDialogButton.click();
        }
        else{
            fail("Dialog not found");
        }
        Log.d("AUTOMATED TEST", "bad address test pass");
    }


}