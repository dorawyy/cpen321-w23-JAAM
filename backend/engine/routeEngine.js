const fs = require('fs');
const LOG = true;  
const stops_exclude = ["stop_desc", "stop_url", "parent_station", "stop_code", "zone_id", "location_type", "stop_code"];
const stop_times_exclude = ["arrival_time", "stop_headsign", "pickup_type", "drop_off_type", "shape_dist_traveled"];
const trips_exclude = ["route_id", "direction_id", "shape_id", "trip_short_name", "block_id", "wheelchair_accessible", "bikes_allowed"];
// const routes_exclude = ["agency_id", "route_desc", "route_type", "route_url", "route_color", "route_text_color"];
// const calendar_exclude = ["start_date", "end_date"];
const scan_range = 500;
const lat_calc_constant = 360 / (4.0075 * 10^7);

const stop_times_path = './engine/translink_data/stop_times.txt';
const stops_path = './engine/translink_data/stops.json';
const trips_path = './engine/translink_data/trips.json';

const generated_stops_path = './engine/generated/stops.json';
const generated_trips_path = './engine/generated/trips.json';

var stops;
var trips;
// var routes_path = './engine/translink_data/routes.txt';
// var calendar_path = './engine/translink_data/calendar.txt';

// ChatGPT Usage: PARTIAL
async function init() {
    if (fs.existsSync(generated_stops_path) && fs.existsSync(generated_trips_path)) {
        if (LOG) {
            console.log("Files exist");
        }
    } else {
        if (LOG) {
            console.log("Files not found");
        }


        stops = await parseTranslinkFile(stops_path);
        var stop_times = await parseTranslinkFile(stop_times_path);
        trips = await parseTranslinkFile(trips_path);

        addStopTimesToTrips(stop_times, trips);
        addTripsToStops(trips, stops);

        fs.writeFileSync(generated_stops_path, JSON.stringify(stops, null, 2) , 'utf-8');
        fs.writeFileSync(generated_trips_path, JSON.stringify(trips, null, 2) , 'utf-8');
    }
    
    
    stops = await parseGeneratedFile(generated_stops_path);
    trips = await parseGeneratedFile(generated_trips_path);
    console.log("Setup Complete");
    return true;
}
// ChatGPT Usage: NO
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

