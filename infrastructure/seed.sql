-- mock up course
INSERT INTO courses (course_code, course_name, description)
VALUES
  ('CS101', 'Introduction to Computer Science', 'Basic CS course'),
  ('CS242', 'Web Application Development', 'Frontend and backend web development course'),
  ('CS251', 'Database Systems 1', 'Relational database design and SQL fundamentals')
ON CONFLICT (course_code) DO NOTHING;

-- mock up user
INSERT INTO users (email, password_hash, first_name, last_name, student_id, teacher_id)
VALUES
('alice@example.com', '$2b$12$v8G5hUD9RV/sfs9enVh27u.iP/KwlnlwOZOjk0W7ZdQ9TLCwtGAq.', 'Alice', 'Tan', NULL, '1005432001'),
('bob@example.com', '$2b$12$pJ7GK5cF8nbHqFZJxebdYezGD.RCfhlV5CqaEn3HPBToFOtKfveLm', 'Bob', 'Smith', '6709610101', NULL),
('charlie@example.com', '$2b$12$8.SJ69MQ3Ysq1r6rL5LSE.b/R3waH1nKeCFJAA7pCM7.yTfq8y0l6', 'Charlie', 'Lee', '6709610202', NULL)
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
    'bob@example.com',
    'charlie@example.com'
)
AND c.course_code IN (
    'CS101',
    'CS242',
    'CS251'
)
ON CONFLICT (user_id, course_id) DO NOTHING;

-- 1) Due today
INSERT INTO assignments (title,description,due_date,max_score,course_id,created_by,status,allowed_file_types)
SELECT
    'Frontend UI Assignment',
    'Create responsive dashboard UI',
    NOW() + INTERVAL '5 hours',
    50,
    '229265aa-b184-4ef6-bec2-8151b95b9f39',
    (SELECT user_id FROM users WHERE email = 'alice@example.com'),
    'published',
    'html,css,js'
WHERE NOT EXISTS (
    SELECT 1
    FROM assignments
    WHERE title = 'Frontend UI Assignment'
      AND course_id = '229265aa-b184-4ef6-bec2-8151b95b9f39'
);
INSERT INTO assignments (title,description,due_date,max_score,course_id,created_by,status,allowed_file_types)
SELECT
    'API Integration Assignment',
    'Connect frontend dashboard with backend APIs',
    NOW() + INTERVAL '2 hours',
    40,
    'b0ef3c57-1283-4acc-8a92-497d9081bbd4',
    (SELECT user_id FROM users WHERE email = 'alice@example.com'),
    'published',
    'html,css,js,json'
WHERE NOT EXISTS (
    SELECT 1
    FROM assignments
    WHERE title = 'API Integration Assignment'
      AND course_id = 'b0ef3c57-1283-4acc-8a92-497d9081bbd4'
);

-- 2) Upcoming
INSERT INTO assignments (title,description,due_date,max_score,course_id,created_by,status,allowed_file_types)
SELECT
    'Database ER Diagram',
    'Design ER diagram for school management system',
    NOW() + INTERVAL '3 days',
    100,
    'f846ad06-f723-4f32-9ce7-fc506be9328e',
    (SELECT user_id FROM users WHERE email = 'alice@example.com'),
    'published',
    'pdf,png'
WHERE NOT EXISTS (
    SELECT 1
    FROM assignments
    WHERE title = 'Database ER Diagram'
      AND course_id = 'f846ad06-f723-4f32-9ce7-fc506be9328e'
);

-- 3) Overdue
INSERT INTO assignments (title,description,due_date,max_score,course_id,created_by,status,allowed_file_types)
SELECT
    'OS Process Scheduling',
    'Explain FCFS and Round Robin',
    NOW() - INTERVAL '1 day',
    30,
    '229265aa-b184-4ef6-bec2-8151b95b9f39',
    (SELECT user_id FROM users WHERE email = 'alice@example.com'),
    'published',
    'pdf,docx'
WHERE NOT EXISTS (
    SELECT 1
    FROM assignments
    WHERE title = 'OS Process Scheduling'
      AND course_id = '229265aa-b184-4ef6-bec2-8151b95b9f39'
);

-- mock up submission
INSERT INTO submissions (assignment_id,student_id,status)
SELECT
    (SELECT assignment_id
     FROM assignments
     WHERE title = 'Frontend UI Assignment'
     LIMIT 1),
    (SELECT user_id
     FROM users
     WHERE email = 'bob@example.com'),
    'submitted'
WHERE NOT EXISTS (
    SELECT 1
    FROM submissions
    WHERE assignment_id = (
        SELECT assignment_id
        FROM assignments
        WHERE title = 'Frontend UI Assignment'
        LIMIT 1
    )
    AND student_id = (
        SELECT user_id
        FROM users
        WHERE email = 'bob@example.com'
    )
);

-- mock up announcement
INSERT INTO announcements (title,content,created_by,course_id)
SELECT
    'Lab Deadline Reminder',
    'Reminder: Week 10 Lab must be submitted before tonight 11:59 PM.',
    (SELECT user_id FROM users WHERE email = 'alice@example.com'),
    (SELECT course_id FROM courses WHERE course_code = 'CS242')
WHERE NOT EXISTS (
    SELECT 1
    FROM announcements
    WHERE title = 'Lab Deadline Reminder'
      AND course_id = (
          SELECT course_id
          FROM courses
          WHERE course_code = 'CS242'
      )
);

INSERT INTO announcements (title,content,created_by,course_id)
SELECT
    'Project Presentation Schedule',
    'Database project presentation will be held next Monday in Room SC3-303.',
    (SELECT user_id FROM users WHERE email = 'alice@example.com'),
    (SELECT course_id FROM courses WHERE course_code = 'CS251')
WHERE NOT EXISTS (
    SELECT 1
    FROM announcements
    WHERE title = 'Project Presentation Schedule'
      AND course_id = (
          SELECT course_id
          FROM courses
          WHERE course_code = 'CS251'
      )
);