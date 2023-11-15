const request = require('supertest');
const express = require('express');
const { app } = require('./server'); 

// Mock the database module
jest.mock('./database');

describe('User Creation API', () => {
  // Input: Valid user data
  // Expected status code: 200
  // Expected behavior: User data added to the mock database
  // Expected output: 'New user data inserted into the database'
  test('Valid User Data', async () => {
    const userData = { email: 'test@example.com', name: 'Test User' };
    const response = await request(app)
      .post('/createUser')
      .send(userData);
    expect(response.status).toBe(200);
    expect(response.text).toBe('New user data inserted into the database');

    // Verify data in the mock database
    const { findUser } = require('./database');
    const user = findUser('test@example.com');
    expect(user).toMatchObject(userData);
  });

  // ... Add more test cases for different scenarios ...
});
