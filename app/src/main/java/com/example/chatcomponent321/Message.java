package com.example.chatcomponent321;

public class Message {

    private String sender;

    private String recipient;

    private String message;

    public Message(String sender, String recipient, String message){
        this.sender = sender;
        this.recipient = recipient;
        this.message = message;
    }

    public String getMessageContent(){
        return this.message;
    }

    public String getSender(){
        return this.sender;
    }


}
