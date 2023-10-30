// const https = require('https');
// const { XMLParser, XMLBuilder, XMLValidator} = require("fast-xml-parser");
// const parser = new XMLParser();

// https.get('https://api.translink.ca/rttiapi/v1/stops?apikey=11A7LgeZ9TAJR5dnxD7H&lat=49.112374&long=-122.84071', res => {
//   let data = [];
//   const headerDate = res.headers && res.headers.date ? res.headers.date : 'no response date';
//   console.log('Status Code:', res.statusCode);
//   console.log('Date in Response header:', headerDate);

//   res.on('data', chunk => {
//     data.push(chunk);
//   });

//   res.on('end', () => {
//     console.log('Response ended: ');
//     console.log(parser.parse(Buffer.concat(data).toString()).Stops);
//   });
// }).on('error', err => {
//   console.log('Error: ', err.message);
// });

const fs = require('fs');
const routesPath = 'translink_data/routes.txt';
const agencyPath = 'translink_data/agency.txt';
const calendarDatesPath = 'translink_data/calendar_dates.txt';
const calendarPath = 'translink_data/calendar.txt';
const directionNamesExceptionsPath = 'translink_data/direction_names_exceptions.txt';
const directionsPath = 'translink_data/directions.txt';
const feedInfoPath = 'translink_data/feed_info.txt';
const patternIdPath = 'translink_data/pattern_id.txt';
const shapesPath = 'translink_data/shapes.txt';
const signupPeriodsPath = 'translink_data/signup_periods.txt';
const stopOrderExceptionsPath = 'translink_data/stop_order_exceptions.txt';
const stopsPath = 'translink_data/stops.txt';
const stopTimesPath = 'translink_data/stop_times.txt';
const transfersPath = 'translink_data/transfers.txt';
const tripsPath = 'translink_data/trips.txt';



async function main() {
    var routes = parseFile(routesPath);
    var agency = parseFile(agencyPath);
    var calendar = parseFile(calendarPath);
    var calendarDates = parseFile(calendarDatesPath);
    var directionNamesExceptions = parseFile(directionNamesExceptionsPath);
    var directions = parseFile(directionsPath);
    var feedInfo = parseFile(feedInfoPath);
    var signupPeriods = parseFile(signupPeriodsPath);
    var patternId = parseFile(patternIdPath);
    var shapes = parseFile(shapesPath);
    var stopOrderExceptions = parseFile(stopOrderExceptionsPath);
    var stops = parseFile(stopsPath);
    var stopTimes = parseFile(stopTimesPath);
    var transfers = parseFile(transfersPath);
    var trips = parseFile(tripsPath);
    console.log(await routes)
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
                    // if (temp[j] === undefined) {
                    //     temp[j] = [];
                    // }
                    // temp[j].push(words[j]);
                }
                output.push(temp);
            }
        
            resolve(output);
        });
    });
    
}


main();


