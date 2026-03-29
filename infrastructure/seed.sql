INSERT INTO courses (course_code, course_name, description)
VALUES
('CS101', 'Introduction to Computer Science', 'Basic CS course')
ON CONFLICT (course_code) DO NOTHING;

INSERT INTO users (email, password_hash, first_name, last_name)
VALUES
('alice@example.com', '$2b$12$v8G5hUD9RV/sfs9enVh27u.iP/KwlnlwOZOjk0W7ZdQ9TLCwtGAq.', 'Alice', 'Tan', NULL, '1005432001'),
('bob@example.com', '$2b$12$pJ7GK5cF8nbHqFZJxebdYezGD.RCfhlV5CqaEn3HPBToFOtKfveLm', 'Bob', 'Smith', '6709610101', NULL),
('charlie@example.com', '$2b$12$8.SJ69MQ3Ysq1r6rL5LSE.b/R3waH1nKeCFJAA7pCM7.yTfq8y0l6', 'Charlie', 'Lee', '6709610202', NULL)
ON CONFLICT (email) DO NOTHING;

INSERT INTO course_members (user_id, course_id, role)
SELECT u.user_id, c.course_id, 'teacher'
FROM users u, courses c
WHERE u.email = 'alice@example.com'
  AND c.course_code = 'CS101'
ON CONFLICT (user_id, course_id) DO NOTHING;

INSERT INTO course_members (user_id, course_id, role)
SELECT u.user_id, c.course_id, 'student'
FROM users u, courses c
WHERE u.email = 'bob@example.com'
  AND c.course_code = 'CS101'
ON CONFLICT (user_id, course_id) DO NOTHING;

INSERT INTO course_members (user_id, course_id, role)
SELECT u.user_id, c.course_id, 'student'
FROM users u, courses c
WHERE u.email = 'charlie@example.com'
  AND c.course_code = 'CS101'
ON CONFLICT (user_id, course_id) DO NOTHING;