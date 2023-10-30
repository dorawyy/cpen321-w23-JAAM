const fs = require('fs');
const LOG = true;  



async function main() {
    var routes_path = 'routes.json';
    var stops_path = 'stops.json';
    var trips_path = 'trips.json';
    var stop_times_path = 'stop_times.path';
    if (fs.existsSync(stops_path) && fs.existsSync(routes_path) && fs.existsSync(trips_path) && fs.existsSync(stop_times_path)) {
        if (LOG) {
            console.log("Files exist");
        }
    } else {
        if (LOG) {
            console.log("Files not found");
        }

        routes_path = 'translink_data/routes.txt';
        stops_path = 'translink_data/stops.txt';
        trips_path = 'translink_data/trips.txt';
        stop_times_path = 'translink_data/stop_times.txt';
    }

    // var routes_path = 'translink_data/routes.txt';
    // var calendar_dates_path = 'translink_data/calendar_dates.txt';
    // var calendar_path = 'translink_data/calendar.txt';
    // var directions_path = 'translink_data/directions.txt';
    // var pattern_id_path = 'translink_data/pattern_id.txt';
    // var shapes_path = 'translink_data/shapes.txt';
    // var stop_order_exceptions_path = 'translink_data/stop_order_exceptions.txt';
    // var stops_path = 'translink_data/stops.txt';
    // var stop_times_path = 'translink_data/stop_times.txt';
    // var transfers_path = 'translink_data/transfers.txt';
    // var trips_path = 'translink_data/trips.txt';

    // var routes = await parseTranslinkFile(routes_path);
    // // var calendar = parseFile(calendar_path);
    // // var calender_dates = parseFile(calendar_dates_path);
    // var directions = await parseTranslinkFile(directions_path);
    // // var pattern_id = parseFile(pattern_id_path);
    // var shapes = await parseTranslinkFile(shapes_path);
    // shapes = combineShapes(shapes);
    // // var stop_order_exceptions = parseFile(stop_order_exceptions_path);
    // var stops = await parseTranslinkFile(stops_path);
    // var stop_times = await parseTranslinkFile(stop_times_path);
    // // var transfers = parseFile(transfers_path);
    // var trips = await parseTranslinkFile(trips_path);
    // addShapesToTrips(shapes, trips);
    // addDirectionsToTrips(directions, trips);
    // addTripsToRoutes(trips, routes);
    // addStopsToTrips(stop_times, trips);
    // addStopTimestoStops(stop_times, stops);
    // fs.writeFileSync('./stops.json', JSON.stringify(stops, null, 2) , 'utf-8');
    // fs.writeFileSync('./trips.json', JSON.stringify(trips, null, 2) , 'utf-8');
    // fs.writeFileSync('./routes.json', JSON.stringify(routes, null, 2) , 'utf-8');
    // fs.writeFileSync('./stop_times.json', JSON.stringify(stop_times, null, 2) , 'utf-8');
    // console.log(routes);
}



function parseTranslinkFile(path)  {
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
function addStopsToTrips(stop_times, trips) {
    if (LOG) {
        console.log("Adding Stop Times to Trips");
    }
    
    var stop_times_copy = [...stop_times];
    for (var i = 0; i < trips.length; i++) {
        trips[i].stop_times = [];
        for (var j = stop_times_copy.length - 1; j >= 0; j--) {
            if (trips[i].trip_id == stop_times_copy[j].trip_id) {
                trips[i].stop_times.push(stop_times_copy[j]);
                stop_times_copy[j].short_id = trips[i].short_id;
                stop_times_copy.slice(j, 1);
            }
        }
    }

    console.log(trips[0]);
}

function addStopTimestoStops(stop_times, stops) {
    if (LOG) {
        console.log("Adding Stop Times to Stops");
    }

    var stop_times_copy = [...stop_times];

    for (var i = 0; i < stops.length; i++) {
        stops[i].stop_times = [];
        for (var j = stop_times_copy.length - 1; j >= 0; j--) {
            if (stop_times_copy[j].stop_id == stops[i].stop_id) {
                stops[i].stop_times.push(stop_times_copy[j]);
                stop_times_copy.slice(j, 1);
            }
        }
        if (stops[i].stop_id == 5455) {
            console.log(stops[i]);
        }
    }
}

main();


