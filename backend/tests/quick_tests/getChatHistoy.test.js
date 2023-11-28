const request = require('supertest');
const makeApp = require('../../app.js');
const mockUserDB = require('../../mockUserDB.js');
const mockChatDB = require('../../mockChatDB.js');

// Mock the Message model
jest.mock('../../models/message', () => ({
  find: jest.fn(),
}));

jest.mock('../mockUserDB', () => ({
  ...jest.requireActual('../../mockUserDB'), // Use the actual implementation for other functions
  getChatHistory: jest.fn(), // Using mockImplementation
}));


const app = makeApp(mockUserDB);

// jest.mock('../mockUserDB', () => ({
//     ...jest.requireActual('../mockUserDB'), // Use the actual implementation for other functions
//     getChatHistory: mockChatDB.getChatHistory,
//   }));

describe('GET /getChatHistory', () => {
  afterEach(() => {
    jest.clearAllMocks();
    // Set up the mock implementation here
    mockUserDB.getChatHistory.mockImplementation(mockChatDB.getChatHistory);
  });
  
  // Input: Valid sender and receiver email
  // Expected status code: 200
  // Expected behavior: Retrieve chat history successfully
  test('should retrieve chat history successfully', async () => {
    const senderEmail = 'j.biden@example.com';
    const receiverEmail = 'c.d@example.com';

    // // Mock the find method of the Message model
    // jest.spyOn(require('./models/message'), 'find').mockReturnValue({
    //   sort: jest.fn().mockReturnValue({
    //     limit: jest.fn().mockResolvedValue(mockChatHistory),
    //   }),
    // });

    const response = await request(app)
      .get('/api/chat/history')
      .query({ senderEmail, receiverEmail });

    expect(response.status).toBe(200);
  });

  // Input: Valid sender and receiver email, but an error occurs during the operation
  // Expected status code: 500
  // Expected behavior: Error response for failed chat history retrieval from the database
  // Expected output: { error: 'Chat history could not be retrieved' }
  test('should handle errors while retrieving chat history', async () => {
    const senderEmail = 'j.biden@example.com';
    const receiverEmail = 'c.d@example.com';

    // Mock an error during the getChatHistory operation
    mockUserDB.getChatHistory.mockRejectedValue(new Error('Database error'));

    const response = await request(app)
      .get('/api/chat/history')
      .query({ senderEmail, receiverEmail });

    expect(response.status).toBe(500);
    expect(response.body).toEqual({ error: 'Chat history could not be retrieved' });

    // Check if the getChatHistory method was called with the correct parameters
    expect(mockUserDB.getChatHistory).toHaveBeenCalledWith({ senderEmail, receiverEmail });
  });

});
