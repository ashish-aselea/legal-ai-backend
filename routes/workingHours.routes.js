const express = require("express");
const workingHoursController = require("../controllers/workingHours.controller");

const router = express.Router();

router.get("/", workingHoursController.listWorkingHours);

module.exports = router;
