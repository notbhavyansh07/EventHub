-- Sample events so the home page is not empty. Run AFTER schema.sql:
--   mysql -u root -p eventhub < database/sample_data.sql
INSERT INTO events (title, description, venue, category, event_date, capacity) VALUES
('Intro to Web Development Workshop','Hands-on HTML, CSS and JavaScript basics for beginners.','Seminar Hall A','Workshop','2026-12-02 10:00:00',60),
('Hackathon 2026','12-hour team coding challenge. Bring your laptop.','Computer Lab 2','Competition','2026-12-09 09:00:00',40),
('Career Guidance Talk','Industry speakers discuss careers in software.','Main Auditorium','Seminar','2026-12-12 14:00:00',200),
('Annual Cultural Night','Music, dance and drama performances by students.','Open Air Theatre','Cultural','2026-12-18 18:00:00',300),
('Inter-Department Cricket Cup','Knockout cricket tournament between departments.','College Ground','Sports','2026-12-20 08:30:00',120);
