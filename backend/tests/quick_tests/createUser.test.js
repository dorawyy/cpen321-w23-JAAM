const request = require('supertest');
const makeApp = require('../../app.js');
//const database = require('./database.js');
const mockUserDB = require('../../mockUserDB.js');
const { describe } = require('@jest/globals');

// jest.mock('./database', () => ({
//   connectToDatabase: jest.fn(),
//   closeDatabaseConnection: jest.fn(),
//   getUserInfoByEmail: jest.fn(),
//   updateUserByEmail: jest.fn(),
//   insertUser: jest.fn(),
// }));

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

describe('POST /createUser', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('should create a new user', async () => {
  // Input: New user data
  // Expected status code: 200
  // Expected behavior: New user data inserted into the database
  // Expected output: 'New user data inserted into the database'

    // Mock database functions for a new user
    mockUserDB.getUserInfoByEmail.mockResolvedValue(null); // No existing user
    //mockUserDB.insertUser.mockResolvedValueOnce({ insertedId: '12345' });

    // User data to be sent in the request
    const userData = {
      email: 'crabapple569@gmail.com',
      deviceToken: 'cLXlnKK4S2S9hQzYqtsD17:APA91bGqH-S3w7opOQUJClftFyz82amcfjHSqmQtv6tufmF1uBQ5IAEvXi15Hg1azwa4aaWS76q95LqPnxuNOhUGcZ6TXTV_duBGib6TnIBDgS6t3Y_9U8qhVOQHIh3wQmr9jfOfkWQX',
      UUID: '10cfdf08-0502-3c1e-9986-074414a4a6e1',
      defaultLat: 49.221266,
      defaultLon: -123.063863
    };

    // Make the request to your endpoint
    const response = await request(app)
      .post('/createUser')
      .send(userData);

    // Assertions
    expect(response.statusCode).toBe(200);
    expect(response.text).toBe('New user data inserted into the database');
    // Add more assertions as needed

    // Verify that database functions were called as expected
    expect(mockUserDB.connectToDatabase).toHaveBeenCalled();
    expect(mockUserDB.insertUser).toHaveBeenCalled();

    // Check the arguments that insertUser was called with
    //expect(mockUserDB.insertUser.mock.calls[0][0]).toMatchObject(userData);

    expect(mockUserDB.closeDatabaseConnection).toHaveBeenCalled();
  });

  test('should update an existing user', async () => {
  // Input: Existing user data with changes (for example logging in from a different phone with a new device token)
  // Expected status code: 200
  // Expected behavior: User data updated in the database
  // Expected output: 'User data updated in the database'

    // Mock database functions for an existing user
    mockUserDB.getUserInfoByEmail.mockResolvedValueOnce({ email: 'test@example.com' });
    mockUserDB.updateUserByEmail.mockResolvedValueOnce({ modifiedCount: 1 });

    // Make the request to your endpoint
    const response = await request(app)
      .post('/createUser')
      .send({ 
        // email: 'test@example.com',
        // deviceToken: 'drYlnKK4S2S9hQzYqtsD17:APA91bGqH-S3w7opOQUJClftFyz82amcfjHSqmQtv6tufmF1uBQ5IAEvXi15Hg1azwa4aaWS76q95LqPnxuNOhUGcZ6TXTV_duBGib6TnIBDgS6t3Y_9U8qhVOQHIh3wQmr9jfOfkWQX',
        // UUID: '10cfdf08-0502-3c1e-9986-074414a4a6e1',
        // defaultLat: 49.221266,
        // defaultLon: -123.063863
        _id: 5,
        email: 'test@example.com',
        deviceToken: 'cYXlnKK4S2S9hQzYqtsD17:APA91bGqH-S3w7opOQUJClftFyz82amcfjHSqmQtv6tufmF1uBQ5IAEvXi15Hg1azwa4aaWS76q95LqPnxuNOhUGcZ6TXTV_duBGib6TnIBDgS6t3Y_9U8qhVOQHIh3wQmr9jfOfkWQX',
        UUID: '10cfdf08-0502-3c1e-9986-074414a4a6e1',
        defaultLat: 49.221266,
        defaultLon: -123.063863,
       });

    // Assertions
    expect(response.statusCode).toBe(200);
    expect(response.text).toBe('User data updated in the database');
    // Add more assertions as needed

    // Verify that database functions were called as expected
    expect(mockUserDB.connectToDatabase).toHaveBeenCalled();
    expect(mockUserDB.getUserInfoByEmail).toHaveBeenCalledWith('test@example.com');
    expect(mockUserDB.updateUserByEmail).toHaveBeenCalledWith(
      'test@example.com',
      { _id: 5,
      email: 'test@example.com', 
      deviceToken: 'cYXlnKK4S2S9hQzYqtsD17:APA91bGqH-S3w7opOQUJClftFyz82amcfjHSqmQtv6tufmF1uBQ5IAEvXi15Hg1azwa4aaWS76q95LqPnxuNOhUGcZ6TXTV_duBGib6TnIBDgS6t3Y_9U8qhVOQHIh3wQmr9jfOfkWQX',
      UUID: '10cfdf08-0502-3c1e-9986-074414a4a6e1',
      defaultLat: 49.221266,
      defaultLon: -123.063863 }
    );
    expect(mockUserDB.closeDatabaseConnection).toHaveBeenCalled();
  });

  test('should handle invalid user object (400)', async () => {
  // Input: Invalid user data
  // Expected status code: 400
  // Expected behavior: Invalid user object response
  // Expected output: { errors: Array of error messages }

    const invalidUserData = {
      email: 'email.com', 
      deviceToken: 'klfhskdns26sdfsd545ssfd',
      UUID: '521gg',
      defaultLat: 41.7128,
      defaultLon: -75.0060
    };

    // Make the request to your endpoint
    const response = await request(app)
      .post('/createUser')
      .send(invalidUserData);

    // Assertions
    expect(response.statusCode).toBe(400);
    expect(response.body.errors).toBeDefined();
    expect(response.body.errors).toBeInstanceOf(Array);
    // Add more assertions for specific error responses if needed

    // Verify that database functions were not called
    expect(mockUserDB.connectToDatabase).not.toHaveBeenCalled();
    expect(mockUserDB.closeDatabaseConnection).not.toHaveBeenCalled();
  });

  test('should handle server failure', async () => {
  // Input: Server failure during database operation
  // Expected status code: 500
  // Expected behavior: Server failure response
  // Expected output: 'Error inserting/updating user data into the database'

    // Mock database functions to simulate a server error
    mockUserDB.connectToDatabase.mockRejectedValueOnce(new Error('Connection error'));

    const userData = {
      email: 'crabapple569@gmail.com',
      deviceToken: 'cLXlnKK4S2S9hQzYqtsD17:APA91bGqH-S3w7opOQUJClftFyz82amcfjHSqmQtv6tufmF1uBQ5IAEvXi15Hg1azwa4aaWS76q95LqPnxuNOhUGcZ6TXTV_duBGib6TnIBDgS6t3Y_9U8qhVOQHIh3wQmr9jfOfkWQX',
      UUID: '10cfdf08-0502-3c1e-9986-074414a4a6e1',
      defaultLat: 49.221266,
      defaultLon: -123.063863,
    };

    // Make the request to your endpoint
    const response = await request(app)
      .post('/createUser')
      .send(userData);

    // Assertions
    expect(response.statusCode).toBe(500);
    expect(response.text).toBe('Error inserting/updating user data into the database');

    // Verify that database functions were called as expected
    expect(mockUserDB.connectToDatabase).toHaveBeenCalled();
    expect(mockUserDB.closeDatabaseConnection).toHaveBeenCalled();
  });
  
  test('should handle no changes in user update', async () => {
  // Input: Existing user data with no changes
  // Expected status code: 200
  // Expected behavior: User data not updated because the user logged in with the same credentials as expected.
  // Expected output: 'User data not updated. No changes were made.'

    // Mock database functions for an existing user
    mockUserDB.getUserInfoByEmail.mockResolvedValueOnce({ email: 'test@example.com' });
    mockUserDB.updateUserByEmail.mockResolvedValueOnce({ modifiedCount: 0 });
  
    // Make the request to your endpoint
    const response = await request(app)
      .post('/createUser')
      .send({
        _id: 5,
        email: 'test@example.com',
        deviceToken: 'cLXlnKK4S2S9hQzYqtsD17:APA91bGqH-S3w7opOQUJClftFyz82amcfjHSqmQtv6tufmF1uBQ5IAEvXi15Hg1azwa4aaWS76q95LqPnxuNOhUGcZ6TXTV_duBGib6TnIBDgS6t3Y_9U8qhVOQHIh3wQmr9jfOfkWQX',
        UUID: '10cfdf08-0502-3c1e-9986-074414a4a6e1',
        defaultLat: 49.221266,
        defaultLon: -123.063863,
      });
  
    // Assertions
    expect(response.statusCode).toBe(200);
    expect(response.text).toBe('User data not updated. No changes were made.');
  
    // Verify that database functions were called as expected
    expect(mockUserDB.connectToDatabase).toHaveBeenCalled();
    expect(mockUserDB.getUserInfoByEmail).toHaveBeenCalledWith('test@example.com');
    expect(mockUserDB.updateUserByEmail).toHaveBeenCalledWith(
      'test@example.com',
      {
        _id: 5,
        email: 'test@example.com',
        deviceToken: 'cLXlnKK4S2S9hQzYqtsD17:APA91bGqH-S3w7opOQUJClftFyz82amcfjHSqmQtv6tufmF1uBQ5IAEvXi15Hg1azwa4aaWS76q95LqPnxuNOhUGcZ6TXTV_duBGib6TnIBDgS6t3Y_9U8qhVOQHIh3wQmr9jfOfkWQX',
        UUID: '10cfdf08-0502-3c1e-9986-074414a4a6e1',
        defaultLat: 49.221266,
        defaultLon: -123.063863
      }
    );
    expect(mockUserDB.closeDatabaseConnection).toHaveBeenCalled();
  });  

  test('should normalize email correctly', async () => {
    const userDataWithNonNormalizedEmail = {
      email: 'TEST@EXAMPLE.COM',
      deviceToken: 'cLXlnKK4S2S9hQzYqtsD17:APA91bGqH-S3w7opOQUJClftFyz82amcfjHSqmQtv6tufmF1uBQ5IAEvXi15Hg1azwa4aaWS76q95LqPnxuNOhUGcZ6TXTV_duBGib6TnIBDgS6t3Y_9U8qhVOQHIh3wQmr9jfOfkWQX',
      UUID: '10cfdf08-0502-3c1e-9986-074414a4a6e1',
      defaultLat: 49.221266,
      defaultLon: -123.063863,
    };

    mockUserDB.getUserInfoByEmail.mockResolvedValue(null);
    mockUserDB.insertUser.mockResolvedValueOnce({ insertedId: '12345' });

    // Send a request
    const response = await request(app).post('/createUser').send(userDataWithNonNormalizedEmail);

    // Check if the email was normalized in the database operation
    expect(response.statusCode).toBe(200);
    expect(mockUserDB.insertUser).toHaveBeenCalledWith(expect.objectContaining({
      email: 'test@example.com', // Expected normalized email
      deviceToken: userDataWithNonNormalizedEmail.deviceToken,
      UUID: userDataWithNonNormalizedEmail.UUID,
      defaultLat: userDataWithNonNormalizedEmail.defaultLat,
      defaultLon: userDataWithNonNormalizedEmail.defaultLon
    }));
  });

  test('should normalize email and handle user data correctly', async () => {
    const userDataWithNonNormalizedEmail = {
      email: 'TEST@example.com', // Email to be normalized
      deviceToken: 'cLXlnKK4S2S9hQzYqtsD17:APA91bGqH-S3w7opOQUJClftFyz82amcfjHSqmQtv6tufmF1uBQ5IAEvXi15Hg1azwa4aaWS76q95LqPnxuNOhUGcZ6TXTV_duBGib6TnIBDgS6t3Y_9U8qhVOQHIh3wQmr9jfOfkWQX',
      UUID: '10cfdf08-0502-3c1e-9986-074414a4a6e1',
      defaultLat: 49.221266,
      defaultLon: -123.063863,
    };
  
    mockUserDB.getUserInfoByEmail.mockResolvedValue(null);
    mockUserDB.insertUser.mockResolvedValueOnce({ insertedId: '12345' });
  
    // Send a request
    const response = await request(app).post('/createUser').send(userDataWithNonNormalizedEmail);
  
    // Check if the email was normalized in the database operation
    expect(response.statusCode).toBe(200);
    expect(mockUserDB.insertUser).toHaveBeenCalledWith(expect.objectContaining({
      email: 'test@example.com', // Expected normalized email
      deviceToken: userDataWithNonNormalizedEmail.deviceToken,
      UUID: userDataWithNonNormalizedEmail.UUID,
      defaultLat: userDataWithNonNormalizedEmail.defaultLat,
      defaultLon: userDataWithNonNormalizedEmail.defaultLon
    }));
  });

  test('should handle deviceToken', async () => {
    const userDataWithNonNormalizedEmail = {
      email: 'test@example.com', // Email to be normalized
      deviceToken: 2364,
      UUID: '10cfdf08-0502-3c1e-9986-074414a4a6e1',
      defaultLat: 49.221266,
      defaultLon: -123.063863,
    };
  
    mockUserDB.getUserInfoByEmail.mockResolvedValue(null);
    mockUserDB.insertUser.mockResolvedValueOnce({ insertedId: '12345' });
  
    // Send a request
    const response = await request(app).post('/createUser').send(userDataWithNonNormalizedEmail);
  
    // Check if the email was normalized in the database operation
    expect(response.statusCode).toBe(400);
  });

  test('should handle uuid', async () => {
    const userDataWithNonNormalizedEmail = {
      email: 'test@example.com', // Email to be normalized
      deviceToken: 'cLXlnKK4S2S9hQzYqtsD17:APA91bGqH-S3w7opOQUJClftFyz82amcfjHSqmQtv6tufmF1uBQ5IAEvXi15Hg1azwa4aaWS76q95LqPnxuNOhUGcZ6TXTV_duBGib6TnIBDgS6t3Y_9U8qhVOQHIh3wQmr9jfOfkWQX',
      UUID: '12sv',
      defaultLat: 49.221266,
      defaultLon: -123.063863,
    };
  
    mockUserDB.getUserInfoByEmail.mockResolvedValue(null);
    mockUserDB.insertUser.mockResolvedValueOnce({ insertedId: '12345' });
  
    // Send a request
    const response = await request(app).post('/createUser').send(userDataWithNonNormalizedEmail);
  
    // Check if the email was normalized in the database operation
    expect(response.statusCode).toBe(400);
  });

  test('should handle latitude and longitude', async () => {
    const userDataWithNonNormalizedEmail = {
      email: 'test@example.com', // Email to be normalized
      deviceToken: 'cLXlnKK4S2S9hQzYqtsD17:APA91bGqH-S3w7opOQUJClftFyz82amcfjHSqmQtv6tufmF1uBQ5IAEvXi15Hg1azwa4aaWS76q95LqPnxuNOhUGcZ6TXTV_duBGib6TnIBDgS6t3Y_9U8qhVOQHIh3wQmr9jfOfkWQX',
      UUID: '10cfdf08-0502-3c1e-9986-074414a4a6e1',
      defaultLat: 94.221266,
      defaultLon: -183.063863,
    };
  
    mockUserDB.getUserInfoByEmail.mockResolvedValue(null);
    mockUserDB.insertUser.mockResolvedValueOnce({ insertedId: '12345' });
  
    // Send a request
    const response = await request(app).post('/createUser').send(userDataWithNonNormalizedEmail);
  
    // Check if the email was normalized in the database operation
    expect(response.statusCode).toBe(400);
  });
  

});