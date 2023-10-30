const express = require('express');
const axios = require('axios');
const { addMinutes, format } = require("date-fns");

const app = express();
app.use(express.json());

const apiKey = 'OBA0SkAnEMfAP64ZZVH5';

// Function to get bus stops near a location
async function getBusStops(lat, lon) {
    try {
        const response = await axios.get(
          `https://api.translink.ca/rttiapi/v1/stops?apikey=${apiKey}&lat=${lat}&long=${lon}`
        );
        console.log("Bus Stop:" + response.data)
        return response.data;
      } catch (error) {
        throw new Error('Error getting bus stops: ' + error.message);
      }
}

// async function getBusStops(lat, lon) {
//     try {
//       const response = await axios.get(
//         `https://api.translink.ca/rttiapi/v1/stops?apikey=${apiKey}&lat=${lat}&long=${lon}`
//       );
  
//       const desiredBuses = ['025', '033', 'R4', '049', '044', '084', '014', '004', '007', '099'];
  
//       for (const entry of response.data) {
//         const routes = entry.Routes.split(', ');
//         const hasDesiredBus = routes.some(route => desiredBuses.includes(route));
  
//         if (hasDesiredBus) {
//           return entry;
//         }
//       }
  
//       // If no matching entry is found, return null or handle it as needed
//       return null;
//     } catch (error) {
//       throw new Error('Error getting bus stops: ' + error.message);
//     }
//   }
  

// Function to get bus routes for a stop
async function getBusRoutes(stopNo) {
    try {
        const response = await axios.get(
          `https://api.translink.ca/rttiapi/v1/routes?apikey=${apiKey}&stopNo=${stopNo}`
        );
        return response.data;
      } catch (error) {
        throw new Error('Error getting bus routes: ' + error.message);
      }
}

// Function to get next bus estimates for a stop
async function getNextBusEstimates(stopNo, routeNo) {
    try {
        const response = await axios.get(
          `https://api.translink.ca/rttiapi/v1/stops/${stopNo}/estimates?apikey=${apiKey}&routeNo=${routeNo}`
        );
        return response.data;
      } catch (error) {
        throw new Error('Error getting bus estimates: ' + error.message);
      }
}

function calculateDistance(startLat, startLong, destLat, destLong) {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (destLat - startLat) * (Math.PI / 180);
    const dLon = (destLong - startLong) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(startLat * (Math.PI / 180)) *
        Math.cos(destLat * (Math.PI / 180)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    return distance;
  }

  function calculateTravelTime(distance, averageSpeed) {
    // Convert averageSpeed from km/h to km/min (or miles/h to miles/min)
    const speedPerMinute = averageSpeed / 60;
  
    // Calculate travel time in minutes
    const travelTime = distance / speedPerMinute;
    return travelTime;
  }

// // Function to calculate departure time
// function calculateDepartureTime(desiredArrivalTime, travelTime) {
//     // Split the time and AM/PM
//     const timeParts = desiredArrivalTime.split(" ");
//     const [arrivalTime] = timeParts[0].split(":");
//     const ampm = timeParts[1];
  
//     // Convert the desired arrival time to minutes since midnight
//     let desiredArrivalMinutes = parseInt(arrivalTime, 10);
  
//     if (ampm && ampm.toLowerCase() === "pm" && desiredArrivalMinutes !== 12) {
//       desiredArrivalMinutes = 12 + desiredArrivalParsed; // Add 12 hours if it's PM (except 12 PM)
//     } else if (!ampm || (ampm.toLowerCase() === "am" && desiredArrivalMinutes === 12)) {
//       desiredArrivalMinutes = 0; // Handle 12 AM (midnight)
//     } else {
//         desiredArrivalMinutes = desiredArrivalMinutes;
//     }
  
//     // Calculate departure time
//     let departureMinutes = desiredArrivalMinutes - travelTime;
  
//     // Handle cases where departureMinutes is negative
//     if (departureMinutes < 0) {
//       departureMinutes += 24 * 60; // Add 24 hours to handle the negative value
//     }
  
//     // Convert departure time back to hours and minutes
//     const departureHours = Math.floor(departureMinutes / 60);
//     const departureMinutesRemainder = departureMinutes % 60;
  
//     // Format the departure time
//     const ampmDeparture = departureHours >= 12 ? "PM" : "AM";
//     const formattedDepartureTime = `${departureHours % 12}:${departureMinutesRemainder
//       .toString()
//       .padStart(2, "0")} ${ampmDeparture}`;
  
//     return formattedDepartureTime;
//   }

function calculateDepartureTime(desiredArrivalTime, travelTime) {
    const timeFormat = "hh:mm a"; // Format for time (e.g., "10:00 AM")
  
    // Parse the desired arrival time
    const arrivalDate = new Date(desiredArrivalTime);
  
    // Subtract the travel time from the arrival time
    const departureDate = addMinutes(arrivalDate, -travelTime);
  
    // Format the departure time
    const formattedDepartureTime = format(departureDate, timeFormat);
  
    return formattedDepartureTime;
  }
  
  

// POST route to receive latitude, longitude, and time from the frontend
exports.calculatedDepartureTime = async (req, res) => {
  try {
    const { startLat, startLong, destLat, destLong } = req.body;

    // Bus stops near the starting and destination locations
    const startStops = await getBusStops(startLat, startLong);
    //const destStops = await getBusStops(destLat, destLong);

    // Bus routes for the chosen starting and destination stops
    //const startRoutes = await getBusRoutes(startStops.StopNo);
    //const destRoutes = await getBusRoutes(destStops[0].StopNo);

    const distance = calculateDistance(startLat, startLong, destLat, destLong);
    console.log(distance)
    const carAverageSpeedKmH = 9.3;
    const travelTime = calculateTravelTime(distance, carAverageSpeedKmH);
    console.log(travelTime)

    const desiredArrivalTime = new Date('2023-10-25T01:00:00'); // Replace with your desired time

    const departureTime = calculateDepartureTime(desiredArrivalTime, travelTime);

    // Bus routes for the chosen starting and destination stops
    const startRoutes = await getBusRoutes(51573);

    // Common routes that serve both starting and destination stops
    // const commonRoutes = startRoutes.filter((route) =>
    //   destRoutes.some((destRoute) => destRoute.RouteNo === route.RouteNo)
    // );

    // if (commonRoutes.length === 0) {
    //   throw new Error('No common routes found between starting and destination stops');
    // }

    // Next bus estimates for the chosen route
    const busEstimates = await getNextBusEstimates(51573, startRoutes[0].RouteNo);

    // Check if busEstimates is defined and has a Schedules property
    if (busEstimates && busEstimates.Schedules) {
        // Filter the buses that are leaving before the calculated departure time
        const busesLeavingBeforeDeparture = busEstimates.Schedules.filter(bus => {
          const expectedLeaveTime = new Date(bus.ExpectedLeaveTime);
          return expectedLeaveTime < departureTime;
        });
  
        // Departure time and other information to the user
        res.json({ departureTime: departureTime, busesLeavingBeforeDeparture });
      } else {
        // Handle the case when busEstimates is not available
        res.json({ departureTime: departureTime, busesLeavingBeforeDeparture: [] });
      }
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'An error occurred' });
    }
  };
