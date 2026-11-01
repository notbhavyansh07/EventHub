// An error that carries an HTTP status code (400, 401, 403, 404, 409 ...).
class HttpError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}
module.exports = HttpError;
