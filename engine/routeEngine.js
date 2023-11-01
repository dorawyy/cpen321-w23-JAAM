const fs = require('fs');
const {parse} = require('path');
const LOG = true;  
const stops_exclude = ["stop_desc", "stop_url", "parent_station", "stop_code", "zone_id", "location_type", "stop_code"];
const stop_times_exclude = ["arrival_time", "stop_headsign", "pickup_type", "drop_off_type", "shape_dist_traveled"];
const trips_exclude = ["route_id", "direction_id", "shape_id", "trip_short_name", "block_id", "wheelchair_accessible", "bikes_allowed"];
const routes_exclude = ["agency_id", "route_desc", "route_type", "route_url", "route_color", "route_text_color"];
const calendar_exclude = ["start_date", "end_date"];
const scan_range = 500;

var routes_path = 'engine/translink_data/routes.txt';
var stops_path = 'engine/translink_data/stops.txt';
var trips_path = 'engine/translink_data/trips.txt';
var calendar_path = 'engine/translink_data/calendar.txt';
var stop_times_path = 'engine/translink_data/stop_times.txt';
var stops;
var trips;


async function init() {
    if (fs.existsSync(stops_path) && fs.existsSync(routes_path)) {
        if (LOG) {
            console.log("Files exist");
        }
    } else {
        if (LOG) {
            console.log("Files not found");
        }

        // routes_path = 'translink_data/routes.txt';
        // stops_path = 'translink_data/stops.txt';
        // trips_path = 'translink_data/trips.txt';
        // var stop_times_path = 'translink_data/stop_times.txt';
        // var trips_path = 'translink_data/trips.txt';
        stops = await parseTranslinkFile(stops_path);
        // stop_times = await parseTranslinkFile(stop_times_path);
        trips = await parseTranslinkFile(trips_path);
        addStopTimesToTrips(stop_times, trips);
        addTripsToStops(trips, stops);
        fs.writeFileSync('generated/stops.json', JSON.stringify(stops, null, 2) , 'utf-8');
        fs.writeFileSync('generated/trips.json', JSON.stringify(trips, null, 2) , 'utf-8');
    }
    
    stops_path = 'generated/stops.json';
    trips_path = 'generated/trips.json';
    stops = await parseGeneratedFile(stops_path);
    trips = await parseGeneratedFile(trips_path);
    console.log("Setup Complete");
    return true;
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


function convert24HrToSeconds(time) {
    var times = time.split(":");
    return (+times[2]) + 60*(+times[1]) + 3600*(+times[0]);
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
                    stops_before.add([trips.stops[trip_index][j], trips.stop_times[trip_index][j], trips.name[trip_index]]);
                    reached.add(trips.stops[trip_index][j]);
                }
            }
        }
    }

    return stops_before;
}

function convertSecondsTo24Hour(time) {
    console.log(time);
    var date = new Date(null);
    date.setSeconds(time);
    
    return date.toISOString().substring(11, 19);
}


function getRoute(startLat, startLon, endLat, endLon, endTime) {
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
        paths[i].push([endStops[i], endTime, "End"]);
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
                    temp.push([[new_stop, paths[i][0][1]-300, "Walk"], ...paths[i]]);
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

    response = [];
    for (var i = 1; i < paths[latestTimeIndex].length; i++) {
        responseObj = new Object();
        responseObj['Start'] = new Object();
        responseObj['Start']['Stop'] = stops.stop_name[paths[latestTimeIndex][i-1][0]];
        responseObj['Start']['Lat'] = stops.lat[paths[latestTimeIndex][i-1][0]];
        responseObj['Start']['Long'] = stops.lon[paths[latestTimeIndex][i-1][0]];
        responseObj['Start']['Time'] = convertSecondsTo24Hour(paths[latestTimeIndex][i-1][1]);
        responseObj['Start']['Bus'] = paths[latestTimeIndex][i-1][2];
        responseObj['End'] = new Object();
        responseObj['End']['Stop'] = stops.stop_name[paths[latestTimeIndex][i][0]];
        responseObj['End']['Lat'] = stops.lat[paths[latestTimeIndex][i][0]];
        responseObj['End']['Long'] = stops.lon[paths[latestTimeIndex][i][0]];
        responseObj['End']['Time'] = null;
        responseObj['End']['Bus'] = paths[latestTimeIndex][i-1][2];
        response.push(responseObj);
    }


    return response;
    



    return paths[latestTimeIndex];
}