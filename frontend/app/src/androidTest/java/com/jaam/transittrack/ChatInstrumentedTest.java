package com.jaam.transittrack;

import static androidx.test.espresso.Espresso.onView;
import static androidx.test.espresso.action.ViewActions.click;
import static androidx.test.espresso.action.ViewActions.closeSoftKeyboard;
import static androidx.test.espresso.action.ViewActions.replaceText;
import static androidx.test.espresso.action.ViewActions.typeText;
import static androidx.test.espresso.matcher.ViewMatchers.isDisplayed;
import static androidx.test.espresso.matcher.ViewMatchers.withChild;
import static androidx.test.espresso.matcher.ViewMatchers.withClassName;
import static androidx.test.espresso.matcher.ViewMatchers.withContentDescription;
import static androidx.test.espresso.matcher.ViewMatchers.withEffectiveVisibility;
import static androidx.test.espresso.matcher.ViewMatchers.withId;
import static androidx.test.espresso.matcher.ViewMatchers.withParent;
import static androidx.test.espresso.matcher.ViewMatchers.withText;
import static org.hamcrest.Matchers.allOf;
import static org.hamcrest.Matchers.is;
import static org.junit.Assert.fail;
import static java.lang.Thread.sleep;

import android.util.Log;
import android.view.View;
import android.view.ViewGroup;
import android.view.ViewParent;

import androidx.test.espresso.Espresso;
import androidx.test.espresso.ViewInteraction;
import androidx.test.espresso.assertion.ViewAssertions;
import androidx.test.espresso.matcher.ViewMatchers;
import androidx.test.ext.junit.rules.ActivityScenarioRule;
import androidx.test.platform.app.InstrumentationRegistry;
import androidx.test.rule.GrantPermissionRule;
import androidx.test.uiautomator.By;
import androidx.test.uiautomator.UiDevice;
import androidx.test.uiautomator.UiObject2;
import androidx.test.uiautomator.Until;

import com.google.common.base.Strings;

import org.hamcrest.Description;
import org.hamcrest.Matcher;
import org.hamcrest.TypeSafeMatcher;
import org.junit.Before;
import org.junit.Rule;
import org.junit.Test;

public class ChatInstrumentedTest {
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
    public void testSendMessage(){
        Log.d("CHAT TEST", "starting send message test");
        String testMessage = "this is an automated test message";
        Espresso.onView(ViewMatchers.withId(R.id.messageEdit)).perform(typeText(testMessage));
        Espresso.onView(ViewMatchers.withId(R.id.sendBtn)).perform(click());
        UiObject2 sentMessage = device.findObject(By.text("crabapple569@gmail.com: this is an automated test message"));
        if(sentMessage == null){
            fail("Message not found");
        }
        Log.d("CHAT TEST", "send message test pass");
    }
    @Test
    public void testEmptyMessage() throws InterruptedException {
        Log.d("CHAT TEST", "starting empty message test");
        Espresso.onView(ViewMatchers.withId(R.id.sendBtn))
                .check(ViewAssertions.matches(
                        withEffectiveVisibility(ViewMatchers.Visibility.INVISIBLE)));
        Log.d("CHAT TEST", "empty message test pass");
    }

@Test
public void testCharLimit(){
    Log.d("CHAT TEST", "starting char limit test");
        String testMessage = Strings.repeat("a",241);
        Espresso.onView(ViewMatchers.withId(R.id.messageEdit)).perform(typeText(testMessage));
    Espresso.onView(ViewMatchers.withId(R.id.sendBtn))
            .check(ViewAssertions.matches(
                    withEffectiveVisibility(ViewMatchers.Visibility.INVISIBLE)));
    Log.d("CHAT TEST", "char limit test pass");
}

    @Before
    public void navigateToChat() throws InterruptedException {
        ViewInteraction appCompatEditText = onView(
                allOf(withId(R.id.addressEditText),
                        childAtPosition(
                                childAtPosition(
                                        withId(android.R.id.content),
                                        0),
                                3),
                        isDisplayed()));
        appCompatEditText.perform(replaceText("2142 E 53rd Ave"), closeSoftKeyboard());

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
        UiObject2 emailSelectorButton = device.wait(Until.findObject((By.text("crabapple569@gmail.com"))), DEFAULT_TIMEOUT);
        if(emailSelectorButton != null){
            emailSelectorButton.click();
        }
        ViewInteraction materialButton = onView(
                allOf(withId(R.id.friendListButton), withText("Friends"),
                        childAtPosition(
                                childAtPosition(
                                        withId(android.R.id.content),
                                        0),
                                2),
                        isDisplayed()));
        materialButton.perform(click());

        ViewInteraction floatingActionButton = onView(
                allOf(withId(R.id.friendsListRefreshButton),
                        childAtPosition(
                                childAtPosition(
                                        withId(android.R.id.content),
                                        0),
                                2),
                        isDisplayed()));
        floatingActionButton.perform(click());

        ViewInteraction materialButton2 = onView(
                allOf(withId(R.id.friendMessageButton), withText("Chat"), withContentDescription("send direct message"),
                        childAtPosition(
                                allOf(withId(R.id.friendCell),
                                        withParent(withId(R.id.friendListView)), withChild(withText("azwadworkacc@gmail.com"))),
                                0),
                        isDisplayed()));
        materialButton2.perform(click());
        sleep(1000);
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
