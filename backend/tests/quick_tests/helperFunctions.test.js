const makeApp = require('../../app.js');
//const database = require('./database.js');
const mockUserDB = require('../../mockUserDB.js');
const { describe, expect } = require('@jest/globals');
const subtractFunc = require('../../app.js')();

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



// Mock data for testing
const mockUserData = {
  email: 'test@example.com',
  defaultLat: 40.7128,
  defaultLon: -74.0060,
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
  // Input: Valid data items with "Start" and "Time" properties
  // Expected behavior: Subtract 10 minutes from the start times in an array
  // Expected output: An array of formatted times ['11:50', '15:20']
  test('should return formatted time for valid input', () => {
      const dataItems = [
        { "Start": { "Time": "12:00" } },
        { "Start": { "Time": "15:30" } }
      ];
      const subtractMinutes = 10;
      const result = subtractFunc.getFormattedSubtractedTime(dataItems, subtractMinutes);
      expect(result).toEqual(['11:50', '15:20']);
    });
  
  // Input: Invalid data structure inputted (empty object)
  // Expected behavior: Subtract 10 minutes from the start times
  // Expected output: null
  test('should handle invalid data structure and return null', () => {
    const invalidDataItem = {};
    const subtractedMinutes = 10;
    const formattedTime = subtractFunc.getFormattedSubtractedTime(invalidDataItem, subtractedMinutes);
    expect(formattedTime).toBeNull();
  });

  // Input: Valid data items with "Start" and "Time" properties
  // Expected behavior: Subtract 120 minutes but with negative calculation (previous day)
  // Expected output: Adjusted time with a day added [for example - outputs '23:30' for the input '01:30']
  test('should handle negative totalMinutes by adding a day', () => {
    const dataItem = { "Start": { "Time": "01:30" } };
    const subtractMinutes = 120; // Subtract 2 hours, resulting in negative totalMinutes
    const result = subtractFunc.getFormattedSubtractedTime(dataItem, subtractMinutes);
    expect(result).toBe('23:30'); // Expected result after adding a day
  });

  // Input: Data items with null or missing Start Time property
  // Expected behavior: Subtract 10 minutes from the given start times
  // Expected output: Array with adjusted and null values ['11:50', null, null]
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

  // Input: Hour part of the time is inputted
  // Expected behavior: Subtracts 2 hours from the given hour part of the time
  // Expected output: Returns the subtracted hour
  test('adjustNewHours should handle wrapping to the previous day when subtracting 2 hours', () => {
    expect(subtractFunc.adjustNewHours(1, 2)).toBe(23);
    expect(subtractFunc.adjustNewHours(10, 2)).toBe(8);
    expect(subtractFunc.adjustNewHours(0, 2)).toBe(22);
  });

});
