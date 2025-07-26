const db = require('../config/db');

exports.getAllContracts = async () => {
  const result = await db.query('SELECT * FROM contracts ORDER BY id DESC');
  return result.rows;
};

exports.getContractById = async (id) => {
  const result = await db.query('SELECT * FROM contracts WHERE id = $1', [id]);
  return result.rows[0];
};

exports.createContract = async (data) => {
  const {
    contract_type, contract_number, contract_name,
    category, sub_category, item,
    contract_date, start_date, end_date,
    ats_amount, jsl_amount, subscription_amount,
    notes, department, pic_user_name, pic_ipm_name,
    vendor
  } = data;

  const result = await db.query(`
    INSERT INTO contracts (
      contract_type, contract_number, contract_name,
      category, sub_category, item,
      contract_date, start_date, end_date,
      ats_amount, jsl_amount, subscription_amount,
      notes, department, pic_user_name, pic_ipm_name,
      vendor
    )
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)
    RETURNING *;
  `, [
    contract_type, contract_number, contract_name,
    category, sub_category, item,
    contract_date, start_date, end_date,
    ats_amount, jsl_amount, subscription_amount,
    notes, department, pic_user_name, pic_ipm_name,
    vendor
  ]);

  return result.rows[0];
};

exports.updateContract = async (id, data) => {
  const {
    contract_type, contract_number, contract_name,
    category, sub_category, item,
    contract_date, start_date, end_date,
    ats_amount, jsl_amount, subscription_amount,
    notes, department, pic_user_name, pic_ipm_name,
    vendor
  } = data;

  const result = await db.query(`
    UPDATE contracts SET
      contract_type = $1,
      contract_number = $2,
      contract_name = $3,
      category = $4,
      sub_category = $5,
      item = $6,
      contract_date = $7,
      start_date = $8,
      end_date = $9,
      ats_amount = $10,
      jsl_amount = $11,
      subscription_amount = $12,
      notes = $13,
      department = $14,
      pic_user_name = $15,
      pic_ipm_name = $16,
      vendor = $17,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = $18 RETURNING *;
  `, [
    contract_type, contract_number, contract_name,
    category, sub_category, item,
    contract_date, start_date, end_date,
    ats_amount, jsl_amount, subscription_amount,
    notes, department, pic_user_name, pic_ipm_name,
    vendor,
    id
  ]);

  return result.rows[0];
};

exports.deleteContract = async (id) => {
  await db.query('DELETE FROM contracts WHERE id = $1', [id]);
};
