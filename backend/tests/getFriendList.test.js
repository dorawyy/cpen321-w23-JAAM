const request = require('supertest');
const makeApp = require('../app.js');
//const database = require('./database.js');
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

// Describe block for the test suite
describe('GET /getFriendList', () => {
  // beforeEach and afterEach to clear mocks before and after each test
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // Test case to check if the friend list is returned successfully
  test('should return the friend list for an existing user', async () => {
    // Mock database functions for an existing user
    mockUserDB.getUserInfoByEmail.mockResolvedValueOnce({
      email: 'test@example.com',
      FriendsList: ['friend1@example.com', 'friend2@example.com'],
    });

    // Make the request to the endpoint
    const response = await request(app)
      .get('/getFriendList')
      .query({ userEmail: 'test@example.com' });

    // Assertions
    expect(response.statusCode).toBe(200);
    expect(response.body.FriendsList).toEqual(['friend1@example.com', 'friend2@example.com']);

    // Verify that database functions were called as expected
    expect(mockUserDB.connectToDatabase).toHaveBeenCalled();
    expect(mockUserDB.getUserInfoByEmail).toHaveBeenCalledWith('test@example.com');
    expect(mockUserDB.closeDatabaseConnection).toHaveBeenCalled();
  });

  // Test case to check if the response is correct when the user has no friends
  test('should return "No friends" for a user with no friends', async () => {
    // Mock database functions for an existing user with no friends
    mockUserDB.getUserInfoByEmail.mockResolvedValueOnce({
      email: 'test@example.com',
      FriendsList: [],
    });

    // Make the request to the endpoint
    const response = await request(app)
      .get('/getFriendList')
      .query({ userEmail: 'test@example.com' });

    // Assertions
    expect(response.statusCode).toBe(200);
    expect(response.text).toBe('No friends');

    // Verify that database functions were called as expected
    expect(mockUserDB.connectToDatabase).toHaveBeenCalled();
    expect(mockUserDB.getUserInfoByEmail).toHaveBeenCalledWith('test@example.com');
    expect(mockUserDB.closeDatabaseConnection).toHaveBeenCalled();
  });

  // Test case to check the response when the user is not found
  test('should return 404 if the user is not found', async () => {
    // Mock database functions for a user not found
    mockUserDB.getUserInfoByEmail.mockResolvedValueOnce(null);

    // Make the request to the endpoint
    const response = await request(app)
      .get('/getFriendList')
      .query({ userEmail: 'nonexistent@example.com' });

    // Assertions
    expect(response.statusCode).toBe(404);
    expect(response.text).toBe('User not found in the database.');

    // Verify that database functions were called as expected
    expect(mockUserDB.connectToDatabase).toHaveBeenCalled();
    expect(mockUserDB.getUserInfoByEmail).toHaveBeenCalledWith('nonexistent@example.com');
    expect(mockUserDB.closeDatabaseConnection).toHaveBeenCalled();
  });

  // Test case to check the handling of server failure
  test('should handle server failure', async () => {
    // Mock database functions to simulate a server error
    mockUserDB.connectToDatabase.mockRejectedValueOnce(new Error('Connection error'));

    // Make the request to the endpoint
    const response = await request(app)
      .get('/getFriendList')
      .query({ userEmail: 'test@example.com' });

    // Assertions
    expect(response.statusCode).toBe(500);
    expect(response.text).toBe('Error getting friend list.');

    // Verify that database functions were called as expected
    expect(mockUserDB.connectToDatabase).toHaveBeenCalled();
    expect(mockUserDB.closeDatabaseConnection).toHaveBeenCalled();
  });
});
