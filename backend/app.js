const express = require("express");
const { body, validationResult } = require('express-validator');
const chatRoute = require('./routes/chatRoute');
const admin = require('firebase-admin');
const routeEngine = require('./engine/routeEngine');


function getFormattedSubtractedTime(dataItems, subtractMinutes) {
	// Check if dataItems is an array
	if (Array.isArray(dataItems)) {
		// Process each data item in the array
		return dataItems.map(dataItem => formatSingleItem(dataItem, subtractMinutes));
	} else {
		// Handle a single data item
		return formatSingleItem(dataItems, subtractMinutes);
	}
}

function formatSingleItem(dataItem, subtractMinutes) {
	if (dataItem.Start && dataItem.Start.Time) {
		// Parse the input time into hours and minutes
		const [hours, minutes] = dataItem.Start.Time.split(':');

		// Convert hours and minutes to minutes and subtract the specified duration
		let totalMinutes = parseInt(hours, 10) * 60 + parseInt(minutes, 10);
		totalMinutes -= subtractMinutes;

		// Handle cases where the totalMinutes becomes negative
		if (totalMinutes < 0) {
			totalMinutes += 24 * 60; // Add a day's worth of minutes (1440 minutes) to handle crossing midnight
		}

		// Calculate the hours and minutes for the new time
		const newHours = Math.floor(totalMinutes / 60);
		const newMinutes = totalMinutes % 60;

		// Format the new time as HH:mm
		const hoursPart = newHours.toString().padStart(2, '0');
		const minutesPart = newMinutes.toString().padStart(2, '0');
		const formattedTime = `${hoursPart}:${minutesPart}`;

		return formattedTime;
	} else {
		console.error('Invalid data structure:', dataItem);
		return null; // Return null if the data structure is invalid
	}
}

function adjustNewHours(hours, subtractHours) {
	let newHours = hours - subtractHours;
	if (newHours < 0) {
		newHours += 24; // Handle wrapping to the previous day
	}
	return newHours;
}

