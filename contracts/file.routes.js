const express = require("express");
const router = express.Router();
const fileController = require("./file.controller");
const upload = require("../middlewares/upload.middleware");
const auth = require("../middlewares/auth.middleware");

router.post("/:contractId/files", auth, upload.single("file"), fileController.uploadFile);
router.get("/:contractId/files", auth, fileController.listFiles);
router.get("/files/:fileId", auth, fileController.getFile);
router.get("/files/:fileId/download", auth, fileController.downloadFile);
router.delete("/files/:fileId", auth, fileController.deleteFile);

module.exports = router;