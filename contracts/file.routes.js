const express = require("express");
const router = express.Router();
const fileController = require("./file.controller");
const upload = require("../middlewares/upload.middleware");

router.post("/:contractId/files", upload.single("file"), fileController.uploadFile);
router.get("/:contractId/files", fileController.listFiles);
router.get("/files/:fileId/download", fileController.downloadFile);

module.exports = router;