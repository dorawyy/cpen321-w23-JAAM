package com.jaam.transittrack;


import android.content.Context;
import android.content.Intent;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.BaseAdapter;
import android.widget.Button;
import android.widget.ListAdapter;
import android.widget.TextView;

import java.util.ArrayList;

public class FriendEntryAdapter extends BaseAdapter implements ListAdapter {

    private ArrayList<String> list = new ArrayList<String>();
    private Context context;

    public FriendEntryAdapter(ArrayList<String> list, Context context) {
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
        //TODO implement friendRouteButton functionality

        return view;
    }

}
