const re = require('./routeEngine.js');


async function main() {

await re.init();

console.log(re.getRoute(49.11969210648663, -122.84584906226361, 49.26711196197122, -123.24627034450697, "14:00:00"));
}

main();