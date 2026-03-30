const express = require("express");
const router = express.Router();
const fileController = require("./file.controller");
const upload = require("../middlewares/upload.middleware");
const auth = require("../middlewares/auth.middleware");

// File upload and management
router.post("/:contractId/files", auth, upload.single("file"), fileController.uploadFile);
router.get("/:contractId/files", auth, fileController.listFiles);

// File operations
router.get("/files/:fileId", auth, fileController.getFile);
router.get("/files/:fileId/view", auth, fileController.viewFile);
router.get("/files/:fileId/download", auth, fileController.downloadFile);
router.get("/files/:fileId/thumbnail", auth, fileController.getThumbnail);
router.post("/files/:fileId/extract", auth, fileController.extractText);
router.delete("/files/:fileId", auth, fileController.deleteFile);

// RAG Integration endpoints
router.post("/files/:fileId/sync-to-rag", auth, fileController.syncToRAG);
router.get("/files/:fileId/rag-status", auth, fileController.getRAGStatus);

module.exports = router;