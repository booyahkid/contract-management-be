const db = require("../config/db");

exports.getTotalContractsThisYear = async (year) => {
  const result = await db.query(
    `SELECT COUNT(*) AS total FROM contracts WHERE EXTRACT(YEAR FROM contract_date) = $1`,
    [year]
  );
  return parseInt(result.rows[0].total);
};

exports.getActiveContracts = async () => {
  const result = await db.query(
    `SELECT COUNT(*) AS total FROM contracts WHERE start_date <= CURRENT_DATE AND end_date >= CURRENT_DATE`
  );
  return parseInt(result.rows[0].total);
};

exports.getDueSoonContracts = async (months) => {
  const result = await db.query(
    `SELECT COUNT(*) AS total FROM contracts WHERE end_date BETWEEN CURRENT_DATE AND CURRENT_DATE + ($1 || ' months')::interval`,
    [months]
  );
  return parseInt(result.rows[0].total);
};

exports.getDueSoonContractList = async (months) => {
  const result = await db.query(
    `SELECT id, contract_name, contract_number, end_date, department, vendor FROM contracts WHERE end_date BETWEEN CURRENT_DATE AND CURRENT_DATE + ($1 || ' months')::interval ORDER BY end_date ASC`,
    [months]
  );
  return result.rows;
};

exports.getContractsGroupedByDepartment = async () => {
  const result = await db.query(
    `SELECT department, COUNT(*) AS count FROM contracts GROUP BY department`
  );
  return result.rows;
};

exports.getContractsGroupedByDuration = async () => {
  const result = await db.query(`
    SELECT
      CASE
        WHEN end_date - start_date < interval '6 months' THEN 'Short'
        WHEN end_date - start_date <= interval '12 months' THEN 'Medium'
        ELSE 'Long'
      END AS duration,
      COUNT(*)
    FROM contracts
    GROUP BY duration
  `);
  return result.rows.map(r => ({ duration: r.duration, count: parseInt(r.count) }));
};

exports.getDueContractsByMonth = async (year) => {
  const result = await db.query(`
    SELECT TO_CHAR(end_date, 'Month') AS month, COUNT(*)
    FROM contracts
    WHERE EXTRACT(YEAR FROM end_date) = $1
    GROUP BY month
    ORDER BY MIN(end_date)
  `, [year]);
  return result.rows.map(r => ({ month: r.month.trim(), count: parseInt(r.count) }));
};

exports.getContractsGroupedByCategory = async () => {
  const result = await db.query(`
    SELECT 'ATS' AS category, COUNT(*) FROM contracts WHERE ats_amount > 0
    UNION
    SELECT 'JSL', COUNT(*) FROM contracts WHERE jsl_amount > 0
    UNION
    SELECT 'Subscription', COUNT(*) FROM contracts WHERE subscription_amount > 0
  `);
  return result.rows.map(r => ({ category: r.category, count: parseInt(r.count) }));
};

exports.getCreatedContractsByMonth = async (year) => {
  const result = await db.query(`
    SELECT TO_CHAR(contract_date, 'Month') AS month, COUNT(*)
    FROM contracts
    WHERE EXTRACT(YEAR FROM contract_date) = $1
    GROUP BY month
    ORDER BY MIN(contract_date)
  `, [year]);
  return result.rows.map(r => ({ month: r.month.trim(), created: parseInt(r.count) }));
};