from database import get_db


def get_all_courses(user_id: str):
    db = get_db()
    cursor = db.cursor()

    query = """
    SELECT c.course_id, c.course_code, c.course_name, c.description
    FROM courses c
    JOIN course_members cm ON c.course_id = cm.course_id
    WHERE cm.user_id = %s
    """

    cursor.execute(query, (user_id,))
    rows = cursor.fetchall()

    return [
        {
            "course_id": str(r[0]),
            "course_code": r[1],
            "course_name": r[2],
            "description": r[3],
        }
        for r in rows
    ]


def create_course(course_code: str, course_name: str, description: str):
    db = get_db()
    cursor = db.cursor()

    query = """
    INSERT INTO courses (course_code, course_name, description)
    VALUES (%s, %s, %s)
    RETURNING course_id
    """

    cursor.execute(query, (course_code, course_name, description))
    course_id = cursor.fetchone()[0]

    db.commit()

    return {
        "course_id": str(course_id),
        "course_code": course_code,
        "course_name": course_name,
        "description": description,
    }
    