const request = require('supertest');
const makeApp = require('../../app.js');
const mockUserDB = require('../../mockUserDB.js');
const { describe } = require('@jest/globals');
const admin = require('firebase-admin');
const nock = require('nock');
const Message = require('../../models/message.js');
const NUM_USERS = 2;
const NUM_MESSAGES = 200;
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

describe('POST /sendMessage, nonfunctional, testing with many messages sent between a pair of users', () => {
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

    // Test many messages sent at the same time by a single pair of users
	for (i = 0; i < NUM_MESSAGES; i++) {
		mockSender = mockUsers[i%2];
		mockReceiver = mockUsers[1 - i%2];
		test.concurrent(`sending multiple messages at the same time between the same users, message#${i}`, async () => {
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
