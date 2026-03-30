const dashboardModel = require("./dashboard.model");

exports.totalThisYear = async (req, res) => {
  try {
    const year = req.query.year || new Date().getFullYear();
    const total = await dashboardModel.getTotalContractsThisYear(year);
    res.json({ total_contracts: total });
  } catch (err) {
    res.status(500).json({ message: "Failed to get total contracts." });
  }
};

exports.activeContracts = async (req, res) => {
  try {
    const year = req.query.year ? parseInt(req.query.year) : null;
    let total;
    if (year) {
      total = await dashboardModel.getActiveContractsByYear(year);
    } else {
      total = await dashboardModel.getActiveContracts();
    }
    res.json({ active_contracts: total, year: year || null });
  } catch (err) {
    res.status(500).json({ message: "Failed to get active contracts." });
  }
};

exports.dueSoonContracts = async (req, res) => {
  try {
    const months = parseInt(req.query.months) || 3;
    const year = req.query.year ? parseInt(req.query.year) : null;
    let total;
    if (year) {
      total = await dashboardModel.getDueSoonContractsByYear(months, year);
    } else {
      total = await dashboardModel.getDueSoonContracts(months);
    }
    res.json({ due_soon_contracts: total, months, year: year || null });
  } catch (err) {
    res.status(500).json({ message: "Failed to get due soon contracts." });
  }
};

exports.dueSoonContractList = async (req, res) => {
  try {
    const months = parseInt(req.query.within) || 3;
    const contracts = await dashboardModel.getDueSoonContractList(months);
    res.json(contracts);
  } catch (err) {
    res.status(500).json({ message: "Failed to get due soon contract list." });
  }
};

exports.expiredContracts = async (req, res) => {
  try {
    const year = req.query.year ? parseInt(req.query.year) : null;
    if (!year) {
      return res.status(400).json({ message: "Missing required 'year' query param." });
    }
    const total = await dashboardModel.getExpiredContractsByYear(year);
    res.json({ expired_contracts: total, year });
  } catch (err) {
    res.status(500).json({ message: "Failed to get expired contracts." });
  }
};

exports.statusByYear = async (req, res) => {
  try {
    const year = req.query.year ? parseInt(req.query.year) : new Date().getFullYear();
    const months = parseInt(req.query.months) || 3;

    const [active, dueSoon, expired] = await Promise.all([
      dashboardModel.getActiveContractsByYear(year),
      dashboardModel.getDueSoonContractsByYear(months, year),
      dashboardModel.getExpiredContractsByYear(year)
    ]);

    res.json({
      year,
      months_window: months,
      active_contracts: active,
      due_soon_contracts: dueSoon,
      expired_contracts: expired
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to get yearly status summary." });
  }
};

exports.groupByDepartment = async (req, res) => {
  try {
    const data = await dashboardModel.getContractsGroupedByDepartment();
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: "Failed to get department grouping." });
  }
};

exports.groupByDuration = async (req, res) => {
  try {
    const data = await dashboardModel.getContractsGroupedByDuration();
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: "Failed to get duration grouping." });
  }
};

exports.dueByMonth = async (req, res) => {
  try {
    const year = parseInt(req.query.year) || new Date().getFullYear();
    const data = await dashboardModel.getDueContractsByMonth(year);
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: "Failed to get due by month." });
  }
};

exports.groupByCategory = async (req, res) => {
  try {
    const data = await dashboardModel.getContractsGroupedByCategory();
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: "Failed to get category grouping." });
  }
};

exports.createdByMonth = async (req, res) => {
  try {
    const year = parseInt(req.query.year) || new Date().getFullYear();
    const data = await dashboardModel.getCreatedContractsByMonth(year);
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: "Failed to get creation trend." });
  }
};