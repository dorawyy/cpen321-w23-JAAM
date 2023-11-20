const request = require('supertest');
const makeApp = require('../app.js');
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
      mockClient: {
        db: jest.fn(() => originalModule.mockDb),
      },
    };
  });
  
  // Create an instance of the app with the mockUserDB
  const app = makeApp(mockUserDB);

  describe('GET /', () => {
  // Input: Request to the root endpoint
  // Expected status code: 200
  // Expected behavior: Respond with "Hello World!"
  // Expected output: 'Hello World!'
    test('responds with "Hello World!"', async () => {
      const response = await request(app).get('/');
      expect(response.status).toBe(200);
      expect(response.text).toBe('Hello World!');
    });
    test('responds with "Hello World!"', async () => {
      const response = await request(app).get('/');
      expect(response.status).toBe(200);
    });
  });