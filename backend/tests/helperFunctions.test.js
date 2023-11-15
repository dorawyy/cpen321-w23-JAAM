const request = require('supertest');
const nock = require('nock');
const https = require('https');
const makeApp = require('../app.js');
//const database = require('./database.js');
const mockUserDB = require('../mockUserDB.js');
const { describe, expect } = require('@jest/globals');
const subtractFunc = require('../app.js')();

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



// Mock data for testing
const mockUserData = {
  email: 'test@example.com',
  defaultLat: 40.7128,
  defaultLon: -74.0060,
};

const mockEventData = {
  latitude: 37.7749,
  longitude: -122.4194,
};

const mockRouteResponse = [
  { Start: { Time: '12:00' } },
  { Start: { Time: '15:30' } },
  // Add more data items as needed
];

// Mock the database functions
mockUserDB.getUserInfoByEmail.mockResolvedValue(mockUserData);
mockUserDB.connectToDatabase.mockResolvedValue();
mockUserDB.closeDatabaseConnection.mockResolvedValue();

// Mock the HTTPS request
jest.mock('https');

const mockHttpsResponse = {
  on: jest.fn((event, callback) => {
    if (event === 'data') {
      callback(JSON.stringify(mockRouteResponse));
    } else if (event === 'end') {
      callback();
    }
  }),
};

jest.spyOn(require('https'), 'request').mockImplementation((options, callback) => {
  callback(mockHttpsResponse);
  return {
    on: jest.fn(),
    write: jest.fn(),
    end: jest.fn(),
  };
});

describe('getFormattedSubtractedTime', () => {
    test('should return formatted time for valid input', () => {
      const dataItems = [
        { "Start": { "Time": "12:00" } },
        { "Start": { "Time": "15:30" } }
      ];
      const subtractMinutes = 10;
      const result = subtractFunc.getFormattedSubtractedTime(dataItems, subtractMinutes);
      expect(result).toEqual(['11:50', '15:20']);
    });
  

  test('should handle invalid data structure and return null', () => {
    const invalidDataItem = {};
    const subtractedMinutes = 10;
    const formattedTime = subtractFunc.getFormattedSubtractedTime(invalidDataItem, subtractedMinutes);
    expect(formattedTime).toBeNull();
  });

  test('should handle negative totalMinutes by adding a day', () => {
    const dataItem = { "Start": { "Time": "01:30" } };
    const subtractMinutes = 120; // Subtract 2 hours, resulting in negative totalMinutes
    const result = subtractFunc.getFormattedSubtractedTime(dataItem, subtractMinutes);
    expect(result).toBe('23:30'); // Expected result after adding a day
  });
  test('should handle null or missing Start.Time and return null', () => {
    const dataItems = [
      { Start: { Time: '12:00' } },
      { Start: { Time: null } },
      { Start: { /* Time property missing */ } },
    ];
    const subtractMinutes = 10;
    const result = subtractFunc.getFormattedSubtractedTime(dataItems, subtractMinutes);
    expect(result).toEqual(['11:50', null, null]);
  });
  test('adjustNewHours should handle wrapping to the previous day when subtracting 2 hours', () => {
    expect(subtractFunc.adjustNewHours(1, 2)).toBe(23);
    expect(subtractFunc.adjustNewHours(10, 2)).toBe(8);
    expect(subtractFunc.adjustNewHours(0, 2)).toBe(22); // Handle wrapping from midnight
  });

});
