// Central error handling: every error ends up here and becomes a JSON reply.
const HttpError = require('../utils/HttpError');

exports.apiNotFound = (req, res, next) => next(new HttpError(404, 'API route not found'));

exports.errorHandler = (err, req, res, next) => {
  if (!err.status) console.error(err);            // unexpected bug: log it
  res.status(err.status || 500).json({
    error: err.status ? err.message : 'Something went wrong on the server'
  });
};
