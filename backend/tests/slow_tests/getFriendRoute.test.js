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
		getUserInfoByEmail: jest.fn((email) => {
			if (email == "a@test.com") {
				return {
					defaultLat: 49.22647804519063,
					defaultLon: -123.12850491090317
				};
			}
			return false;
		}),
		updateUserByEmail: jest.fn(),
		insertUser: jest.fn(),
		mockClient: {
			db: jest.fn(() => originalModule.mockDb),
		},
	};
});


function stopIsWithinDistance(stop1, stop2) {	
	if (stop1.Lat > stop2.Lat + 0.01 ||
		stop1.Lat < stop2.Lat - 0.01 ||
		stop1.Long > stop2.Long + 0.01 ||
		stop1.Long < stop2.Long - 0.01) {
		return false;
	}
	return true;
}

function isValidRoute(response, startLat, startLon, endLat, endLon, time) {
	if (response === undefined || response === null) {
		return false;
	}

	if (response.length === undefined || response.length < 1)  {
		return false;
	}

	var inbetweenStop;

	for (var i = 0; i < response.length; i++) {
		if (response[i] === undefined ||
			response[i].Start === undefined ||
			response[i].Start.Stop === undefined ||
			response[i].Start.Lat === undefined ||
			response[i].Start.Long === undefined ||
			response[i].Start.Time === undefined ||
			response[i].Start.Bus === undefined ||
			response[i].End === undefined ||
			response[i].End.Stop === undefined ||
			response[i].End.Lat === undefined ||
			response[i].End.Long === undefined ||
			response[i].End.Time === undefined ||
			response[i].End.Bus === undefined) {
			return false; 
		}

		if (response[i].Start.Bus !== response[i].End.Bus ||
			response[i].Start.Time > response[i].End.Time) {
			return false;
		}

		if (i != 0 && i != response.length && 
			inbetweenStop.Stop != response[i].Start.Stop &&
			!stopIsWithinDistance(inbetweenStop, 
				{Lat: response[i].Start.Lat, Long: response[i].Start.Long})) {
			return false;
		}

		inbetweenStop = {
			Stop: response[i].End.Stop,
			Lat: response[i].End.Lat,
			Long: response[i].End.Long
		};
	}

	if (!stopIsWithinDistance({Lat: startLat, Long: startLon},
		{Lat: response[0].Start.Lat, Long: response[0].Start.Long}) ||
		!stopIsWithinDistance({Lat: endLat, Long: endLon},
			{Lat: response[response.length-1].Start.Lat, 
				Long: response[response.length-1].Start.Long}) ) {
		return false;
	}
	return true;
}

// Create an instance of the app with the mockUserDB
const app = makeApp(mockUserDB);

// Interface POST server/getFriendRoute
describe('/getFriendRoute, get shared route for two friends', () => {
	// Input: valid start location, end location, time, and friend email
	// Ex Status: 200
	// Ex Behaviour: Returns correct route
	// Ex Output: 3 Valid Routes that will connect the user and their friend
	test.concurrent('get very short route', async () => {
		const requestData = {
			startLat: 49.2414886543018, 
			startLon: -123.12820278910971,
			endLat: 49.23482386066171, 
			endLon: -123.1631612677039,
			endTime: "14:00:00",
			friendEmail: "a@test.com"
		};
		const response = await request(app)
			.post('/getFriendRoute')
			.send(requestData);
		expect(response.status).toBe(200);
		expect(isValidRoute(JSON.parse(response.text).result.Common)).toBe(true);
		expect(isValidRoute(JSON.parse(response.text).result.A)).toBe(true);
		expect(isValidRoute(JSON.parse(response.text).result.B)).toBe(true);
	}, 60000);
	// Input: no start location, end location, time, and friend email
	// Ex Status: 400
	// Ex Behaviour: Refuses to find route
	// Ex Output: Error message
	test.concurrent('invalid input', async () => {
		const requestData = {
			garbage: 444
		};
		const response = await request(app)
			.post('/getFriendRoute')
			.send(requestData);
		expect(response.status).toBe(400);
		expect(JSON.parse(response.text).errors.length > 0).toBe(true);
	}, 60000);
	// Input: friend email is wrong
	// Ex Status: 500
	// Ex Behaviour: Refuses to find route
	// Ex Output: Error message
	test.concurrent('valid input but friend email does not exist', async () => {
		const requestData = {
			startLat: 49.2414886543018, 
			startLon: -123.12820278910971,
			endLat: 49.23482386066171, 
			endLon: -123.1631612677039,
			endTime: "14:00:00",
			friendEmail: "garbage@email.com"
		};
		const response = await request(app)
			.post('/getFriendRoute')
			.send(requestData);
		expect(response.status).toBe(500);
		expect(JSON.parse(response.text).includes("does not exist")).toBe(true);
	}, 60000);
});
