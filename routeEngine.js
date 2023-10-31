const fs = require('fs');
const LOG = true;  
const stops_exclude = ["stop_desc", "stop_url", "parent_station", "stop_code", "zone_id", "location_type", "stop_code"];
const stop_times_exclude = ["arrival_time", "stop_headsign", "pickup_type", "drop_off_type", "shape_dist_traveled"];
const trips_exclude = ["trip_short_name", "block_id", "wheelchair_accessible", "bikes_allowed"];
const routes_exclude = ["agency_id", "route_desc", "route_type", "route_url", "route_color", "route_text_color"];
const calendar_exclude = ["start_date", "end_date"];

routes_path = 'translink_data/routes.txt';
stops_path = 'translink_data/stops.txt';
trips_path = 'translink_data/trips.txt';
calendar_path = 'translink_data/calendar.txt';
stop_times_path = 'translink_data/stop_times.txt';


async function main() {
    var routes_path = 'generated/routes.json';
    var stops_path = 'generated/stops.json';
    var trips_path = 'generated/trips.json';
    var stop_times_path = 'generated/stop_times.json';
    if (fs.existsSync(stops_path) && fs.existsSync(routes_path) && fs.existsSync(trips_path) && fs.existsSync(stop_times_path)) {
        if (LOG) {
            console.log("Files exist");
        }
        var stops = await parseGeneratedFile(stops_path);
        var inRange = getAllStopsWithinRange(stops, 150, 49.11911765982382, -122.84566472658649);
        inRange.forEach(stop => {
            console.log(stop);
            console.log(stops.stop_name[stop]);
        })

    } else {
        if (LOG) {
            console.log("Files not found");
        }

        routes_path = 'translink_data/routes.txt';
        stops_path = 'translink_data/stops.txt';
        trips_path = 'translink_data/trips.txt';

        var calendar_dates_path = 'translink_data/calendar_dates.txt';
        var calendar_path = 'translink_data/calendar.txt';
        var directions_path = 'translink_data/directions.txt';
        var pattern_id_path = 'translink_data/pattern_id.txt';
        var shapes_path = 'translink_data/shapes.txt';
        var stop_order_exceptions_path = 'translink_data/stop_order_exceptions.txt';
        var stop_times_path = 'translink_data/stop_times.txt';
        var transfers_path = 'translink_data/transfers.txt';
        var trips_path = 'translink_data/trips.txt';

        var routes = await parseTranslinkFile(routes_path);
        // var calendar = parseTranslinkFile(calendar_path);
        // var calender_dates = parseTranslinkFile(calendar_dates_path);
        var directions = await parseTranslinkFile(directions_path);
        // var pattern_id = parseTranslinkFile(pattern_id_path);
        var shapes = await parseTranslinkFile(shapes_path);
        shapes = combineShapes(shapes);
        // var stop_order_exceptions = parseTranslinkFile(stop_order_exceptions_path);
        var stops = await parseTranslinkFile(stops_path);
        var stop_times = await parseTranslinkFile(stop_times_path);
        // var transfers = parseTranslinkFile(transfers_path);
        var trips = await parseTranslinkFile(trips_path);
        addShapesToTrips(shapes, trips);
        addDirectionsToTrips(directions, trips);
        addTripsToRoutes(trips, routes);
        addStopTimestoStops(stop_times, stops);
        addStopTimesToTrips(stop_times, trips);
        fs.writeFileSync('./stops.json', JSON.stringify(stops, null, 2) , 'utf-8');
        fs.writeFileSync('./trips.json', JSON.stringify(trips, null, 2) , 'utf-8');
        fs.writeFileSync('./routes.json', JSON.stringify(routes, null, 2) , 'utf-8');
        fs.writeFileSync('./stop_times.json', JSON.stringify(stop_times, null, 2) , 'utf-8');
        
        console.log(stops);
        for (keys in stops) {
            console.log(keys);
        }
    }
    
}

function parseGeneratedFile(path) {
    return new Promise(function(resolve, reject) {
        fs.readFile(path, 'utf8', (err, data) => {
            if (err) {
                reject(err);
            }

            if (LOG) {
                console.log("Parsing File: ", path);
            }
            resolve(JSON.parse(data));
        });
    });
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


            var output = new Object();
            var lines = data.split('\r\n');
    	    lines.pop();    // Get rid of the element that results from after the last newline
            var temp;
            var words;
            var titles = lines[0].split(',');
            var i;
            var j;
            var excludeIndex = [];
            var includeIndex = [];
            var excludeArray;

            switch(path) {
                case routes_path:
                    excludeArray = routes_exclude;
                    break;
                case trips_path:
                    excludeArray = trips_exclude;
                    break;
                case stops_path:
                    excludeArray = stops_exclude;
                    break;
                case stop_times_path:
                    excludeArray = stop_times_exclude;
                    break;
                case calendar_path:
                    excludeArray = calendar_exclude;
                    break;
                default:
                    excludeArray = [];
              } 

            for (i = 0; i < titles.length; i++) {
                if (excludeArray.includes(titles[i])) {
                    excludeIndex.push(i);
                } else {
                    includeIndex.push(i);
                }
            }
    
            for (i = 1; i < lines.length; i++) {
                words = lines[i].split(',');
                includeIndex.forEach(index => {
                    if (output[titles[index]] === undefined) {
                        output[titles[index]] = [];
                    }
                    output[titles[index]].push(words[index]);
                })
            }
            resolve(output);
        });
    });
}

