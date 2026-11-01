-- =====================================================
-- EventHub database schema (MySQL 8)
-- Run:  mysql -u root -p < database/schema.sql
-- =====================================================
CREATE DATABASE IF NOT EXISTS eventhub CHARACTER SET utf8mb4;
USE eventhub;

DROP TABLE IF EXISTS registrations;
DROP TABLE IF EXISTS events;
DROP TABLE IF EXISTS users;

CREATE TABLE users (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  name          VARCHAR(80)  NOT NULL,
  email         VARCHAR(120) NOT NULL UNIQUE,
  password_hash VARCHAR(100) NOT NULL,
  role          ENUM('user','admin') NOT NULL DEFAULT 'user',
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE events (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  title       VARCHAR(150) NOT NULL,
  description TEXT,
  venue       VARCHAR(150) NOT NULL,
  category    ENUM('Workshop','Seminar','Competition','Cultural','Sports','Other') NOT NULL DEFAULT 'Other',
  event_date  DATETIME NOT NULL,
  capacity    INT NOT NULL CHECK (capacity > 0),
  created_by  INT NULL,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE registrations (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  user_id       INT NOT NULL,
  event_id      INT NOT NULL,
  registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_user_event (user_id, event_id),          -- one seat per person per event
  FOREIGN KEY (user_id)  REFERENCES users(id)  ON DELETE CASCADE,
  FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
);

CREATE INDEX idx_events_date ON events(event_date);
CREATE INDEX idx_events_category ON events(category);
