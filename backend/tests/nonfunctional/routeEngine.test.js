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
const minLat = 49.23305417000743;
const maxLat = 49.264325997513005;
const minLon = -123.18609335024175;
const maxLon = -123.02340523694338;
const minTime = 7;
const maxTime = 21;

function getRandomLat() {
  return Math.random() * (maxLat - minLat) + minLat;
}

function getRandomLon() {
  return Math.random() * (maxLon - minLon) + minLon;
}

function getRandomTime() {
	var time = Math.random() * (maxTime - minTime) + minTime;
	var hour = Math.floor(time);
	var min = Math.floor((time - hour) * 60);
	hour = (hour < 10) ? `0${hour}:` : `${hour}:`;
	min = (min < 10) ? `0${min}:` : `${min}:`;
	return hour + min + "00";
}



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
describe('/getRoute nonfunctional, feeding randomly chosen start / end points in Vancouver to the /getRoute endpoint', () => {
	for (var i = 0; i < 100; i++) {
		const requestData = {
			startLat: getRandomLat(),
			startLon: getRandomLon(),
			endLat: getRandomLat(),
			endLon: getRandomLon(),
			startTime: getRandomTime()
		};
		test(`getting route ${i}, with 
			startLat: ${requestData.startLat} 
			startLon: ${requestData.startLon} 
			endLat: ${requestData.endLat} 
			endLon: ${requestData.endLon} 
			startTime: ${requestData.startTime}	`
			, async () => {
			const response = await request(app)
				.post('/getRoute')
				.send(requestData);
			expect(response.status).toBe(200);
			expect(isValidRoute(JSON.parse(response.text))).toBe(true);
		}, 15000);
	}
});
