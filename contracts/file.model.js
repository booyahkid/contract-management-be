const db = require("../config/db");

exports.saveFile = async ({ contract_id, file_path, original_name, mime_type, size }) => {
  const result = await db.query(
    `INSERT INTO contract_files (contract_id, file_path, original_name, mime_type, size)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [contract_id, file_path, original_name, mime_type, size]
  );
  return result.rows[0];
};

exports.getFilesByContract = async (contract_id) => {
  const result = await db.query(
    `SELECT * FROM contract_files WHERE contract_id = $1 ORDER BY uploaded_at DESC`,
    [contract_id]
  );
  return result.rows;
};

exports.getFileById = async (fileId) => {
  const result = await db.query(`SELECT * FROM contract_files WHERE id = $1`, [fileId]);
  return result.rows[0];
};

exports.deleteFile = async (fileId) => {
  const result = await db.query(
    `DELETE FROM contract_files WHERE id = $1 RETURNING *`,
    [fileId]
  );
  return result.rows[0];
};