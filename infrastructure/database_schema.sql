CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS users (
    user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    student_id VARCHAR(10) UNIQUE,
    teacher_id VARCHAR(10) UNIQUE
);

CREATE TABLE IF NOT EXISTS courses (
    course_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_code VARCHAR(20) UNIQUE NOT NULL,
    course_name VARCHAR(255) NOT NULL,
    description TEXT NOT NULL
);

-- CREATE TYPE course_role AS ENUM ('student', 'teacher', 'ta');
DO $$ BEGIN CREATE TYPE course_role AS ENUM ('student','teacher','ta'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS course_members (
    member_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    course_id UUID NOT NULL,
    role course_role NOT NULL,

    CONSTRAINT fk_user
        FOREIGN KEY (user_id)
        REFERENCES users(user_id),

    CONSTRAINT fk_course
        FOREIGN KEY (course_id)
        REFERENCES courses(course_id),

    CONSTRAINT unique_user_course
        UNIQUE (user_id, course_id)
);

CREATE INDEX IF NOT EXISTS idx_course_members_user
ON course_members(user_id);

CREATE TABLE IF NOT EXISTS announcements (
    announcement_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by UUID NOT NULL,
    course_id UUID NOT NULL,

    CONSTRAINT fk_announcement_user
        FOREIGN KEY (created_by)
        REFERENCES users(user_id),

    CONSTRAINT fk_announcement_course
        FOREIGN KEY (course_id)
        REFERENCES courses(course_id)
);

CREATE INDEX IF NOT EXISTS idx_announcements_course
ON announcements(course_id);

-- CREATE TYPE assignment_status AS ENUM ('published', 'closed');
DO $$ BEGIN CREATE TYPE assignment_status AS ENUM ('published', 'closed'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS assignments (
    assignment_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    due_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    max_score INT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    course_id UUID NOT NULL,
    created_by UUID NOT NULL,
    status assignment_status NOT NULL DEFAULT 'published',
    allowed_file_types VARCHAR(100) NOT NULL,

    CONSTRAINT fk_assignment_course
        FOREIGN KEY (course_id)
        REFERENCES courses(course_id),

    CONSTRAINT fk_assignment_user
        FOREIGN KEY (created_by)
        REFERENCES users(user_id)
);

CREATE INDEX IF NOT EXISTS idx_assignment_course
ON assignments(course_id);

-- CREATE TYPE submission_status AS ENUM ('submitted', 'pending' , 'graded', 'missing');
DO $$ BEGIN CREATE TYPE submission_status AS ENUM ('submitted', 'pending' , 'graded', 'missing'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS submissions (
    submission_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assignment_id UUID NOT NULL,
    student_id UUID NOT NULL,
    submitted_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status submission_status NOT NULL,
    score INT,
    feedback TEXT,

    CONSTRAINT fk_submission_assignment
        FOREIGN KEY (assignment_id)
        REFERENCES assignments(assignment_id)
        ON DELETE CASCADE,

    CONSTRAINT fk_submission_student
        FOREIGN KEY (student_id)
        REFERENCES users(user_id),

    CONSTRAINT unique_assignment_student
        UNIQUE (assignment_id, student_id)
);

CREATE INDEX IF NOT EXISTS idx_submission_assignment
ON submissions(assignment_id);

CREATE INDEX IF NOT EXISTS idx_submission_student
ON submissions(student_id);

CREATE TABLE IF NOT EXISTS attachments (
    attachment_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assignment_id UUID,
    submission_id UUID,
    file_name VARCHAR(255) NOT NULL,
    file_url TEXT NOT NULL,
    file_type VARCHAR(100) NOT NULL,
    uploaded_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_attachment_assignment
        FOREIGN KEY (assignment_id)
        REFERENCES assignments(assignment_id),

    CONSTRAINT fk_attachment_submission
        FOREIGN KEY (submission_id)
        REFERENCES submissions(submission_id),
    
    CONSTRAINT check_attachment_reference
        CHECK (
            (assignment_id IS NOT NULL AND submission_id IS NULL)
            OR
            (assignment_id IS NULL AND submission_id IS NOT NULL)
        )
);

CREATE INDEX IF NOT EXISTS idx_attachment_submission
ON attachments(submission_id);

CREATE INDEX IF NOT EXISTS idx_attachment_assignment
ON attachments(assignment_id);

-- save external account: 1 web 1 account
CREATE TABLE IF NOT EXISTS external_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    is_mock BOOLEAN,
    source_name VARCHAR(50) NOT NULL,
    external_username VARCHAR(255) NOT NULL,
    external_password_encrypted TEXT NOT NULL,
    is_connected BOOLEAN DEFAULT TRUE,
    last_synced_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_user
        FOREIGN KEY(user_id)
        REFERENCES users(user_id)
        ON DELETE CASCADE,

    CONSTRAINT unique_user_source
        UNIQUE(user_id, source_name)
);

CREATE TABLE IF NOT EXISTS external_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    user_id UUID NOT NULL,
    source_name VARCHAR(50),
    external_course_name TEXT,
    external_course_url TEXT,
    title TEXT,
    external_link TEXT,
    submission_status TEXT,
    grading_status TEXT,
    due_date TIMESTAMP,
    time_remaining TEXT,
    last_modified TIMESTAMP,
    file_submission TEXT,

    raw_data JSONB,  -- เก็บ dump เผื่อ debug

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT unique_ext_assign
        UNIQUE (user_id, source_name, external_link)
);

CREATE TABLE IF NOT EXISTS external_announcements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    user_id UUID NOT NULL,
    source_name VARCHAR(100) NOT NULL,
    external_course_name TEXT,
    external_course_url TEXT,
    title TEXT NOT NULL,
    external_link TEXT,
    author TEXT,
    created_at TIMESTAMP,
    raw_data JSONB,

    CONSTRAINT fk_external_announcement_user
        FOREIGN KEY (user_id)
        REFERENCES users(user_id)
        ON DELETE CASCADE,

    CONSTRAINT unique_ext_announce
        UNIQUE (user_id, source_name, external_link)
);

CREATE INDEX IF NOT EXISTS idx_external_announcement_user
ON external_announcements(user_id);

CREATE INDEX IF NOT EXISTS idx_external_announcement_source
ON external_announcements(source_name);