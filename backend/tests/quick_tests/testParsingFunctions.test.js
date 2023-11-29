const fs = require('fs');
const routeEngine = require('../../engine/routeEngine.js')



describe("testing parsing functions in routeEngine", () => {

	test("try to parse file that does not exist with parseTranslinkFile", async () => {
		const filePath = "/test.t";
		
		try {
			const result = await routeEngine.parseTranslinkFile(filePath);
		} catch (error) {
			console.log(error);
		}
	});

	test("try to parse file that does not exist with parseGeneratedFile", async () => {
		const filePath = "/test.t";
		
		try {
			const result = await routeEngine.parseGeneratedFile(filePath);
		} catch (error) {
			console.log(error);
		}
	});

	test("try to parse file that does exist, but isnt parsed through routing tests, with parseTranslinkFile", async () => {
		const filePath = "./engine/translink_data/calendar.txt";
		
		try {
			const result = await routeEngine.parseTranslinkFile(filePath);
		} catch (error) {
			console.log(error);
		}
	});


});
