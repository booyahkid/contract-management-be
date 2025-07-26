const Joi = require('joi');

const contractSchema = Joi.object({
  contract_type: Joi.string().valid('Kontrak', 'PO').required(),
  contract_number: Joi.string().required(),
  contract_name: Joi.string().required(),
  category: Joi.string().required(),
  sub_category: Joi.string().required(),
  item: Joi.string().required(),
  contract_date: Joi.date().required(),
  start_date: Joi.date().required(),
  end_date: Joi.date().min(Joi.ref('start_date')).required(),
  ats_amount: Joi.number().min(0).required(),
  jsl_amount: Joi.number().min(0).required(),
  subscription_amount: Joi.number().min(0).required(),
  notes: Joi.string().allow('', null),
  department: Joi.string().required(),
  pic_user_name: Joi.string().required(),
  pic_ipm_name: Joi.string().required()
});

exports.validateContract = (req, res, next) => {
  const { error } = contractSchema.validate(req.body);
  if (error) return res.status(400).json({ message: error.message });
  next();
};
