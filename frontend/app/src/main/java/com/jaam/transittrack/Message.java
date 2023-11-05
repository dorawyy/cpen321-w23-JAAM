package com.jaam.transittrack;

public class Message {

    private String sender;

    private String recipient;

    private String message;
    //ChatGPT usage: No
    public Message(String sender, String recipient, String message){
        this.sender = sender;
        this.recipient = recipient;
        this.message = message;
    }
    //ChatGPT usage: No
    public String getMessageContent(){
        return this.message;
    }
    //ChatGPT usage: No
    public String getSender(){
        return this.sender;
    }

    public String getRecipient(){ return this.recipient; }


}