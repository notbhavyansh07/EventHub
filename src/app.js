// Builds the Express app (kept separate from server.js so it can be tested).
require('dotenv').config();
const path = require('path');
const express = require('express');
const session = require('express-session');
const { apiNotFound, errorHandler } = require('./middleware/errorHandler');

const app = express();
app.use(express.json());
app.use(session({
  secret: process.env.SESSION_SECRET || 'dev-secret-change-me',
  resave: false,
  saveUninitialized: false,
  cookie: { httpOnly: true, sameSite: 'lax', maxAge: 2 * 60 * 60 * 1000 }   // 2 hours
}));

app.use('/api', require('./routes/apiRoutes'));
app.use('/api', apiNotFound);
app.use(express.static(path.join(__dirname, '..', 'public'), { maxAge: '1h' })); // caching = performance
app.use((req, res) => res.status(404).sendFile(path.join(__dirname, '..', 'public', '404.html')));
app.use(errorHandler);

module.exports = app;
