INSERT INTO courses (course_code, course_name, description)
VALUES
('CS101', 'Introduction to Computer Science', 'Basic CS course')
ON CONFLICT (course_code) DO NOTHING;

INSERT INTO users (email, password_hash, first_name, last_name)
VALUES
('alice@example.com', 'hashed_pw1', 'Alice', 'Tan'),
('bob@example.com', 'hashed_pw2', 'Bob', 'Smith'),
('charlie@example.com', 'hashed_pw3', 'Charlie', 'Lee')
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

SELECT * FROM users;
SELECT * FROM courses;
SELECT * FROM course_members;