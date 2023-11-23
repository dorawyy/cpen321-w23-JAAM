package com.jaam.transittrack;


import static androidx.test.espresso.Espresso.onView;
import static androidx.test.espresso.action.ViewActions.click;
import static androidx.test.espresso.action.ViewActions.closeSoftKeyboard;
import static androidx.test.espresso.action.ViewActions.replaceText;
import static androidx.test.espresso.assertion.ViewAssertions.matches;
import static androidx.test.espresso.matcher.ViewMatchers.isDisplayed;
import static androidx.test.espresso.matcher.ViewMatchers.withClassName;
import static androidx.test.espresso.matcher.ViewMatchers.withId;
import static androidx.test.espresso.matcher.ViewMatchers.withText;
import static org.hamcrest.Matchers.allOf;
import static org.hamcrest.Matchers.anything;
import static org.hamcrest.Matchers.is;
import static org.junit.Assert.fail;
import static java.lang.Thread.sleep;

import android.util.Log;
import android.view.View;
import android.view.ViewGroup;
import android.view.ViewParent;

import androidx.test.espresso.Espresso;
import androidx.test.espresso.ViewInteraction;
import androidx.test.ext.junit.rules.ActivityScenarioRule;
import androidx.test.ext.junit.runners.AndroidJUnit4;
import androidx.test.filters.LargeTest;
import androidx.test.platform.app.InstrumentationRegistry;
import androidx.test.rule.GrantPermissionRule;
import androidx.test.uiautomator.By;
import androidx.test.uiautomator.UiDevice;
import androidx.test.uiautomator.UiObject2;

import org.hamcrest.Description;
import org.hamcrest.Matcher;
import org.hamcrest.TypeSafeMatcher;
import org.junit.Before;
import org.junit.Rule;
import org.junit.Test;
import org.junit.runner.RunWith;

@LargeTest
@RunWith(AndroidJUnit4.class)
public class RouteInstrumentedTest {
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
    public void testGetRoute() throws InterruptedException {
        sleep(2000);
        Log.d("ROUTE TEST", "starting get route test");
        UiObject2 searchField = device.findObject(By.text("Search"));
        searchField.setText("UBC Bus Loop");
        Espresso.onView((withId(R.id.searchButton))).perform(click());
        Espresso.onData(anything()).inAdapterView(allOf(withId(R.id.stopList),isDisplayed())).atPosition(0).check(matches(isDisplayed()));
        Log.d("ROUTE TEST", "get route test pass");
    }
    @Test
    public void testGetRouteBadLocation() throws InterruptedException {
        sleep(2000);
        Log.d("ROUTE TEST", "starting bad location route test");
        UiObject2 searchField = device.findObject(By.text("Search"));
        searchField.setText("Calgary Tower");
        Espresso.onView((withId(R.id.searchButton))).perform(click());
        UiObject2 dialogText = device.findObject(By.text("Please enter an address covered by Translink."));
        if(dialogText == null){
            fail("Dialog not found");
        }
        Log.d("ROUTE TEST", "bad location route test pass");
    }
    @Test
    public void testNoLocation(){
        Log.d("ROUTE TEST", "starting no location route test");
        //for some god forsaken reason, setting the button to not clickable doesn't work.
        Espresso.onView((withId(R.id.searchButton))).perform(click());
        if(device.findObject(By.text("Please enter an address.")) == null){
            fail("Dialog not found");
        }
        Log.d("ROUTE TEST", "no location route test pass");
    }
    @Before
    public void navigateToRoutes() throws InterruptedException {
        ViewInteraction appCompatEditText = onView(
                allOf(withId(R.id.addressEditText),
                        childAtPosition(
                                childAtPosition(
                                        withId(android.R.id.content),
                                        0),
                                3),
                        isDisplayed()));
        appCompatEditText.perform(replaceText("2142 E 53rd Ave, Vancouver BC"), closeSoftKeyboard());

        ViewInteraction fx = onView(
                allOf(withText("Sign in"),
                        childAtPosition(
                                allOf(withId(R.id.sign_in_button),
                                        childAtPosition(
                                                withClassName(is("androidx.constraintlayout.widget.ConstraintLayout")),
                                                1)),
                                0),
                        isDisplayed()));
        fx.perform(click());

        UiObject2 routeActivityButton = device.findObject(By.text("Routes"));
        routeActivityButton.click();
        sleep(5000);

    }

    private static Matcher<View> childAtPosition(
            final Matcher<View> parentMatcher, final int position) {

        return new TypeSafeMatcher<View>() {
            @Override
            public void describeTo(Description description) {
                description.appendText("Child at position " + position + " in parent ");
                parentMatcher.describeTo(description);
            }

            @Override
            public boolean matchesSafely(View view) {
                ViewParent parent = view.getParent();
                return parent instanceof ViewGroup && parentMatcher.matches(parent)
                        && view.equals(((ViewGroup) parent).getChildAt(position));
            }
        };
    }
}
