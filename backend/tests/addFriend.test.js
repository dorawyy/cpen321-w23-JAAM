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

const app = makeApp(mockUserDB);

describe('POST /addFriend', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('should add a friend to both FriendLists', async () => {
    // Mock database functions for an existing user and friend
    mockUserDB.getUserInfoByEmail
      .mockResolvedValueOnce({ email: 'test@example.com' }) // Existing user
      .mockResolvedValueOnce({ email: 'friend@example.com' }); // Existing friend

    mockUserDB.updateUserByEmail.mockResolvedValueOnce({ modifiedCount: 1 }); // User update
    mockUserDB.updateUserByEmail.mockResolvedValueOnce({ modifiedCount: 1 }); // Friend update

    // Make the request to your endpoint
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
    // Mock database functions for an existing user and friend
    mockUserDB.getUserInfoByEmail
      .mockResolvedValueOnce({ email: 'test@example.com' }) // Existing user
      .mockResolvedValueOnce({ email: 'friend@example.com' }); // Existing friend
  
    // Simulate that the friend has already been added
    //mockUserDB.updateUserByEmail.mockResolvedValueOnce({ modifiedCount: 0 });
    mockUserDB.updateUserByEmail.mockResolvedValueOnce({ modifiedCount: 0 });
    mockUserDB.updateUserByEmail.mockResolvedValueOnce({ modifiedCount: 0 });
  
    // Make the request to your endpoint
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
  
    // // Verify log message for the user
    // expect(app.userLogMessage).toBe("Friend already added to the user's FriendsList.");
  
    // // Verify log message for the friend
    // expect(app.friendLogMessage).toBe("User added to the friend's FriendsList.");
  });  

  test('should handle friend not found', async () => {
    // Mock database functions for an existing user but friend not found
    mockUserDB.getUserInfoByEmail
      .mockResolvedValueOnce({ email: 'test@example.com' }) // Existing user
      .mockResolvedValueOnce(null); // Friend not found

      mockUserDB.updateUserByEmail.mockResolvedValueOnce({ modifiedCount: 1 });
  
    // Make the request to your endpoint
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
    // Mock database function for a user not found
    mockUserDB.getUserInfoByEmail.mockResolvedValueOnce(null);

    // Make the request to your endpoint
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
    // Mock database function to simulate a server error
    mockUserDB.connectToDatabase.mockRejectedValueOnce(new Error('Connection error'));

    // Make the request to your endpoint
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
    // Make the request with invalid data
    const response = await request(app)
      .post('/addFriend')
      .send({
        // Invalid data, missing required fields or incorrect format
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
