const express = require("express");
const practiceAreaController = require("../controllers/practiceArea.controller");

const router = express.Router();

router.get("/", practiceAreaController.listActivePracticeAreas);

module.exports = router;
