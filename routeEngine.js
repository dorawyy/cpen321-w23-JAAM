const fs = require('fs');
const routes_path = 'translink_data/routes.txt';
const calendar_dates_path = 'translink_data/calendar_dates.txt';
const calendar_path = 'translink_data/calendar.txt';
const directions_path = 'translink_data/directions.txt';
const pattern_id_path = 'translink_data/pattern_id.txt';
const shapes_path = 'translink_data/shapes.txt';
const stop_order_exceptions_path = 'translink_data/stop_order_exceptions.txt';
const stops_path = 'translink_data/stops.txt';
const stop_times_path = 'translink_data/stop_times.txt';
const transfers_path = 'translink_data/transfers.txt';
const trips_path = 'translink_data/trips.txt';
const LOG = true;  



async function main() {
    var routes = await parseFile(routes_path);
    var calendar = parseFile(calendar_path);
    var calender_dates = parseFile(calendar_dates_path);
    var directions = await parseFile(directions_path);
    var pattern_id = parseFile(pattern_id_path);
    var shapes = await parseFile(shapes_path);
    shapes = combineShapes(shapes);
    var stop_order_exceptions = parseFile(stop_order_exceptions_path);
    var stops = parseFile(stops_path);
    var stop_times = await parseFile(stop_times_path);
    var transfers = parseFile(transfers_path);
    var trips = await parseFile(trips_path);
    addShapesToTrips(shapes, trips);
    addDirectionsToTrips(directions, trips);
    addTripsToRoutes(trips, routes);
    addStopsToTrips(stops, stop_times, trips);
    // console.log(routes);
}



function parseFile(path)  {
    return new Promise(function(resolve, reject) {
        fs.readFile(path, 'utf8', (err, data) => {
            if (err) {
                reject(err);
            }

            if (LOG) {
                console.log("Parsing File: ", path);
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
    if (LOG) {
        console.log("Combining Shapes");
    }

    
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
    if (LOG) {
        console.log("Adding Shapes to Trips");
    }

    trips.forEach(trip => {
        trip.shape = shapes[trip.shape_id];
    });
}

function addDirectionsToTrips(directions, trips) {
    if (LOG) {
        console.log("Adding Directions to Trips");
    }

    trips.forEach(trip => {
        for (var i = 0; i < directions.length; i++) {
            if (directions[i].route_id == trip.route_id && directions[i].direction_id == trip.direction_id) {
                trip.direction = directions[i].direction;
                trip.short_id = directions[i].route_short_name;
                break;
            }
        }
    });
}

function addTripsToRoutes(trips, routes) {
    if (LOG) {
        console.log("Adding Trips to Routes");
    }

    routes.forEach(route => {
        route.trips = [];
        for (var i = trips.length - 1; i >= 0; i--) {
            if (trips[i].route_id == route.route_id) {
                route.trips.push(trips[i]);
                if (route.short_id === undefined) {
                    route.short_id = trips[i].short_id;
                }
            }
        }
    });
}

// Holy **** this approach is too slow, maybe do stop centric instead of trip centric organization? Instead maybe only look up times if routes are okay?
function addStopsToTrips(stops, stop_times, trips) {
    if (LOG) {
        console.log("Adding Stop Times to Trips");
    }
    for (var i = 0; i < trips.length; i++) {
        trips[i].stop_times = [];
    }
    for (var i = 0; i < stops.length; i++) {
        stops[i].stop_times = [];
    }
    for (var i = 0; i < stop_times.length; i++) {
        for (var j = 0; j < stops.length; j++) {
            if (stop_times[i].stop_id == stops[j].stop_id) {
                stops[j].stop_times.push(stop_times[i]);
            }
        }
        for (var j = 0; j < trips.length; j++) {
            if (stop_times[i].trip_id == trips[j].trip_id) {
                trips[j].stop_times.push(stop_times[i]);
                stop_times[i].route = trips.route_id;
                break;
            }
        }
    }
    console.log(trips[0]);
}

main();


