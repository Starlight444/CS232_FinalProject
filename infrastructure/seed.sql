INSERT INTO users (email, password_hash, first_name, last_name)
VALUES
('alice@example.com', 'hashed_pw1', 'Alice', 'Tan'),
('bob@example.com', 'hashed_pw2', 'Bob', 'Smith'),
('charlie@example.com', 'hashed_pw3', 'Charlie', 'Lee')
ON CONFLICT (email) DO NOTHING;

INSERT INTO courses (course_code, course_name, description)
VALUES
('CS101', 'Introduction to Computer Science', 'Basic CS course')
ON CONFLICT (course_code) DO NOTHING;

INSERT INTO course_members (user_id, course_id, role)
SELECT u.user_id, c.course_id, 'teacher'::role_enum
FROM users u, courses c
WHERE u.email = 'alice@example.com' AND c.course_code = 'CS101'
AND NOT EXISTS (
    SELECT 1
    FROM course_members cm
    WHERE cm.user_id = u.user_id
      AND cm.course_id = c.course_id
      AND cm.role = 'teacher'
);

INSERT INTO course_members (user_id, course_id, role)
SELECT u.user_id, c.course_id, 'student'::role_enum
FROM users u, courses c
WHERE u.email = 'bob@example.com' AND c.course_code = 'CS101'
AND NOT EXISTS (
    SELECT 1
    FROM course_members cm
    WHERE cm.user_id = u.user_id
      AND cm.course_id = c.course_id
      AND cm.role = 'student'
);

INSERT INTO course_members (user_id, course_id, role)
SELECT u.user_id, c.course_id, 'student'::role_enum
FROM users u, courses c
WHERE u.email = 'charlie@example.com' AND c.course_code = 'CS101'
AND NOT EXISTS (
    SELECT 1
    FROM course_members cm
    WHERE cm.user_id = u.user_id
      AND cm.course_id = c.course_id
      AND cm.role = 'student'
);

SELECT * FROM users;
SELECT * FROM courses;
SELECT * FROM course_members;