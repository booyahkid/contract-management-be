const AuthService = require('./auth.service');

exports.register = async (req, res, next) => {
  try {
    const user = await AuthService.register(req.body);
    res.status(201).json(user);
  } catch (err) {
    next(err);
  }
};

exports.login = async (req, res, next) => {
  try {
    const token = await AuthService.login(req.body);
    res.json({ token });
  } catch (err) {
    next(err);
  }
};

exports.logout = (req, res) => {
  res.status(200).json({ message: 'Logged out successfully' });
}
