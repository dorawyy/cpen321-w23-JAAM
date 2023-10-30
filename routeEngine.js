const fs = require('fs');
const routesPath = 'translink_data/routes.txt';
const calendarDatesPath = 'translink_data/calendar_dates.txt';
const calendarPath = 'translink_data/calendar.txt';
const directionNamesExceptionsPath = 'translink_data/direction_names_exceptions.txt';
const directionsPath = 'translink_data/directions.txt';
const patternIdPath = 'translink_data/pattern_id.txt';
const shapesPath = 'translink_data/shapes.txt';
const stopOrderExceptionsPath = 'translink_data/stop_order_exceptions.txt';
const stopsPath = 'translink_data/stops.txt';
const stopTimesPath = 'translink_data/stop_times.txt';
const transfersPath = 'translink_data/transfers.txt';
const tripsPath = 'translink_data/trips.txt';



async function main() {
    var routes = parseFile(routesPath);
    var calendar = parseFile(calendarPath);
    var calendarDates = parseFile(calendarDatesPath);
    var directionNamesExceptions = parseFile(directionNamesExceptionsPath);
    var directions = parseFile(directionsPath);
    var patternId = parseFile(patternIdPath);
    var shapes = parseFile(shapesPath);
    shapes = combineShapes(await shapes);
    var stopOrderExceptions = parseFile(stopOrderExceptionsPath);
    var stops = parseFile(stopsPath);
    var stopTimes = parseFile(stopTimesPath);
    var transfers = parseFile(transfersPath);
    var trips = await parseFile(tripsPath);
    addShapesToTrips(shapes, trips);
    addTripsToRoutes(trips, await routes)
    // console.log(await trips);
}



function parseFile(path)  {
    return new Promise(function(resolve, reject) {
        fs.readFile(path, 'utf8', (err, data) => {
            if (err) {
                reject(err);
            }

            var output = [];
            var lines = data.split('\r\n');
    	    lines.pop();    // Get rid of the element that results from after the last newline
            var temp;
            var words;
            var titles = lines[0].split(',');
            var i;
            var j;
    
            for (i = 1; i < lines.length; i++) {
                temp = new Object();
                words = lines[i].split(',');
                for (j = 0; j < words.length; j++) {
                    temp[titles[j]] = words[j];
                }
                output.push(temp);
            }
        
            resolve(output);
        });
    });
    
}

function combineShapes(shapes) {
    var outputShapes = new Object();
    var temp;
    shapes.forEach(point => {
        temp = new Object();
        temp.lat = point.shape_pt_lat;
        temp.long = point.shape_pt_lon;
        if (outputShapes[point.shape_id] === undefined) {
            outputShapes[point.shape_id] = [];
        }
        outputShapes[point.shape_id][parseInt(point.shape_pt_sequence)-1] = temp;
    });
    return outputShapes;
}

function addShapesToTrips(shapes, trips) {
    trips.forEach(trip => {
        trip.shape = shapes[trip.shape_id];
    });
}

function addTripsToRoutes(trips, routes) {
    routes.forEach(route => {
        route.trips = [];
        for (var i = trips.length - 1; i >= 0; i--) {
            if (trips[i].route_id == route.route_id) {
                route.trips.push(trips[i]);
                trips.splice(i, 1);
            }
        }
    });
    console.log(routes[0].trips.length);
}

main();


