const express = require("express");
const router = express.Router();
const extractController = require("./extract.controller");
const auth = require("../middlewares/auth.middleware");
const upload = require("../middlewares/upload.middleware");

router.post("/extract-preview", auth, upload.single("file"), extractController.extractAndPreviewContract);

module.exports = router;