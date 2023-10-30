const express = require("express");
const translinkController = require('../controllers/translink');

const router = express.Router();

router.post('/calculatedDepartureTime', translinkController.calculatedDepartureTime);

module.exports = router;
