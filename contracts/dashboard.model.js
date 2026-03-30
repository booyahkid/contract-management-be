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

// Active contracts that are active at any point in the specified year
exports.getActiveContractsByYear = async (year) => {
  // A contract is considered active in the year if its start_date is before end of year
  // and its end_date is after start of year (or null meaning open-ended)
  const result = await db.query(
    `SELECT COUNT(*) AS total FROM contracts 
     WHERE start_date <= make_date($1,12,31)
       AND (end_date IS NULL OR end_date >= make_date($1,1,1))`,
    [year]
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

// Contracts ending within the first N months of the specified year
exports.getDueSoonContractsByYear = async (months, year) => {
  const result = await db.query(
    `SELECT COUNT(*) AS total FROM contracts 
     WHERE end_date >= make_date($2,1,1)
       AND end_date < (make_date($2,1,1) + ($1 || ' months')::interval)`,
    [months, year]
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

// Contracts whose end_date falls inside the specified year
exports.getExpiredContractsByYear = async (year) => {
  const result = await db.query(
    `SELECT COUNT(*) AS total FROM contracts 
     WHERE end_date IS NOT NULL 
       AND EXTRACT(YEAR FROM end_date) = $1`,
    [year]
  );
  return parseInt(result.rows[0].total);
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

// Optional combined summary helper (not used directly yet but available)
exports.getContractsStatusSummary = async (year, months = 3) => {
  const [active, dueSoon, expired] = await Promise.all([
    exports.getActiveContractsByYear(year),
    exports.getDueSoonContractsByYear(months, year),
    exports.getExpiredContractsByYear(year)
  ]);
  return { year, months_window: months, active_contracts: active, due_soon_contracts: dueSoon, expired_contracts: expired };
};