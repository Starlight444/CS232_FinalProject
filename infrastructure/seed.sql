-- mock up course
INSERT INTO courses (course_code, course_name, description)
VALUES
  ('CS232', 'INTRODUCTION TO CLOUD COMPUTING TECHNOLOGY', 'Cloud computing concepts and characteristics'),
  ('CS242', 'PYTHON PROGRAMMING AND APPLICATIONS', 'Learn to build applications with Python'),
  ('CS251', 'DATABASE SYSTEMS 1', 'Relational database design and SQL fundamentals'),
  ('CS217', 'DESIGN AND ANALYSIS OF ALGORITHMS', 'Introduction to the Design and Analysis of Algorithms')
ON CONFLICT (course_code) DO NOTHING;

-- mock up user
INSERT INTO users (email, password_hash, first_name, last_name, student_id, teacher_id)
VALUES
('alice@example.com', '$2b$12$sgGAYeDDjzwf7jVQhG1zt.E8BNbJ52meah2vIPr76rcVNOZf6Yk3K', 'Alice', 'Tan', NULL, '1005432001'),
('min@example.com', '$2b$12$sgGAYeDDjzwf7jVQhG1zt.E8BNbJ52meah2vIPr76rcVNOZf6Yk3K', 'AA', 'Min', '6709610001', NULL),
('kai@example.com', '$2b$12$sgGAYeDDjzwf7jVQhG1zt.E8BNbJ52meah2vIPr76rcVNOZf6Yk3K', 'Nong', 'Kai', '6709610002', NULL),
('nun@example.com', '$2b$12$sgGAYeDDjzwf7jVQhG1zt.E8BNbJ52meah2vIPr76rcVNOZf6Yk3K', 'Sun', 'Ning', '6709616822', NULL)
ON CONFLICT (email) DO NOTHING;

-- mock up course member: add everyone to every course
INSERT INTO course_members (user_id, course_id, role)
SELECT u.user_id, c.course_id,
       CASE
           WHEN u.email = 'alice@example.com' THEN 'teacher'::course_role
           ELSE 'student'::course_role
       END
FROM users u
CROSS JOIN courses c
WHERE u.email IN (
    'alice@example.com',
    'min@example.com',
    'kai@example.com',
    'nun@example.com'
)
AND c.course_code IN (
    'CS232',
    'CS242',
    'CS251',
    'CS217'
)
ON CONFLICT (user_id, course_id) DO NOTHING;

-- mock up assignment: Due today
INSERT INTO assignments (title, description, due_date, max_score, course_id, created_by, status, allowed_file_types)
SELECT
    'Hands-on Lab',
    'Onsite class Lab using sandbox',
    NOW() + INTERVAL '15 hours',
    30,
    c.course_id,
    (SELECT user_id FROM users WHERE email = 'alice@example.com'),
    'published',
    'pdf,png'
FROM courses c
WHERE c.course_code = 'CS232'
AND NOT EXISTS (
    SELECT 1
    FROM assignments a
    WHERE a.title = 'Hands-on Lab'
      AND a.course_id = c.course_id
);

-- mock up assignment: Upcoming
INSERT INTO assignments (title, description, due_date, max_score, course_id, created_by, status, allowed_file_types)
SELECT
    'Install Thonny',
    'Install program and testing',
    NOW() + INTERVAL '3 days',
    10,
    c.course_id,
    (SELECT user_id FROM users WHERE email = 'alice@example.com'),
    'published',
    'py'
FROM courses c
WHERE c.course_code = 'CS242'
AND NOT EXISTS (
    SELECT 1
    FROM assignments a
    WHERE a.title = 'Install Thonny'
      AND a.course_id = c.course_id
);

-- mock up assignment: Overdue
INSERT INTO assignments (title, description, due_date, max_score, course_id, created_by, status, allowed_file_types)
SELECT
    'ERD Analysis',
    'Analyze the follow ERD',
    NOW() - INTERVAL '1 day',
    15,
    c.course_id,
    (SELECT user_id FROM users WHERE email = 'alice@example.com'),
    'published',
    'pdf,docx'
FROM courses c
WHERE c.course_code = 'CS251'
AND NOT EXISTS (
    SELECT 1
    FROM assignments a
    WHERE a.title = 'ERD Analysis'
      AND a.course_id = c.course_id
);

-- mock up submission: Hands-on Lab (CS232)
INSERT INTO submissions (assignment_id, student_id, status)
SELECT
    a.assignment_id,
    u.user_id,
    'submitted'
FROM assignments a
JOIN courses c ON a.course_id = c.course_id
JOIN users u ON u.email IN (
    'min@example.com',
    'kai@example.com',
    'nun@example.com'
)
WHERE a.title = 'Hands-on Lab'
  AND c.course_code = 'CS232'
AND NOT EXISTS (
    SELECT 1
    FROM submissions s
    WHERE s.assignment_id = a.assignment_id
      AND s.student_id = u.user_id
);

-- mock up announcement
INSERT INTO announcements (title, content, created_by, course_id)
SELECT
    'Lab Session Reminder',
    'Today lab will be conducted onsite. Please bring your laptop.',
    u.user_id,
    c.course_id
FROM users u
JOIN courses c ON c.course_code = 'CS232'
WHERE u.email = 'alice@example.com'
AND NOT EXISTS (
    SELECT 1
    FROM announcements a
    WHERE a.title = 'Lab Session Reminder'
      AND a.course_id = c.course_id
);

INSERT INTO announcements (title, content, created_by, course_id)
SELECT
    'Python Setup Check',
    'Make sure Thonny is installed before next class.',
    u.user_id,
    c.course_id
FROM users u
JOIN courses c ON c.course_code = 'CS242'
WHERE u.email = 'alice@example.com'
AND NOT EXISTS (
    SELECT 1
    FROM announcements a
    WHERE a.title = 'Python Setup Check'
      AND a.course_id = c.course_id
);

INSERT INTO announcements (title, content, created_by, course_id)
SELECT
    'ERD Review Session',
    'We will review ERD concepts in the next lecture.',
    u.user_id,
    c.course_id
FROM users u
JOIN courses c ON c.course_code = 'CS251'
WHERE u.email = 'alice@example.com'
AND NOT EXISTS (
    SELECT 1
    FROM announcements a
    WHERE a.title = 'ERD Review Session'
      AND a.course_id = c.course_id
);

INSERT INTO announcements (title, content, created_by, course_id)
SELECT
    'Algorithm Practice',
    'Practice problems will be uploaded this week.',
    u.user_id,
    c.course_id
FROM users u
JOIN courses c ON c.course_code = 'CS217'
WHERE u.email = 'alice@example.com'
AND NOT EXISTS (
    SELECT 1
    FROM announcements a
    WHERE a.title = 'Algorithm Practice'
      AND a.course_id = c.course_id
);

