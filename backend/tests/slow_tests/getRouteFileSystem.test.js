const request = require('supertest');
const makeApp = require('../../app.js');
const mockUserDB = require('../../mockUserDB.js');
const { describe } = require('@jest/globals');

const fs = require('fs');

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

jest.mock('fs', () => {
    const originalModule = jest.requireActual('fs');
    return {
        ...originalModule,
        existsSync: jest.fn()
    }
})


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

const app = makeApp(mockUserDB);

// Interface POST server/getRoute
describe('/getRoute, while mocking the filesystem', () => {
	// Input: valid start location, end location, and time
	// Ex Status: 200
	// Ex Behaviour: Returns correct route, but after *long* delay as it has to set up the filesystem
	// Ex Output: Valid Route
    test('first route request of the server, before files have been generated', async () => {
        const requestData = {
            startLat: 49.23448197693943,
            startLon: -123.14438232,
            endLat: 49.232874459331,
            endLon: -123.0432616,
            startTime: "08:00:00"
        };
		fs.existsSync.mockReturnValueOnce(false).mockReturnValueOnce(false);
        const response = await request(app)
            .post('/getRoute')
            .send(requestData);
        expect(response.status).toBe(200);
        expect(isValidRoute(JSON.parse(response.text))).toBe(true);
    }, 180000000);
});
