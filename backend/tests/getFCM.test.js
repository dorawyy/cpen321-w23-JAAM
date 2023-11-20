const request = require('supertest');
const makeApp = require('../app.js');
const admin = require('firebase-admin');
const mockUserDB = require('../mockUserDB.js');
const { describe } = require('@jest/globals');

jest.mock('../mockUserDB', () => {
    const originalModule = jest.requireActual('../mockUserDB');
    return {
      ...originalModule,
      connectToDatabase: jest.fn(),
      closeDatabaseConnection: jest.fn(),
      getUserInfoByEmail: jest.fn(),
      updateUserByEmail: jest.fn(),
      insertUser: jest.fn(),
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

// jest.mock('firebase-admin', () => ({
//     constmessaging: () => ({
//       sendToDevice: jest.fn(),
//     }),
//   }));

const app = makeApp(mockUserDB);

describe('GET /getFCM', () => {
    afterEach(() => {
      jest.clearAllMocks();
    });
    
  // Input: Valid user email with existing device token
  // Expected status code: 201
  // Expected behavior: Send an alert successfully
  // Expected output: { message: 'Alert sent successfully' }
    test('should send an alert successfully', async () => {
      // Mocking the necessary data and functions
      const userEmail = 'test@example.com';
      const userExists = { deviceToken: 'mockedToken' };
      mockUserDB.getUserInfoByEmail.mockResolvedValue(userExists);

    //   const sendToDeviceMock = jest.spyOn(admin.messaging(), 'sendToDevice');
    //   sendToDeviceMock.mockResolvedValue();
  
      const response = await request(app)
        .get('/getFCM')
        .query({ userEmail })

      expect(response.status).toBe(201);
      expect(response.body).toEqual({ message: 'Alert sent successfully' });
      expect(mockUserDB.connectToDatabase).toHaveBeenCalledTimes(1);
      expect(mockUserDB.getUserInfoByEmail).toHaveBeenCalledWith(userEmail);
      expect(admin.messaging().sendToDevice).toHaveBeenCalledTimes(1);
      expect(mockUserDB.closeDatabaseConnection).toHaveBeenCalledTimes(1);
    });
    
  // Input: User does not exist with the provided email
  // Expected status code: 404
  // Expected behavior: Could not send a journey alert successfully
  // Expected output: { message: 'Could not send journey alert' }
    test('should handle case where user does not exist', async () => {
      // Mocking the necessary data and functions
      const userEmail = 'nonexistent@example.com';
      mockUserDB.getUserInfoByEmail.mockResolvedValue(null);
  
      const response = await request(app)
        .get('/getFCM')
        .query({ userEmail })
  
      expect(response.status).toBe(404);
      expect(response.body).toEqual({ message: 'Could not send journey alert' });
      expect(mockUserDB.connectToDatabase).toHaveBeenCalledTimes(1);
      expect(admin.messaging().sendToDevice).not.toHaveBeenCalled();
      expect(mockUserDB.getUserInfoByEmail).toHaveBeenCalledWith(userEmail);
      expect(mockUserDB.closeDatabaseConnection).toHaveBeenCalledTimes(1);
    });
    
  // Input: Internal server error during database connection
  // Expected status code: 500
  // Expected behavior: Internal server error during calling the endpoint getFCM
  // Expected output: { message: 'An error occurred while getFCM.' }
    test('should handle internal server error', async () => {
      // Mocking an error during database connection
      mockUserDB.connectToDatabase.mockRejectedValue(new Error('Database connection error'));
  
      const response = await request(app)
        .get('/getFCM')
        .query({ userEmail: 'test@example.com' })

  
      expect(response.status).toBe(500);   
      expect(response.body).toEqual({ message: 'An error occurred while getFCM.' });
      expect(mockUserDB.connectToDatabase).toHaveBeenCalledTimes(1);
      expect(mockUserDB.getUserInfoByEmail).not.toHaveBeenCalled();
      expect(admin.messaging().sendToDevice).not.toHaveBeenCalled();
      expect(mockUserDB.closeDatabaseConnection).toHaveBeenCalledTimes(1);
    });
  });
