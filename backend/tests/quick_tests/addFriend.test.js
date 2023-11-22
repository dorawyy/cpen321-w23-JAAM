const request = require('supertest');
const makeApp = require('../../app.js');
const mockUserDB = require('../../mockUserDB.js');
const { describe } = require('@jest/globals');

jest.mock('../../mockUserDB', () => {
  const originalModule = jest.requireActual('../../mockUserDB');
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

const app = makeApp(mockUserDB);

describe('POST /addFriend', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('should add a friend to both FriendLists', async () => {
    // Input: Existing user and existing friend
    // Expected status code: 200
    // Expected behavior: Friend added to both FriendLists
    // Expected output: "Friend added to both FriendLists."
    mockUserDB.getUserInfoByEmail
      .mockResolvedValueOnce({ email: 'test@example.com' }) // Existing user
      .mockResolvedValueOnce({ email: 'friend@example.com' }); // Existing friend

    mockUserDB.updateUserByEmail.mockResolvedValueOnce({ modifiedCount: 1 }); // User update
    mockUserDB.updateUserByEmail.mockResolvedValueOnce({ modifiedCount: 1 }); // Friend update

    const response = await request(app)
      .post('/addFriend')
      .send({
        userEmail: 'test@example.com',
        friendEmail: 'friend@example.com',
      });

    // Assertions
    expect(response.statusCode).toBe(200);
    expect(response.text).toBe("Friend added to both FriendLists.");
    // Verify that database functions were called as expected
    expect(mockUserDB.connectToDatabase).toHaveBeenCalled();
    expect(mockUserDB.getUserInfoByEmail).toHaveBeenCalledWith('test@example.com');
    expect(mockUserDB.getUserInfoByEmail).toHaveBeenCalledWith('friend@example.com');
    expect(mockUserDB.updateUserByEmail).toHaveBeenCalledWith(
      'test@example.com',
      { FriendsList: 'friend@example.com' }
    );
    expect(mockUserDB.updateUserByEmail).toHaveBeenCalledWith(
      'friend@example.com',
      { FriendsList: 'test@example.com' }
    );
    expect(mockUserDB.closeDatabaseConnection).toHaveBeenCalled();
  });

  test('should handle friend already added', async () => {
    // Input: Existing user and existing friend, friend already added
    // Expected status code: 200
    // Expected behavior: Friend already added, no changes
    // Expected output: "Friend added to both FriendLists."
    mockUserDB.getUserInfoByEmail
      .mockResolvedValueOnce({ email: 'test@example.com' }) // Existing user
      .mockResolvedValueOnce({ email: 'friend@example.com' }); // Existing friend

    mockUserDB.updateUserByEmail.mockResolvedValueOnce({ modifiedCount: 0 }); // User update
    mockUserDB.updateUserByEmail.mockResolvedValueOnce({ modifiedCount: 0 }); // Friend update

    const response = await request(app)
      .post('/addFriend')
      .send({
        userEmail: 'test@example.com',
        friendEmail: 'friend@example.com',
      });

    // Assertions
    expect(response.text).toBe("Friend added to both FriendLists.");

    // Verify that database functions were called as expected
    expect(mockUserDB.connectToDatabase).toHaveBeenCalled();
    expect(mockUserDB.getUserInfoByEmail).toHaveBeenCalledWith('test@example.com');
    expect(mockUserDB.getUserInfoByEmail).toHaveBeenCalledWith('friend@example.com');
    expect(mockUserDB.updateUserByEmail).toHaveBeenCalledWith(
      'test@example.com',
      { FriendsList: 'friend@example.com' }
    );
    expect(mockUserDB.updateUserByEmail).toHaveBeenCalledWith(
      'friend@example.com',
      { FriendsList: 'test@example.com' }
    );
    expect(mockUserDB.closeDatabaseConnection).toHaveBeenCalled();
  });

  test('should handle friend not found', async () => {
    // Input: Existing user but friend not found
    // Expected status code: 404
    // Expected behavior: Friend not found, no changes
    // Expected output: "Friend not found in the database."
    mockUserDB.getUserInfoByEmail
      .mockResolvedValueOnce({ email: 'test@example.com' }) // Existing user
      .mockResolvedValueOnce(null); // Friend not found

    mockUserDB.updateUserByEmail.mockResolvedValueOnce({ modifiedCount: 1 });

    const response = await request(app)
      .post('/addFriend')
      .send({
        userEmail: 'test@example.com',
        friendEmail: 'nonexistent@example.com', // Friend not found in the database
      });

    // Assertions
    expect(response.statusCode).toBe(404);
    expect(response.text).toBe("Friend not found in the database.");

    // Verify that database functions were called as expected
    expect(mockUserDB.connectToDatabase).toHaveBeenCalled();
    expect(mockUserDB.getUserInfoByEmail).toHaveBeenCalledWith('test@example.com');
    expect(mockUserDB.getUserInfoByEmail).toHaveBeenCalledWith('nonexistent@example.com');
    expect(mockUserDB.closeDatabaseConnection).toHaveBeenCalled();
  });

  test('should handle user not found', async () => {
    // Input: User not found
    // Expected status code: 404
    // Expected behavior: User not found, no changes
    // Expected output: "User not found in the database."
    mockUserDB.getUserInfoByEmail.mockResolvedValueOnce(null);

    const response = await request(app)
      .post('/addFriend')
      .send({
        userEmail: 'nonexistent@example.com',
        friendEmail: 'friend@example.com',
      });

    // Assertions
    expect(response.statusCode).toBe(404);
    expect(response.text).toBe("User not found in the database.");

    // Verify that database functions were called as expected
    expect(mockUserDB.connectToDatabase).toHaveBeenCalled();
    expect(mockUserDB.getUserInfoByEmail).toHaveBeenCalledWith('nonexistent@example.com');
    expect(mockUserDB.closeDatabaseConnection).toHaveBeenCalled();
  });

  test('should handle server failure', async () => {
    // Input: Simulate a server error
    // Expected status code: 500
    // Expected behavior: Error adding friend
    // Expected output: "Error adding friend."
    mockUserDB.connectToDatabase.mockRejectedValueOnce(new Error('Connection error'));

    const response = await request(app)
      .post('/addFriend')
      .send({
        userEmail: 'test@example.com',
        friendEmail: 'friend@example.com',
      });

    // Assertions
    expect(response.statusCode).toBe(500);
    expect(response.text).toBe("Error adding friend.");

    // Verify that database functions were called as expected
    expect(mockUserDB.connectToDatabase).toHaveBeenCalled();
    expect(mockUserDB.closeDatabaseConnection).toHaveBeenCalled();
  });

  test('should handle validation error', async () => {
    // Input: Invalid data
    // Expected status code: 400
    // Expected behavior: Validation error, no changes to the database
    // Expected output: Array of validation errors
    const response = await request(app)
      .post('/addFriend')
      .send({
        userEmail: 'invalid_email',
        friendEmail: 'friend@example.com',
      });

    // Assertions
    expect(response.statusCode).toBe(400);
    expect(response.body.errors).toBeDefined();
    expect(response.body.errors).toBeInstanceOf(Array);

    // Verify that database functions were not called
    expect(mockUserDB.connectToDatabase).not.toHaveBeenCalled();
    expect(mockUserDB.getUserInfoByEmail).not.toHaveBeenCalled();
    expect(mockUserDB.updateUserByEmail).not.toHaveBeenCalled();
    expect(mockUserDB.closeDatabaseConnection).not.toHaveBeenCalled();
  });
});
