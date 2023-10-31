const fs = require('fs');
const { parse } = require('path');
const LOG = true;  
const stops_exclude = ["stop_desc", "stop_url", "parent_station", "stop_code", "zone_id", "location_type", "stop_code"];
const stop_times_exclude = ["arrival_time", "stop_headsign", "pickup_type", "drop_off_type", "shape_dist_traveled"];
const trips_exclude = ["trip_short_name", "block_id", "wheelchair_accessible", "bikes_allowed"];
const routes_exclude = ["agency_id", "route_desc", "route_type", "route_url", "route_color", "route_text_color"];
const calendar_exclude = ["start_date", "end_date"];
const scan_range = 500;

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
        var routes = await parseGeneratedFile(routes_path);
        var stop_times = await parseGeneratedFile(stop_times_path);
        var trips = await parseGeneratedFile(trips_path);
        for (var i = 0; i < routes.route_id.length; i++) {
            routes.stop_id_set[i] = new Set(routes.stop_id_set[i]);
            // if (routes.route_short_name[i] == "321") {
            //     console.log("Stops: ", routes.stop_id_set[i]);
            //     break;
            // }
        }
        for (var i = 0; i < stops.route_set.length; i++) {
            stops.route_set[i] = new Set(stops.route_set[i]);
        }

        console.log(getRoute(49.1118986, -122.84032176, 49.13400639947651, -122.8791423478073, "08:00:00", stops, routes, trips, stop_times));
        // console.log(routes);
        //var inRange = getAllStopsWithinRange(stops, 150, 49.11911765982382, -122.84566472658649);
        //inRange.forEach(stop => {
         //   console.log(stop);
          //      console.log(stops.stop_name[stop]);
        //   })

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
        addStopTimesToTrips(stop_times, trips);
        addStopTimestoStops(stop_times, stops);
        addRoutestoStops(routes, stops, trips);
        fs.writeFileSync('generated/stops.json', JSON.stringify(stops, null, 2) , 'utf-8');
        fs.writeFileSync('generated/trips.json', JSON.stringify(trips, null, 2) , 'utf-8');
        fs.writeFileSync('generated/routes.json', JSON.stringify(routes, null, 2) , 'utf-8');
        fs.writeFileSync('generated/stop_times.json', JSON.stringify(stop_times, null, 2) , 'utf-8');
        
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
                    excludeIndex.push(i.valueOf());
                } else {
                    includeIndex.push(i.valueOf());
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
                routes.trip_indexes[i].push(j.valueOf());
            }
        }
    }
}

// Holy **** this approach is too slow, maybe do stop centric instead of trip centric organization? Instead maybe only look up times if routes are okay?
function addStopTimesToTrips(stop_times, trips) {
    if (LOG) {
        console.log("Adding Stop Times to Trips");
    }

    trips.stop_times_index = [];
    trips.stop_id = [];
    stop_times.trip_index = [];
    for (var i = 0; i < trips.trip_id.length; i++) {
        trips.stop_times_index[i] = [];
        // trips.stop_id[i] = [];
    }

    for (var i = 0; i < stop_times.trip_id.length; i++) {
        for (var j = 0; j < trips.trip_id.length; j++) {
            if (stop_times.trip_id[i] == trips.trip_id[j]) {
                trips.stop_times_index[j].push(i.valueOf());
                stop_times.trip_index[i] = j;
                if (!trips.stop_id[j].includes(stop_times.stop_id[i])) {
                    trips.stop_id[j].push(stop_times.stop_id[i]);
                }
                break;
            }
        }
    }
}

function addRoutestoStops(routes, stops, trips) {
    if (LOG) {
        console.log("Adding Routes to Stops (and vice versa)");
    }

    if (LOG) {
        console.log("Using Trips as an inbetween");
    }
    
    stops.route_index = [];
    stops.route_set = [];
    routes.stop_index = [];
    routes.stop_id_set = []
    for (var i = 0; i < routes.route_id.length; i++) {
        routes.stop_index[i] = [];
        routes.stop_id_set[i] = new Set();
    }


    for (var i = 0; i < stops.trip_index.length; i++) {
        stops.route_set[i] = new Set();
        for (var j = 0; j < stops.trip_index[i].length; j++) {
            stops.route_set[i].add(trips.route_id[stops.trip_index[i][j]]);
        }
        stops.route_index[i] = [];
        for (var j = 0; j < routes.route_id.length; j++) {
            if (stops.route_set[i].has(routes.route_id[j])) {
                routes.stop_index[j].push(i.valueOf());
                routes.stop_id_set[j].add(stops.stop_id[i]);
                stops.route_index[i].push(j.valueOf());
            }
        }
        stops.route_set[i] = Array.from(stops.route_set[i]);
    }
    
  for (var i = 0; i < routes.stop_id_set.length; i++) {
    routes.stop_id_set[i] = Array.from(routes.stop_id_set[i]);
  }
}

