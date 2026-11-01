// Access control: who is allowed to call which route.
const HttpError = require('../utils/HttpError');

exports.requireLogin = (req, res, next) =>
  req.session && req.session.user ? next() : next(new HttpError(401, 'Please log in first'));

exports.requireAdmin = (req, res, next) => {
  if (!req.session || !req.session.user) return next(new HttpError(401, 'Please log in first'));
  if (req.session.user.role !== 'admin') return next(new HttpError(403, 'Admin access only'));
  next();
};
