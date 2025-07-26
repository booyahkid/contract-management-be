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
    const total = await dashboardModel.getActiveContracts();
    res.json({ active_contracts: total });
  } catch (err) {
    res.status(500).json({ message: "Failed to get active contracts." });
  }
};

exports.dueSoonContracts = async (req, res) => {
  try {
    const months = parseInt(req.query.months) || 3;
    const total = await dashboardModel.getDueSoonContracts(months);
    res.json({ due_soon_contracts: total });
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