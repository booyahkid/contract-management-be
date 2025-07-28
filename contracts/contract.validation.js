const Joi = require('joi');

const contractSchema = Joi.object({
  contract_type: Joi.string().valid('Kontrak', 'PO').required(),
  contract_number: Joi.string().required(),
  contract_name: Joi.string().required(),
  category: Joi.string().allow('', null), // Make category optional
  sub_category: Joi.string().allow('', null), // Allow sub_category to be optional or use category value
  item: Joi.string().allow('', null), // Make item optional
  contract_date: Joi.date().required(),
  start_date: Joi.date().required(),
  end_date: Joi.date().min(Joi.ref('start_date')).required(),
  ats_amount: Joi.number().min(0).required(),
  jsl_amount: Joi.number().min(0).required(),
  subscription_amount: Joi.number().min(0).required(),
  notes: Joi.string().allow('', null),
  department: Joi.string().required(),
  pic_user_name: Joi.string().allow('', null), // Make PIC fields optional
  pic_ipm_name: Joi.string().allow('', null), // Make PIC fields optional
  vendor: Joi.string().allow('', null) // Make vendor optional
});

exports.validateContract = (req, res, next) => {
  const { error } = contractSchema.validate(req.body);
  if (error) return res.status(400).json({ message: error.message });
  next();
};
