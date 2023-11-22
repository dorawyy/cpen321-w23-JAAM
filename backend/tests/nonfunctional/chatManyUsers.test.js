const request = require('supertest');
const makeApp = require('../../app.js');
const mockUserDB = require('../../mockUserDB.js');
const { describe } = require('@jest/globals');
const admin = require('firebase-admin');
const nock = require('nock');
const Message = require('../../models/message.js');
const NUM_USERS = 50;
const NUM_MESSAGES = 100;
jest.mock('mongoose');
jest.mock('../../mockUserDB', () => {
	const originalModule = jest.requireActual('../../mockUserDB');
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

jest.mock('../../models/message.js', () => {
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

describe('POST /sendMessage, nonfunctional testing with many users', () => {
	var mockUsers = [];
	for (var i = 0; i < NUM_USERS; i++) {
		mockUsers.push({
			email: `${i}@example.com`,
			fcmToken: `${i}FCMToken`
		});
	}
	var mockReceiver;
	var mockSender;
	beforeEach(() => {
		jest.clearAllMocks();
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	//Test many messages sent between many pairs of individuals
	for (i = 0; i < NUM_MESSAGES; i++) {
		mockReceiver = mockUsers[Math.floor(Math.random() * NUM_USERS)];
		mockSender = mockUsers[Math.floor(Math.random() * NUM_USERS)];
		while (mockSender === mockReceiver) {
			mockSender = mockUsers[Math.floor(Math.random() * NUM_USERS)];
		}	
		// Input: Valid message data with an existing receiver
		// Expected status code: 201
		// Expected behavior: Message sent successfully
		// Expected output: { message: 'Message sent successfully' }
		test.concurrent(`sending messages between many different users: \n${mockReceiver.email} and ${mockSender.email}`, async () => {
			const requestBody = {
				text: 'Hello!',
				senderEmail: mockSender.email,
				receiverEmail: mockReceiver.email,
			};

			jest.spyOn(mockUserDB, 'getUserDetails').mockResolvedValue({
				fcmToken: mockReceiver.fcmToken,
			});

			// Mocking the admin.messaging().sendToDevice method
			const sendToDeviceMock = jest.spyOn(admin.messaging(), 'sendToDevice');
			sendToDeviceMock.mockResolvedValue({});

			const response = await request(app)
				.post('/api/chat/send')
				.send(requestBody);

			// Assertions
			expect(response.status).toBe(201);
			expect(response.body).toEqual({ message: 'Message sent successfully' });

			// Verify that getUserDetails is called with the correct email
			expect(mockUserDB.getUserDetails).toHaveBeenCalledWith(requestBody.receiverEmail);

			// Verify that sendToDevice is called with the correct arguments
			expect(admin.messaging().sendToDevice).toHaveBeenCalledWith(
				mockReceiver.fcmToken,
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
		}, 500);
	}

});
