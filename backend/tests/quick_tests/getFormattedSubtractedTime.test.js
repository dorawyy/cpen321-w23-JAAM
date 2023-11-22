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

// Create an instance of the app with the mockUserDB
const app = makeApp(mockUserDB);

// Interface POST server/getFormattedSubtractedTime
describe('/getFormattedSubtractedTime, gets time that the user needs to leave for their event', () => {
	// Input: valid user email, eventName, location, and time
	// Ex Status: 200
	// Ex Behaviour: Searches databse to find time that user needs to leave
	// Ex Output: Time the user needs to leave
	test.concurrent('valid input', async () => {
		const requestData = {
            email: "a@test.com",
            eventName: "test",
            location: {
                latitude: 49.23448197693943,
                longitude: -123.14438232
            },
            events: {
                test: {
                    time: "2023-11-25T14:41:52"
                }
            },
            time: "2023-11-25T14:41:52"
		};
		const response = await request(app)
			.post('/getFormattedSubtractedTime')
			.send(requestData);
        console.log(response.status);
        console.log(response.text);
		expect(response.status).toBe(200);
	}, 60000);
	// Input: Valid input but user / email does not exist in database
	// Ex Status: 404
	// Ex Behaviour: Throws error
	// Ex Output: Response explaining error
	test.concurrent('invalid email', async () => {
		const requestData = {
            email: "test@wrong.com",
            eventName: "test",
            location: {
                latitude: 49.23448197693943,
                longitude: -123.14438232
            },
            time: "2023-11-25T14:41:52"
		};
		const response = await request(app)
			.post('/getFormattedSubtractedTime')
			.send(requestData);
        console.log(response.status);
        console.log(response.text);
		expect(response.status).toBe(404);
		expect(response.text.includes('not found')).toBe(true);
	}, 60000);
	// Input: proper email / eventName / location / time do not exist
	// Ex Status: 400
	// Ex Behaviour: Throws error
	// Ex Output: Response explaining error
	test.concurrent('nonexistent / garbage input', async () => {
		const requestData = {
			garbage: "tes"
		};
		const response = await request(app)
			.post('/getFormattedSubtractedTime')
			.send(requestData);
        console.log(response.status);
        console.log(response.text);
		expect(response.status).toBe(400);
		expect(response.text.includes('Invalid')).toBe(true);
	}, 60000);
	// Input: valid input but server is down
	// Ex Status: 500
	// Ex Behaviour: Throws error
	// Ex Output: Response explaining error
	test.concurrent('faulty server', async () => {
		// mockUserDB.connectToDatabase.mockImplementationOnce(() => {
		// 	const err = new Error();
		// 	throw err;
		// });
		const requestData = {
			email: "a@test.com",
			eventName: "test",
			location: {
				latitude: 49.23448197693943,
				longitude: -123.14438232
			},
			time: "2023-11-25t14:41:52"
		};
		const response = await request(app)
			.post('/getFormattedSubtractedTime')
			.send(requestData);
        
        console.log(response.status);
        console.log(response.text);
		expect(response.status).toBe(500);
		expect(response.text.includes('database')).toBe(true);
	}, 60000);

});
