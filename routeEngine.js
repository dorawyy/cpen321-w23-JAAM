const fs = require('fs');
const { parse } = require('path');
const LOG = true;  
const stops_exclude = ["stop_desc", "stop_url", "parent_station", "stop_code", "zone_id", "location_type", "stop_code"];
const stop_times_exclude = ["arrival_time", "stop_headsign", "pickup_type", "drop_off_type", "shape_dist_traveled"];
const trips_exclude = ["route_id", "direction_id", "shape_id", "trip_short_name", "block_id", "wheelchair_accessible", "bikes_allowed"];
const routes_exclude = ["agency_id", "route_desc", "route_type", "route_url", "route_color", "route_text_color"];
const calendar_exclude = ["start_date", "end_date"];
const scan_range = 500;

routes_path = 'translink_data/routes.txt';
stops_path = 'translink_data/stops.txt';
trips_path = 'translink_data/trips.txt';
calendar_path = 'translink_data/calendar.txt';
stop_times_path = 'translink_data/stop_times.txt';


async function main() {
    var stops_path = 'generated/stops.json';
    var trips_path = 'generated/trips.json';
    if (fs.existsSync(stops_path) && fs.existsSync(routes_path)) {
        if (LOG) {
            console.log("Files exist");
        }
        var stops = await parseGeneratedFile(stops_path);
        var trips = await parseGeneratedFile(trips_path);

        // console.log("STOPS")
        // for (key in stops) {
        //     console.log(key);
        // }
        // console.log("TRIPS")
        // for (key in trips) {
        //     console.log(key);
        // }
        console.log(getRoute(49.26313584113501, -123.09943323064994, 49.26758980644602, -123.24734654048626, "10:00:00", stops, trips));
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
        var stop_times_path = 'translink_data/stop_times.txt';
        var trips_path = 'translink_data/trips.txt';
        var stops = await parseTranslinkFile(stops_path);
        var stop_times = await parseTranslinkFile(stop_times_path);
        var trips = await parseTranslinkFile(trips_path);
        addStopTimesToTrips(stop_times, trips);
        addTripsToStops(trips, stops);
        fs.writeFileSync('generated/stops.json', JSON.stringify(stops, null, 2) , 'utf-8');
        fs.writeFileSync('generated/trips.json', JSON.stringify(trips, null, 2) , 'utf-8');
        
        // console.log(trips);
        // for (keys in trips) {
        //     console.log(keys);
        // }
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

function addTripsToStops(trips, stops) {
    stops.trips = [];
    stops.trip_pos = [];
    stops.id = stops.stop_id;
    stops.stop_id = undefined;
    stops.lat = stops.stop_lat;
    stops.stop_lat = undefined;
    stops.lon = stops.stop_lon;
    stops.stop_lon = undefined;

    for (var i = 0; i < stops.id.length; i++) {
        stops.trips[i] = [];
        stops.trip_pos[i] = [];
    }

    for (var i = 0; i < trips.stops.length; i++) {
        for (var j = 0; j < trips.stops[i].length; j++) {
            for (var k = 0; k < stops.id.length; k++) {
                if (trips.stops[i][j] == stops.id[k]) {
                    trips.stops[i][j] = k;
                    stops.trips[k].push(i);
                    stops.trip_pos[k].push(j);
                    break;
                }
            }
        }
    }

}

function addStopTimesToTrips(stop_times, trips) {
    if (LOG) {
        console.log("Adding Stop Times to Trips");
    }
    trips.name = trips.trip_headsign;
    trips.trip_headsign = undefined;
    trips.id = trips.trip_id;
    trips.trip_id = undefined;


    trips.stop_times = [];
    trips.stops = [];
    
    for (var i = 0; i < trips.id.length; i++) {
        trips.stop_times[i] = [];
        trips.stops[i] = [];
    }

    for (var i = 0; i < stop_times.trip_id.length; i++) {
        for (var j = 0; j < trips.id.length; j++) {
            if (stop_times.trip_id[i] == trips.id[j]) {
                trips.stop_times[j][stop_times.stop_sequence[i]-1] = convert24HrToSeconds(stop_times.departure_time[i]);
                trips.stops[j][stop_times.stop_sequence[i]-1] = stop_times.stop_id[i];
                break;
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

    for (var i = 0; i < stops.id.length; i++) {
        if (parseFloat(stops.lon[i]) > xMin && parseFloat(stops.lon[i]) < xMax
            && parseFloat(stops.lat[i])> yMin && parseFloat(stops.lat[i]) < yMax) {
                inRange.add(i);
            }
        }
    return inRange;
}

function findStopsNearStop(stops, range, stop_index) {
    return getAllStopsWithinRange(stops, scan_range, stops.lat[stop_index], stops.lon[stop_index]);
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

function getTripsBefore(stops, trips, stop_index, time) {
    var trips_before = new Set();
    var trip_index;
    for (var i = 0; i < stops.trips[stop_index].length; i++) {
        trip_index = stops.trips[stop_index][i];
        trip_pos = stops.trip_pos[stop_index][i];
        diff = time - trips.stop_times[trip_index][trip_pos];
        if (diff > 0 && diff < 1800) {
            trips_before.add(trip_index);
        }
    }
    return trips_before;
}

function getStopsBefore(stops, trips, stop_index, time, reached, previous_trips) {
    var stops_before = new Set();
    var trip_index;
    var trip_pos;
    var diff;
    var old_reached = new Set(reached);
    for (var i = 0; i < stops.trips[stop_index].length; i++) {
        trip_index = stops.trips[stop_index][i];
        if (!old_reached.has(trips.stops[trip_index])) {
            trip_pos = stops.trip_pos[stop_index][i];
            diff = time - trips.stop_times[trip_index][trip_pos];
            if (diff > 0 && diff < 1800) {
                for (var j = 0; j < trip_pos; j++) {
                    stops_before.add([trips.stops[trip_index][j], trips.stop_times[trip_index][j]]);
                    reached.add(trips.stops[trip_index][j]);
                }
            }
        }
    }

    return stops_before;
}

function convertSecondsTo24Hour(time) {
    var date = new Date(null);
    date.setSeconds(time);
    return date.toISOString();
}


function getRoute(startLat, startLon, endLat, endLon, endTime, stops, trips) {
    endTime = convert24HrToSeconds(endTime);
    var startStops = new Set();
    var endStops = [];

    var range = 200;
    while (startStops.size == 0) {
        startStops = getAllStopsWithinRange(stops, range, startLat, startLon);
        range *= 1.5;
    }

    while (endStops.length == 0) {
        endStops = Array.from(getAllStopsWithinRange(stops, range, endLat, endLon));
        range *= 1.5;
    }
    var paths = [];
    var reached = new Set();
    
    for (var i = 0; i < endStops.length; i++) {
        paths[i] = [];
        paths[i].push([endStops[i], endTime]);
        reached.add(endStops[i]);
    }

    var found = false;
    var start;
    while (!found) {
        var temp = [];
        for (var i = 0; i < paths.length; i++) {
            getStopsBefore(stops, trips, paths[i][0][0], paths[i][0][1], reached).forEach(new_stop => {
                temp.push([new_stop, ...paths[i]]);
            });
        }

        for (var i = 0; i < paths.length; i++) {
            findStopsNearStop(stops, 500, paths[i][0][0]).forEach(new_stop => {
                if (!reached.has(new_stop)) {
                    temp.push([[new_stop, paths[i][0][1]-300], ...paths[i]]);
                    reached.add(new_stop);
                }
                temp.push([new_stop, ...paths[i]]);
            });
        }
        paths = temp;

        startStops.forEach(stop => {
            if (reached.has(stop)) {
                found = true;
                start = stop;
            }
        })
    }

    var latestTime = -1;
    var latestTimeIndex;
    for (var i = 0; i < paths.length; i++) {
        if (paths[i][0][0] == start) {
            if (paths[i][0][1] > latestTime) {
                latestTime = paths[i][0][1];
                latestTimeIndex = i;
            }
        }
    }

    console.log(paths[latestTimeIndex]);
    paths[latestTimeIndex].forEach(stop => {
        console.log(stops.stop_name[stop[0]]);
        console.log(convertSecondsTo24Hour(stop[1]));
    })



    return paths[latestTimeIndex];




    // path = getPathBetweenStops(stops, routes, startStops[0], endStops[0], startTime, trips, stop_times);
    // console.log(path);

    // for (var i = 0; i < path.length; i++) {
    //     console.log(stops.stop_name[path[i]]);

    // }


    // for (var i = 1; i < path.length; i++) {
    //     console.log(routes.route_long_name[commonRouteBetweenStops(stops, routes, path[i-1], path[i])]);

    // }



    // path.forEach(stop => console.log(stop));

    // Find next time after start time
    // Find end time for that trip
}

main();


 