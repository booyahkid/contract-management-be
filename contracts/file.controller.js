const fileModel = require("./file.model");
const path = require("path");

exports.uploadFile = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });

    const contractId = req.params.contractId;
    const fileData = {
      contract_id: contractId,
      file_path: req.file.path,
      original_name: req.file.originalname,
      mime_type: req.file.mimetype,
      size: req.file.size,
    };

    const saved = await fileModel.saveFile(fileData);
    res.status(200).json({ message: "File uploaded", file: saved });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Upload failed" });
  }
};

exports.listFiles = async (req, res) => {
  try {
    const contractId = req.params.contractId;
    const files = await fileModel.getFilesByContract(contractId);
    res.status(200).json(files);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch files" });
  }
};

exports.downloadFile = async (req, res) => {
  try {
    const fileId = req.params.fileId;
    const file = await fileModel.getFileById(fileId);
    if (!file) return res.status(404).json({ message: "File not found" });
    res.download(path.resolve(file.file_path), file.original_name);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Download failed" });
  }
};