module.exports = function(database) {
	const app = express();
	app.use(express.json())

	app.getFormattedSubtractedTime = getFormattedSubtractedTime;
	app.adjustNewHours = adjustNewHours;

	app.use('/api/chat', chatRoute)

  const isLatitude = (value) => {
		const latitude = parseFloat(value);
		return !isNaN(latitude) && latitude >= -90 && latitude <= 90;
	};

	const isLongitude = (value) => {
		const longitude = parseFloat(value);
		return !isNaN(longitude) && longitude >= -180 && longitude <= 180;
	};

	app.get("/", (req, res) => {
		res.send("Hello World!")
	})

	app.post(
		'/createUser',
		[
			body('email').isEmail().normalizeEmail(),
      body('deviceToken').isString().trim(),
      body('UUID').isUUID(),
      body('defaultLat').custom(isLatitude),
      body('defaultLon').custom(isLongitude),
		],
		async (req, res) => {
			const errors = validationResult(req);
			if (!errors.isEmpty()) {
				return res.status(400).json({ errors: errors.array() });
			}

			try {
				await database.connectToDatabase();
				const existingUser = await database.getUserInfoByEmail(req.body.email);

				if (existingUser) {
					const updateResult = await database.updateUserByEmail(
						req.body.email,
						req.body
					);

					if (updateResult.modifiedCount > 0) {
						console.log('User data updated in the database: ', req.body);
						res.status(200).send('User data updated in the database');
					} else {
						console.log('User data not updated. No changes were made.');
						res.status(200).send('User data not updated. No changes were made.');
					}
				} else {
					const result = await database.insertUser(req.body);
					console.log('New user data inserted into the database: ', result);
					res.status(200).send('New user data inserted into the database');
				}
			} catch (error) {
				console.error('Error inserting/updating user data into the database: ', error);
				res.status(500).send('Error inserting/updating user data into the database');
			} finally {
				await database.closeDatabaseConnection();
			}
		}
	);

	app.post(
		'/addFriend',
		[
			body('userEmail').isEmail().normalizeEmail(),
			body('friendEmail').isEmail().normalizeEmail(),
		],
		async (req, res) => {
			const errors = validationResult(req);
			if (!errors.isEmpty()) {
				return res.status(400).json({ errors: errors.array() });
			}

			try {
				await database.connectToDatabase();
				const userEmail = req.body.userEmail;
				const friendEmail = req.body.friendEmail;

				const userExists = await database.getUserInfoByEmail(userEmail);

				if (userExists) {
					const userUpdate = {
						//$addToSet: { FriendsList: friendEmail },
						FriendsList: friendEmail,
					};

					const userResult = await database.updateUserByEmail(userEmail, userUpdate);

					if (userResult.modifiedCount === 1) {
						console.log("Friend added to the user's FriendsList.");
					} else {
						console.log("Friend already added to the user's FriendsList.");
					}

					const friendExists = await database.getUserInfoByEmail(friendEmail);

					if (friendExists) {
						const friendUpdate = {
							//$addToSet: { FriendsList: userEmail },
							FriendsList: userEmail,
						};

						const friendResult = await database.updateUserByEmail(friendEmail, friendUpdate);

						if (friendResult.modifiedCount === 1) {
							console.log("User added to the friend's FriendsList.");
						} else {
							console.log("User already added to the friend's FriendsList.");
						}
					} else {
						console.log("Friend not found in the database.");
						res.status(404).send("Friend not found in the database.");
						return;
					}

					res.status(200).send("Friend added to both FriendLists.");
				} else {
					console.log("User not found in the database.");
					res.status(404).send("User not found in the database.")
				}
			} catch (error) {
				console.error("Error adding friend: ", error);
				res.status(500).send("Error adding friend.");
			} finally {
				await database.closeDatabaseConnection();
			}
		}
	);

	app.get("/getFriendList", async (req, res) => {
		try {
			await database.connectToDatabase();
			const userEmail = req.query.userEmail;

			const userExists = await database.getUserInfoByEmail(userEmail);

			if (userExists) {
				if (userExists.FriendsList && userExists.FriendsList.length > 0) {
					const friendsList = userExists.FriendsList;
					res.status(200).json({ FriendsList: friendsList });
				} else {
					res.status(200).send("No friends");
				}
			} else {
				console.log("User not found in the database.");
				res.status(404).send("User not found in the database.");
			}
		} catch (error) {
			console.error("Error getting friend list: ", error);
			res.status(500).send("Error getting friend list.");
		} finally {
			await database.closeDatabaseConnection();
		}
	});

	const subtractedMinutes = 10;

	app.post(
		'/getFormattedSubtractedTime',
		[
			body('email').isEmail().normalizeEmail(),
			body('eventName').isString().notEmpty(),
			body('location.latitude').custom(isLatitude),
			body('location.longitude').custom(isLongitude),
			body('events.*.time').isISO8601(),
		],
		async (req, res) => {
			const errors = validationResult(req);
			if (!errors.isEmpty()) {
				return res.status(400).send("Invalid or missing data");
			}

			const userEmail = req.body.email;
			const eventData = req.body.location;
			const latitude = eventData.latitude;
			const longitude = eventData.longitude;
			const providedTime = req.body.time;

			try {
				await database.connectToDatabase();
				const userExists = await database.getUserInfoByEmail(userEmail);

				if (userExists) {
					const defaultLat = userExists.defaultLat;
					const defaultLong = userExists.defaultLon;

					const timePart = providedTime.match(/T(\d+:\d+:\d+)/)[1];
					const [hours, minutes, seconds] = timePart.split(':').map(Number);

					const newHours = adjustNewHours(hours, 2);

					const startTime = `${newHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

					await routeEngine.init();

					const result = routeEngine.getRoute(defaultLat, defaultLong, latitude, longitude, startTime);

					const formattedSubtractedTimes = result.map((item) => {
						const formattedSubtractedTime = getFormattedSubtractedTime(item, subtractedMinutes);
						return formattedSubtractedTime;
					});

					const filteredTimes = formattedSubtractedTimes.filter(time => time !== null);

					res.json({ times: filteredTimes });
				} else {
					res.status(404).send('User not found in the database');
				}
			} catch (err) {
				res.status(500).send('Error connecting to the database: ' + err.message);
			} finally {
				await database.closeDatabaseConnection();
			}
		}
	);


	// route endpoint
	//app.post('/getRoute', async (req, res) => {
		app.post('/getRoute', [
			body('startLat').custom(isLatitude),
			body('startLon').custom(isLongitude),
			body('endLat').custom(isLatitude),
			body('endLon').custom(isLongitude),
			body('startTime').matches(/^([01]\d|2[0-3]):([0-5]\d):([0-5]\d)$/),
		], async (req, res) => {
			const errors = validationResult(req);
			if (!errors.isEmpty()) {
				return res.status(400).json({ errors: errors.array() });
			}
			console.log(req.body);
			const { startLat, startLon, endLat, endLon, startTime } = req.body;

			await database.connectToDatabase();
			await routeEngine.init();

			const result = routeEngine.getRoute(startLat, startLon, endLat, endLon, startTime);
			console.log(result);

			res.json(result);
			await database.closeDatabaseConnection();
		});

		//app.post('/getFriendRoute', async (req, res) => {
			app.post('/getFriendRoute', [
				body('startLat').custom(isLatitude),
				body('startLon').custom(isLongitude),
				body('endLat').custom(isLatitude),
				body('endLon').custom(isLongitude),
				body('endTime').matches(/^([01]\d|2[0-3]):([0-5]\d):([0-5]\d)$/),
				body('friendEmail').isEmail().normalizeEmail(),
			], async (req, res) => {
				const errors = validationResult(req);
				if (!errors.isEmpty()) {
					return res.status(400).json({ errors: errors.array() });
				}

				const { startLat, startLon, endLat, endLon, endTime, friendEmail } = req.body;

				await database.connectToDatabase();
				const userExists = await database.getUserInfoByEmail(friendEmail);

				if (userExists) {
					const defaultLat = userExists.defaultLat; 
					const defaultLong = userExists.defaultLon;

					await routeEngine.init();
					const result = routeEngine.getPartnerRoute(startLat, startLon, defaultLat, defaultLong, endLat, endLon, endTime);
					console.log(result);
					res.json({result});
				} else {
					res.status(500).json({ error: 'User does not exist in the DB' });
				}

				await database.closeDatabaseConnection();
			});

			app.get('/getFCM', async (req, res) => {
				try {
					await database.connectToDatabase();

					const userEmail = req.query.userEmail;
					const userExists = await database.getUserInfoByEmail(userEmail);

					if (userExists) {
						const fcmToken = userExists.deviceToken;

						const payload = {
							notification: {
								title: 'TransitTrack Alert',
								body: 'Your TransitTrack journey begins in 10 minutes!',
							},
						};

						await admin.messaging().sendToDevice(fcmToken, payload);

						res.status(201).json({ message: 'Alert sent successfully' });
					} else {
						res.status(404).json({ message: 'Could not send journey alert' });
					}

					database.closeDatabaseConnection();
				} catch (err) {
					console.error('Error:', err);
					database.closeDatabaseConnection();
					res.status(500).json({ message: 'An error occurred while getFCM.' });
				}
			});

			return app
		}