function addStopTimestoStops(stop_times, stops) {
    if (LOG) {
        console.log("Adding Stop Times to Stops");
    }
    stops.stop_times_index = [];
    stops.trip_index = [];

    for (var i = 0; i < stops.stop_id.length; i++) {
        stops.stop_times_index[i] = [];
        stops.trip_index[i] = [];
        for (var j = 0; j < stop_times.stop_id.length; j++) {
            if (stops.stop_id[i] == stop_times.stop_id[j]) {
                stops.stop_times_index[i].push(j.valueOf());
                stops.trip_index[i].push(stop_times.trip_index[j]);
            }
        }
    }
}

function getAllStopsWithinRange(stops, range, lat, long) {
    var inRange = new Set();
    var xRange =  range / 111320;
    var yRange = 360 * range / (40075000 * Math.cos(lat));
    var xMax = long + xRange;
    var xMin = long - xRange;
    var yMax = lat + yRange;
    var yMin = lat - yRange;

    for (var i = 0; i < stops.stop_id.length; i++) {
        if (parseFloat(stops.stop_lon[i]) > xMin && parseFloat(stops.stop_lon[i]) < xMax
            && parseFloat(stops.stop_lat[i])> yMin && parseFloat(stops.stop_lat[i]) < yMax) {
                inRange.add(i.valueOf());
            }
        }
    return inRange;
}

function findStopsNearStop(stops, range, stop) {
    return getAllStopsWithinRange(stops, scan_range, stops.stop_lat[stop], stops.stop_lon[stop]);
}

function getStopsOfRoute(routes, route) {
    return routes.stop_index[route];
}

function getRoutesOfStops(stops, stop) {
    return stops.route_index[stop];
}

function getStopsAccesibleSoon(stops, stop_times, stop, time) {
    var accesible_stops = new Set();
    var base_time = convert24HrToSeconds(time);
    for (var i = 0; i < stops.stop_times_index[stop].length; i++) {
        temp_time = convert24HrToSeconds(stop_times.departure_time[stops.stop_times_index[stop][i]]);
        if (temp_time - base_time < 3600 && temp_time - base_time > 0) {
            var currentStop = stop_times.stop_sequence[stops.stop_times_index[stop][i]];
            var currentTrip = stop_times.trip_index[stops.stop_times_index[stop][i]];
            var index = 1;

            while (stop_times.trip_index[stops.stop_times_index[stop][i] + index] == currentTrip) {
                if (stop_times.stop_sequence[stops.stop_times_index[stop][i] + index] > currentStop) {
                    accesible_stops.add(stop_times.stop_id[stops.stop_times_index[stop][i] + index]);
                    index++;
                }
            }
        }
    }
    return getIndexesFromStopIds(stops, accesible_stops);
}

function getIndexesFromStopIds(stops, stop_ids) {
    stop_indexes = new Set();
    stop_ids.forEach(id => {
        stop_indexes.add(stops.stop_id.indexOf(id));
    })
    return stop_indexes;
}

function convert24HrToSeconds(time) {
    var times = time.split(":");
    return (+times[2]) + 60*(+times[1]) + 3600*(+times[0]);
}

function commonRouteBetweenStops(stops, routes, stop1, stop2) {
    for (var i = 0; i < stops.route_index[stop1].length; i++) {
        for (var j = 0; j < stops.route_index[stop2].length; j++) {
            if (stops.route_index[stop1][i] == stops.route_index[stop2][j]) {
                return stops.route_index[stop1][i];
            }
        }
    }
}

function findAllNewReachableStopsWithoutTransfer(stops, routes, trips, stop_times, time, stop, alrReached) {
    var possibleStops = new Set();
        getStopsAccesibleSoon(stops, stop_times, stop, time).forEach(stop_temp => {
            if (!alrReached.has(stop_temp)) {
                possibleStops.add(stop_temp);
                alrReached.add(stop_temp);
            }
        });
    
    possibleStops.forEach(stop_temp => {
        findStopsNearStop(stops, scan_range, stop_temp).forEach(stop_temp2 => {
            if (!alrReached.has(stop_temp2)) {
                possibleStops.add(stop_temp2);
                alrReached.add(stop_temp);
            }
        });
    });

    return possibleStops;
}

