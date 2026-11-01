# EventHub - Event Registration System
**Web Development Minor Project** | Bhavyansh Salvi | 25CS003702 | B.Tech CSE AIML (Xebia), Semester 3 | SPSU

Students browse and register for college events; admins manage events and see attendees.
Stack: HTML5, CSS3, JavaScript (fetch/AJAX + JSON), Node.js + Express, MySQL, sessions + cookies, Git/GitHub.

## Folder structure
```
eventhub/
├── src/                      Backend (Node.js + Express)
│   ├── server.js             Starts the server
│   ├── app.js                Builds the Express app (middleware + routes)
│   ├── config/db.js          MySQL connection pool
│   ├── routes/               URL -> controller mapping (auth, events, api)
│   ├── controllers/          Business logic (auth, events, registrations)
│   ├── middleware/           auth.js (login/admin checks), errorHandler.js
│   └── utils/                validators.js, HttpError.js, asyncHandler.js
├── public/                   Frontend (served as static files)
│   ├── index.html login.html signup.html my.html admin.html 404.html
│   ├── css/style.css
│   ├── js/                   common.js (shared) + one script per page
│   └── images/favicon.svg
├── database/                 schema.sql, schema_cloud.sql, sample_data.sql, sql_practice.sql
├── scripts/seed.js           Creates the admin account
├── tests/                    Automated tests (npm test)
├── docs/                     API.md, TESTING.md, ER diagram, screenshots, report
├── .env.example              Settings template (copy to .env)
└── package.json
```

## Run it locally (about 10 minutes)
1. Install **Node.js 18+** and **MySQL 8** (or XAMPP, which includes MySQL + phpMyAdmin).
2. In this folder: `npm install`
3. Create the database: `mysql -u root -p < database/schema.sql`  then  `mysql -u root -p eventhub < database/sample_data.sql`
   (or import both files with phpMyAdmin's Import tab)
4. Copy `.env.example` to `.env` and fill in your MySQL password and a long random `SESSION_SECRET`.
5. `npm run seed` creates the admin: **admin@eventhub.com / Admin@123** (change it).
6. `npm start`, then open http://localhost:3000
7. `npm test` runs the automated tests.

## Deploy for free (Aiven MySQL + Render)
**Database:** create a free MySQL service on aiven.io, then load `database/schema_cloud.sql` into `defaultdb`
(`mysql -h HOST -P PORT -u avnadmin -p --ssl-mode=REQUIRED defaultdb < database/schema_cloud.sql`).
Put the Aiven values and `DB_SSL=true` in `.env`, then run `npm run seed` once.
**App:** push to GitHub, create a Render Web Service (build `npm install`, start `npm start`, Free plan) and add the same
variables under Environment. Free plans change, so check current pricing. Free Render sites sleep when idle (first load ~1 min).

## Security features
bcrypt password hashing - parameterised SQL (no SQL injection) - HTML escaping (no XSS) - HTTP-only SameSite session cookies -
session regeneration on login - server-side role checks - row-locking transaction for registration - input validation on client and server.
