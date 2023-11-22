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

// Interface POST server/getRoute
describe('/getRoute, get routes between two locations', () => {
	// Input: valid start location, end location, and time
	// Ex Status: 200
	// Ex Behaviour: Returns correct route
	// Ex Output: Valid Route
	test.concurrent('get very short route', async () => {
		const requestData = {
			startLat: 49.23448197693943,
			startLon: -123.14438232,
			endLat: 49.232874459331,
			endLon: -123.0432616,
			startTime: "08:00:00"
		};
		const response = await request(app)
			.post('/getRoute')
			.send(requestData);
		expect(response.status).toBe(200);
		expect(isValidRoute(JSON.parse(response.text))).toBe(true);
	}, 60000);
	// Input: valid start location, end location, and time
	// Ex Status: 200
	// Ex Behaviour: Tries to find route but fails
	// Ex Output: Not a Route
	test.concurrent('try to get route too early for busses to be running', async () => {
		const requestData = {
			startLat: 49.23448197693943,
			startLon: -123.14438232,
			endLat: 49.232874459331,
			endLon: -123.0432616,
			startTime: "03:00:00"
		};
		const response = await request(app)
			.post('/getRoute')
			.send(requestData);
		expect(response.status).toBe(200);
		expect(isValidRoute(JSON.parse(response.text))).toBe(false);
	}, 60000);
	// Input: no valid locations or time
	// Ex Status: 400
	// Ex Behaviour: Refuses to find a route
	// Ex Output: Not a Route
	test.concurrent('invalid input', async () => {
		const requestData = {
			garbage: 120
		};
		const response = await request(app)
			.post('/getRoute')
			.send(requestData);
		expect(response.status).toBe(400);
		expect(isValidRoute(JSON.parse(response.text))).toBe(false);
	}, 60000);
	// Input: valid start location, end location, and time
	// Ex Status: 200
	// Ex Behaviour: Returns correct route
	// Ex Output: Valid Route
	test.concurrent('get mid sized route', async () => {
		const requestData = {
			startLat: 49.28171253103366,
			startLon: -123.05614,
			endLat: 49.26760027912748,
			endLon: -123.2477435,
			startTime: "12:00:00"
		};
		const response = await request(app)
			.post('/getRoute')
			.send(requestData);
		console.log(response.text);
		expect(response.status).toBe(200);
		expect(isValidRoute(JSON.parse(response.text))).toBe(true);
	}, 60000);
	// Input: valid start location, end location, and time
	// Ex Status: 200
	// Ex Behaviour: Returns correct route
	// Ex Output: Valid Route
	test.concurrent('get route in Surrey', async () => {
		const requestData = {
			startLat: 49.13396756582007,
			startLon: -122.8792349277,
			endLat: 49.111892407777795,
			endLon: -122.823530811,
			startTime: "14:00:00"
		};
		const response = await request(app)
			.post('/getRoute')
			.send(requestData);
		console.log(response.text);
		expect(response.status).toBe(200);
		expect(isValidRoute(JSON.parse(response.text))).toBe(true);
	}, 60000);
	// Input: valid start location, end location, and time
	// Ex Status: 200
	// Ex Behaviour: Returns correct route
	// Ex Output: Valid Route
	test.concurrent('get route in Richmond', async () => {
		const requestData = {
			startLat: 49.15587849555075,
			startLon: -123.1143441168,
			endLat: 49.16320646193623,
			endLon: -123.1593648985,
			startTime: "18:00:00"
		};
		const response = await request(app)
			.post('/getRoute')
			.send(requestData);
		console.log(response.text);
		expect(response.status).toBe(200);
		expect(isValidRoute(JSON.parse(response.text))).toBe(true);
	}, 60000);
	// Input: valid start location, end location, and time
	// Ex Status: 200
	// Ex Behaviour: Returns correct route, but taking a while to compute
	// Ex Output: Valid Route
	test.concurrent('get route from Richmond to Vancouver', async () => {
		const requestData = {
			startLat: 49.1846533666348,
			startLon: -123.0914190345,
			endLat: 49.23436463787667,
			endLon: -123.13977619844798,
			startTime: "14:00:00"
		};
		const response = await request(app)
			.post('/getRoute')
			.send(requestData);
		console.log(response.text);
		expect(response.status).toBe(200);
		expect(isValidRoute(JSON.parse(response.text))).toBe(true);
	}, 60000);
});