function findIntersectionSet(set1, set2) {
    var common;
    set1.forEach(element1 => {
        set2.forEach(element2 => {
            if (element2 == element1) {
                common = element1;
            }
        })
    });
    return common;
}

function findIntersectionArray(arr1, arr2) {
    for (var i = 0; i < arr1.length; i++) {
        for (var j = 0; j < arr2.length; j++) {
            if (arr1[i] == arr2[j]) {
                return arr1[i];
            }
        }
    }
}

function joinPath(start_path, end_path, intersection) {
    var output = [];
    for (i = 0; i < start_path.length; i++) {
        output.push(start_path[i]);
        if (start_path[i] == intersection) {
            break;
        }
    }
    var found = false;
    for (i = 0; i < end_path.length; i++) {
        if (found) {
            output.push(end_path[i]);
        }
        if (end_path[i] == intersection) {
            found = true;
        }
    }
    return output;


}

function getPathBetweenStops(stops, routes, stop1, stop2, time, trips, stop_times) {
    var commonRoute = commonRouteBetweenStops(stops, routes, stop1, stop2);
    if (commonRoute != undefined) {
        return [stop1,
                stop2];
    }

    var reached_start = new Set([stop1]);
    var reached_end = new Set([stop2]);
    var start_paths = new Set();
    var end_paths = new Set();
    start_paths.add([stop1]);
    end_paths.add([stop2]);
    var intersection = findIntersectionSet(reached_start, reached_end);
    
    while (intersection === undefined) {
        var start_paths_temp = new Set();
        start_paths.forEach(start_path => {
            findAllNewReachableStopsWithoutTransfer(stops, routes, trips, stop_times, time, start_path[start_path.length-1], reached_start).forEach(new_stop => {
                start_paths_temp.add([...start_path, new_stop]);
            });
        });
        start_paths = start_paths_temp;

        var end_paths_temp = new Set();
        end_paths.forEach(end_path => {
            findAllNewReachableStopsWithoutTransfer(stops, routes, trips, stop_times, time, end_path[0], reached_end).forEach(new_stop => {
                end_paths_temp.add([new_stop, ...end_path]);
            });
        });
        end_paths = end_paths_temp;

        intersection = findIntersectionSet(reached_start, reached_end);
    }

    // Intersection has been found
    var valid_starts = [];
    var valid_ends = [];
    start_paths.forEach(path => {
        if (path.includes(intersection)) {
            valid_starts.push(path);
        }
    });
    end_paths.forEach(path => {
        if (path.includes(intersection)) {
            valid_ends.push(path);
        }
    });
    var valid_start;
    var valid_end;
    // Find earliest intersection
    for (var i = 0; i < valid_starts[0].length; i++) {
        if (valid_start != undefined) {
            break;
        }
        for (var j = 0; j < valid_starts.length; j++) {
            if (valid_starts[j][i] == intersection) {
                valid_start = valid_starts[j];
                break;
            }
        }
    }

    // Find latest intersection
    for (var i = 0; i < valid_ends[0].length; i++) {
        if (valid_end != undefined) {
            break;
        }
        for (var j = 0; j < valid_ends.length; j++) {
            if (valid_ends[j][i] == intersection) {
                valid_end = valid_ends[j];
                break;
            }
        }
    }

    
    var path = joinPath(valid_start, valid_end, intersection);
    return path;
}


function getRoute(startLat, startLon, endLat, endLon, startTime, stops, routes, trips, stop_times) {
    var startStops = new Set();
    var endStops = new Set();

    var range = 50;
    while (startStops.size == 0) {
        startStops = getAllStopsWithinRange(stops, range, startLat, startLon);
        range *= 1.5;
    }

    while (endStops.size == 0) {
        endStops = getAllStopsWithinRange(stops, range, endLat, endLon);
        range *= 1.5;
    }
    var commonStop;
    var path = [];

    startStops = Array.from(startStops);
    endStops = Array.from(endStops);

    path = getPathBetweenStops(stops, routes, startStops[0], endStops[0], startTime, trips, stop_times);
    console.log(path);

    for (var i = 0; i < path.length; i++) {
        console.log(stops.stop_name[path[i]]);

    }


    for (var i = 1; i < path.length; i++) {
        console.log(routes.route_long_name[commonRouteBetweenStops(stops, routes, path[i-1], path[i])]);

    }



    // path.forEach(stop => console.log(stop));

    // Find next time after start time
    // Find end time for that trip
}

main();


