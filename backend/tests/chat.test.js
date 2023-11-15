const request = require('supertest');
const makeApp = require('../app.js');
const mockUserDB = require('../mockUserDB.js');
const { describe } = require('@jest/globals');
const admin = require('firebase-admin');
const nock = require('nock');
const Message = require('../models/message.js');

jest.mock('mongoose');
jest.mock('../mockUserDB', () => {
  const originalModule = jest.requireActual('../mockUserDB');
  return {
    ...originalModule,
    connectToDatabase: jest.fn(),
    closeDatabaseConnection: jest.fn(),
    getUserInfoByEmail: jest.fn(),
    updateUserByEmail: jest.fn(),
    insertUser: jest.fn(),
    getUserDetails: jest.fn(),
    mockClient: {
      db: jest.fn(() => originalModule.mockDb),
    },
  };
});
jest.mock('firebase-admin', () => {
  const messaging = {
    sendToDevice: jest.fn().mockResolvedValue(),
  };

  return {
    messaging: () => messaging,
  };
});

// jest.mock('./models/message.js', () => {
//     const mockSave = jest.fn();
//     class MockMessage {
//       constructor({ text, senderEmail, receiverEmail, timestamp }) {
//         this.text = text;
//         this.senderEmail = senderEmail;
//         this.receiverEmail = receiverEmail;
//         this.timestamp = timestamp;
//       }
  
//       save() {
//         mockSave();
//       }
//     }
  
//     return MockMessage;
//   });

  jest.mock('../models/message.js', () => {
    return jest.fn().mockImplementation(({ text, senderEmail, receiverEmail, timestamp }) => {
      return {
        text,
        senderEmail,
        receiverEmail,
        timestamp,
        save: jest.fn(),
      };
    });
  });

const app = makeApp(mockUserDB);

describe('POST /sendMessage', () => {
  const mockReceiverUser = {
    email: 'receiver@example.com',
    fcmToken: 'receiverFCMToken',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('should send a message successfully', async () => {
    const requestBody = {
      text: 'Hello!',
      senderEmail: 'sender@example.com',
      receiverEmail: mockReceiverUser.email,
    };

    jest.spyOn(mockUserDB, 'getUserDetails').mockResolvedValue({
      fcmToken: 'receiverFCMToken',
    });

    // Mocking the admin.messaging().sendToDevice method
    const sendToDeviceMock = jest.spyOn(admin.messaging(), 'sendToDevice');
    sendToDeviceMock.mockResolvedValue({});

    const response = await request(app)
      .post('/api/chat/send')
      .send(requestBody);

    expect(response.status).toBe(201);
    expect(response.body).toEqual({ message: 'Message sent successfully' });

    expect(mockUserDB.getUserDetails).toHaveBeenCalledWith(requestBody.receiverEmail);

    expect(admin.messaging().sendToDevice).toHaveBeenCalledWith(
      mockReceiverUser.fcmToken,
      expect.objectContaining({
        notification: {
          title: 'New Chat Message',
          body: `${requestBody.senderEmail}: ${requestBody.text}`,
        },
      })
    );

    // Ensure that the Message class is used with the correct properties
    expect(Message).toHaveBeenCalledWith({
        text: requestBody.text,
        senderEmail: requestBody.senderEmail,
        receiverEmail: requestBody.receiverEmail,
        timestamp: expect.any(Date),
      });
  });

  test('should handle the case when the receiver is not found', async () => {
    const requestBody = {
      text: 'Hello!',
      senderEmail: 'sender@example.com',
      receiverEmail: 'nonexistent@example.com',
    };
  
    jest.spyOn(mockUserDB, 'getUserDetails').mockResolvedValue(null);
  
    const response = await request(app)
      .post('/api/chat/send')
      .send(requestBody);
  
    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: 'Receiver not found' });
  
    // Ensure that getUserDetails is called with the correct email
    expect(mockUserDB.getUserDetails).toHaveBeenCalledWith(requestBody.receiverEmail);
  
    // Ensure that other functions are not called in this case
    expect(admin.messaging().sendToDevice).not.toHaveBeenCalled();
    expect(Message).not.toHaveBeenCalled();
  });

  test('should give FCM token empty', async () => {
    const requestBody = {
      text: 'Hello!',
      senderEmail: 'sender@example.com',
      receiverEmail: mockReceiverUser.email,
    };

    jest.spyOn(mockUserDB, 'getUserDetails').mockResolvedValue({
      fcmToken: '',
    });

    // Mocking the admin.messaging().sendToDevice method
    const sendToDeviceMock = jest.spyOn(admin.messaging(), 'sendToDevice');
    sendToDeviceMock.mockResolvedValue({});

    const response = await request(app)
      .post('/api/chat/send')
      .send(requestBody);

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: 'FCM token is empty' });

    expect(mockUserDB.getUserDetails).toHaveBeenCalledWith(requestBody.receiverEmail);
  });
  test('should handle the case when the message cannot be sent', async () => {
    const requestBody = {
      text: 'Hello!',
      senderEmail: 'sender@example.com',
      receiverEmail: 'receiver@example.com',
    };
  
    const mockReceiverUser = {
      email: 'receiver@example.com',
      fcmToken: 'receiverFCMToken',
    };
  
    jest.spyOn(mockUserDB, 'getUserDetails').mockResolvedValue(mockReceiverUser);
  
    // Mocking the admin.messaging().sendToDevice method to throw an error
    const sendToDeviceMock = jest.spyOn(admin.messaging(), 'sendToDevice');
    sendToDeviceMock.mockRejectedValue(new Error('Failed to send message'));
  
    const response = await request(app)
      .post('/api/chat/send')
      .send(requestBody);
  
    expect(response.status).toBe(500);
    expect(response.body).toEqual({ error: 'Message could not be sent' });
  
    // Ensure that getUserDetails is called with the correct email
    expect(mockUserDB.getUserDetails).toHaveBeenCalledWith(requestBody.receiverEmail);
  
    // Ensure that sendToDevice is called with the correct arguments
    expect(admin.messaging().sendToDevice).toHaveBeenCalledWith(
      mockReceiverUser.fcmToken,
      expect.objectContaining({
        notification: {
          title: 'New Chat Message',
          body: `${requestBody.senderEmail}: ${requestBody.text}`,
        },
      })
    );
  
    // Ensure that Message is instantiated with the correct properties
    expect(Message).toHaveBeenCalledWith({
      text: requestBody.text,
      senderEmail: requestBody.senderEmail,
      receiverEmail: requestBody.receiverEmail,
      timestamp: expect.any(Date),
    });
  });  
});