function combineShapes(shapes) {
    if (LOG) {
        console.log("Combining Shapes");
    }

    
    var outputShapes = {
        shape_id: [],
        lat: [],
        long: [],
        dist: []
    };
    var tempPoint;
    var current_shape_id = undefined;
    var index = -1;
    for (var i = 0; i < shapes.shape_id.length; i++) {
        if (shapes.shape_id[i] !== current_shape_id) {
            index++;
            current_shape_id = shapes.shape_id[i];
            outputShapes.shape_id[index] = current_shape_id;
            outputShapes.lat[index] = [];
            outputShapes.long[index] = [];
            outputShapes.dist[index] = [];
        }

        outputShapes.lat[index][parseInt(shapes.shape_pt_sequence[i]) - 1] = shapes.shape_pt_lat[i]; 
        outputShapes.long[index][parseInt(shapes.shape_pt_sequence[i]) - 1] = shapes.shape_pt_lon[i]; 
        outputShapes.dist[index][parseInt(shapes.shape_pt_sequence[i]) - 1] = shapes.shape_dist_traveled[i]; 
    }
    return outputShapes;
}

function addShapesToTrips(shapes, trips) {
    if (LOG) {
        console.log("Adding Shapes to Trips");
    }
    trips.shape_index = [];
    for (var i = 0; i < trips.shape_id.length; i++) {
        for (var j = 0; j < shapes.shape_id.length; j++) {
            if (trips.shape_id[i] == shapes.shape_id[j]) {
                trips.shape_index[i] = j;
                break;
            }
        }
    }

}

function addDirectionsToTrips(directions, trips) {
    if (LOG) {
        console.log("Adding Directions to Trips");
    }

    trips.direction = [];

    for (var i = 0; i < trips.route_id.length; i++) {
        for (var j = 0; j < directions.route_id.length; j++) {
            if (trips.route_id[i] == directions.route_id[j] && trips.direction_id[i] == directions.direction_id[j]) {
                trips.direction[i] = directions.direction[j].charAt(0);
                break;
            }   
        }
    }
}

function addTripsToRoutes(trips, routes) {
    if (LOG) {
        console.log("Adding Trips to Routes");
    }

    routes.trip_indexes = [];

    for (var i = 0; i < routes.route_id.length; i++) {
        routes.trip_indexes[i] = [];
        for (var j = 0; j < trips.route_id.length; j++) {
            if (routes.route_id[i] == trips.route_id[j]) {
                routes.trip_indexes[i].push(j);
            }
        }
    }
}

// Holy **** this approach is too slow, maybe do stop centric instead of trip centric organization? Instead maybe only look up times if routes are okay?
function addStopTimesToTrips(stop_times, trips) {
    if (LOG) {
        console.log("Adding Stop Times to Trips");
    }

    trips.stop_times_indexes = [];
    stop_times.trips_index = [];
    for (var i = 0; i < trips.trip_id.length; i++) {
        trips.stop_times_index[i] = [];
    }

    for (var i = 0; i < stop_times.trip_id.length; i++) {
        for (var j = 0; j < trips.trip_id.length; j++) {
            if (stop_times.trip_id[i] == trips.trip_id[j]) {
                trips.stop_times_indexes[j].push(i);
                stop_times.trips_index[i] = j;
                break;
            }
        }
    }
}

function addStopTimestoStops(stop_times, stops) {
    if (LOG) {
        console.log("Adding Stop Times to Stops");
    }
    stops.stop_times_index = [];

    for (var i = 0; i < stops.stop_id.length; i++) {
        stops.stop_times_index[i] = [];
        for (var j = 0; j < stop_times.stop_id.length; j++) {
            if (stops.stop_id[i] == stop_times.stop_id[j]) {
                stops.stop_times_index[i].push(j);
            }
        }
    }
}

function getAllStopsWithinRange(stops, range, lat, long) {
    var inRange = [];
    var xRange =  range / 111320;
    var yRange = 360 * range / (40075000 * Math.cos(lat));
    var xMax = long + xRange;
    var xMin = long - xRange;
    var yMax = lat + yRange;
    var yMin = lat - yRange;

    for (var i = 0; i < stops.stop_id.length; i++) {
        if (xMin < stops.stop_lon[i] && stops.stop_lon[i] < xMax
            && yMin < stops.stop_lat[i] && stops.stop_lat[i] < yMax) {
                inRange.push(i);
            }
    }
    return inRange;
}

main();


