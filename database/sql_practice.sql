-- =====================================================
-- Module 4 practice: the basic MySQL commands used in this project.
-- Try these in phpMyAdmin or the mysql command line. Learn what each does for the viva.
-- =====================================================
SHOW DATABASES;                 -- list databases
USE eventhub;                   -- select a database
SHOW TABLES;                    -- list tables
DESCRIBE events;                -- show columns of a table

-- CREATE a table (practice table, not used by the app)
CREATE TABLE IF NOT EXISTS feedback (
  id INT AUTO_INCREMENT PRIMARY KEY,
  event_id INT NOT NULL,
  comment VARCHAR(255),
  FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
);

-- ALTER a table
ALTER TABLE feedback ADD COLUMN rating TINYINT DEFAULT 5;
ALTER TABLE feedback MODIFY COLUMN comment VARCHAR(500);
ALTER TABLE feedback DROP COLUMN rating;

-- INSERT, SELECT, UPDATE, DELETE  (CRUD)
INSERT INTO feedback (event_id, comment) VALUES (1, 'Great workshop!');
SELECT * FROM feedback;
UPDATE feedback SET comment = 'Excellent workshop!' WHERE id = 1;
DELETE FROM feedback WHERE id = 1;

-- Queries used by the app
SELECT title, event_date FROM events WHERE category = 'Workshop' ORDER BY event_date;        -- filter + sort
SELECT COUNT(*) AS seats_taken FROM registrations WHERE event_id = 1;                       -- aggregate
SELECT u.name, e.title FROM registrations r
  JOIN users u ON u.id = r.user_id JOIN events e ON e.id = r.event_id;                      -- JOIN

-- DELETE table / database (careful!)
DROP TABLE feedback;
-- DROP DATABASE eventhub;