// ChatGPT Usage: NO
function parseTranslinkFile(path)  {
    return new Promise(function(resolve, reject) {
        fs.readFile(path, 'utf8', (err, data) => {
            if (err) {
                reject(err);
            }

            if (LOG) {
                console.log("Parsing File: ", path);
            }


            var output = {};
            var lines = data.split('\r\n');
            lines.pop();    // Get rid of the element that results from after the last newline
            var words;
            var titles = lines[0].split(',');
            var i;
            var excludeIndex = [];
            var includeIndex = [];
            var excludeArray;

            switch(path) {
                // case routes_path:
                //     excludeArray = routes_exclude;
                //     break;
                case trips_path:
                    excludeArray = trips_exclude;
                    break;
                case stops_path:
                    excludeArray = stops_exclude;
                    break;
                case stop_times_path:
                    excludeArray = stop_times_exclude;
                    break;
                // case calendar_path:
                //     excludeArray = calendar_exclude;
                //     break;
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

// ChatGPT Usage: NO
function addTripsToStops(trips, stops) {
    stops.trips = [];
    stops.trip_pos = [];
    stops.id = stops.stop_id;
    stops.stop_id = undefined;
    stops.lat = stops.stop_lat;
    stops.stop_lat = undefined;
    stops.lon = stops.stop_lon;
    stops.stop_lon = undefined;
    var i;
    for (i = 0; i < stops.id.length; i++) {
        stops.trips[i] = [];
        stops.trip_pos[i] = [];
    }

    for (i = 0; i < trips.stops.length; i++) {
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

// ChatGPT Usage: NO 
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
    var i;
    for (i = 0; i < trips.id.length; i++) {
        trips.stop_times[i] = [];
        trips.stops[i] = [];
    }

    for (i = 0; i < stop_times.trip_id.length; i++) {
        for (var j = 0; j < trips.id.length; j++) {
            if (stop_times.trip_id[i] == trips.id[j]) {
                trips.stop_times[j][stop_times.stop_sequence[i]-1] = convert24HrToSeconds(stop_times.departure_time[i]);
                trips.stops[j][stop_times.stop_sequence[i]-1] = stop_times.stop_id[i];
                break;
            }
        }
    }
}

// ChatGPT Usage: PARTIAL
function getAllStopsWithinRange(stops, range, lat, long) {
    var inRange = new Set();
    var xRange =  range / 111320;
    var yRange = lat_calc_constant * range / (Math.cos(lat));
    var xMax = long + xRange;
    var xMin = long - xRange;
    var yMax = lat + yRange;
    var yMin = lat - yRange;
    var i;
    for (i = 0; i < stops.id.length; i++) {
        if (parseFloat(stops.lon[i]) > xMin && parseFloat(stops.lon[i]) < xMax
            && parseFloat(stops.lat[i])> yMin && parseFloat(stops.lat[i]) < yMax) {
                inRange.add(i);
            }
        }
    return inRange;
}

// ChatGPT Usage: NO
function findStopsNearStop(stops, range, stop_index) {
    return getAllStopsWithinRange(stops, scan_range, stops.lat[stop_index], stops.lon[stop_index]);
}

// ChatGPT Usage: YES
function convert24HrToSeconds(time) {
    var times = time.split(":");
    return (+times[2]) + 60*(+times[1]) + 3600*(+times[0]);
}

// ChatGPT Usage: PARTIAL
function getStopsBefore(stops, trips, stop_index, time, old_reached, reached, previous_trips) {
    var stops_before = new Set();
    var trip_index;
    var trip_pos;
    var diff;
    var i;
    for (i = 0; i < stops.trips[stop_index].length; i++) {
        trip_index = stops.trips[stop_index][i];
        if (!previous_trips.has(trip_index)) {
            previous_trips.add(trip_index);
            trip_pos = stops.trip_pos[stop_index][i];
            diff = time - trips.stop_times[trip_index][trip_pos];
            if (diff > 0 && diff < 1800) {
                for (var j = 0; j < trip_pos; j++) {
                    if (!old_reached.has(trips.stops[trip_index][j])) {
                        stops_before.add([trips.stops[trip_index][j], trips.stop_times[trip_index][j], trips.name[trip_index], trips.stop_times[trip_index][trip_pos]]);
                        reached.add(trips.stops[trip_index][j]);
                    }
                }
            }
        }
    }
    

    return stops_before;
}

// ChatGPT Usage: PARTIAL
function convertSecondsTo24Hour(time) {
    var date = new Date(null);
    date.setSeconds(time);
    
    return date.toISOString().substring(11, 19);
}

// ChatGPT Usage: NONE
function getRoute(startLat, startLon, endLat, endLon, endTime) {
    endTime = convert24HrToSeconds(endTime);
    var startStops = new Set();
    var endStops = [];

    var range = 200;
    while (startStops.size === 0) {
        startStops = getAllStopsWithinRange(stops, range, startLat, startLon);
        range *= 1.5;
    }

    while (endStops.length === 0) {
        endStops = Array.from(getAllStopsWithinRange(stops, range, endLat, endLon));
        range *= 1.5;
    }
    var paths = [];
    var reached = new Set();
    var trips_alr_indexed = new Set();
    
    var i;
    for (i = 0; i < endStops.length; i++) {
        paths[i] = [];
        paths[i].push([endStops[i], endTime, "End"]);
        reached.add(endStops[i]);
    }

    var found = false;
    var start;
    while (!found) {
        var temp = [];
        var reached_count = reached.size;
        var old_reached = new Set(reached);
        for (i = 0; i < paths.length; i++) {
            getStopsBefore(stops, trips, paths[i][0][0], paths[i][0][1], old_reached, reached, trips_alr_indexed).forEach(new_stop => {
                temp.push([new_stop, ...paths[i]]);
            });
        }

        for (i = 0; i < paths.length; i++) {
            findStopsNearStop(stops, 500, paths[i][0][0]).forEach(new_stop => {
                if (!old_reached.has(new_stop)) {
                    temp.push([[new_stop, paths[i][0][1]-300, "Walk", paths[i][0][1]], ...paths[i]]);
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
        });
         if (reached.size - reached_count < 20) {
            break;
        }
    }

    var response = [];
    if (!found) {
        response.push("Could not find Route");
        return response;
    }

    var latestTime = -1;
    var latestTimeIndex;
    for (i = 0; i < paths.length; i++) {
        if (paths[i][0][0] == start) {
            if (paths[i][0][1] > latestTime) {
                latestTime = paths[i][0][1];
                latestTimeIndex = i;
            }
        }
    }

    var responseObj;
    for (i = 1; i < paths[latestTimeIndex].length; i++) {
        responseObj = {};
        responseObj['Start'] = {};
        responseObj['Start']['Stop'] = stops.stop_name[paths[latestTimeIndex][i-1][0]];
        responseObj['Start']['Lat'] = stops.lat[paths[latestTimeIndex][i-1][0]];
        responseObj['Start']['Long'] = stops.lon[paths[latestTimeIndex][i-1][0]];
        responseObj['Start']['Time'] = convertSecondsTo24Hour(paths[latestTimeIndex][i-1][1]);
        responseObj['Start']['Bus'] = paths[latestTimeIndex][i-1][2];
        responseObj['End'] = {};
        responseObj['End']['Stop'] = stops.stop_name[paths[latestTimeIndex][i][0]];
        responseObj['End']['Lat'] = stops.lat[paths[latestTimeIndex][i][0]];
        responseObj['End']['Long'] = stops.lon[paths[latestTimeIndex][i][0]];
        responseObj['End']['Time'] = convertSecondsTo24Hour(paths[latestTimeIndex][i-1][3]);
        responseObj['End']['Bus'] = paths[latestTimeIndex][i-1][2];
        response.push(responseObj);
    }


    return response;
}

// ChatGPT Usage: PARTIAL
function getPartnerRoute(startLat1, startLon1, startLat2, startLon2, endLat, endLon, endTime) {
    var midLat = (startLat1 + startLat2 + endLat) / 3;
    var midLon = (startLon1 + startLon2 + endLon) / 3;

    var response = {};

    response.Common = getRoute(midLat, midLon, endLat, endLon, endTime);
    var midTime = response.Common[0].Start.Time;

    response.A = getRoute(startLat1, startLon1, midLat, midLon, midTime);
    response.B = getRoute(startLat2, startLon2, midLat, midLon, midTime);

    return response;
}


 
module.exports = {
    init,
    getRoute,
    getPartnerRoute
};
