const Contract = require('./contract.model');

exports.getAll = async (req, res, next) => {
  try {
    const data = await Contract.getAllContracts();
    res.json(data);
  } catch (err) {
    next(err);
  }
};

exports.getById = async (req, res, next) => {
  try {
    const data = await Contract.getContractById(req.params.id);
    if (!data) return res.status(404).json({ message: 'Not found' });
    res.json(data);
  } catch (err) {
    next(err);
  }
};

exports.create = async (req, res, next) => {
  try {
    const data = await Contract.createContract(req.body);
    res.status(201).json(data);
  } catch (err) {
    next(err);
  }
};

exports.update = async (req, res, next) => {
  try {
    const data = await Contract.updateContract(req.params.id, req.body);
    if (!data) return res.status(404).json({ message: 'Not found' });
    res.json(data);
  } catch (err) {
    next(err);
  }
};

exports.remove = async (req, res, next) => {
  try {
    await Contract.deleteContract(req.params.id);
    res.json({ message: 'Deleted successfully' });
  } catch (err) {
    next(err);
  }
};