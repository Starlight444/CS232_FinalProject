from repositories.course_repository import get_all_courses, create_course


def list_courses(user_id: str):
    courses = get_all_courses(user_id)

    return {
        "success": True,
        "data": courses
    }


def add_course(course_code: str, course_name: str, description: str):
    course = create_course(course_code, course_name, description)

    return {
        "success": True,
        "data": course
    }