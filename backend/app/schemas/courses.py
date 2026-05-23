from datetime import datetime
from pydantic import BaseModel


class CourseSummary(BaseModel):
    slug: str
    title: str
    subtitle: str
    description: str
    icon: str
    difficulty: str
    estimated_minutes: int
    target_scenario_id: str
    tags: list[str]
    lessons_count: int
    quiz_count: int
    # — user-specific overlay
    lessons_completed: int = 0
    completed: bool = False
    quiz_score: int = 0
    quiz_max: int = 0


class LessonOut(BaseModel):
    slug: str
    title: str
    summary: str
    duration_min: int
    body_md: str
    completed: bool = False


class QuizOption(BaseModel):
    id: str
    text: str


class QuizQuestion(BaseModel):
    id: str
    question: str
    options: list[QuizOption]


class CourseDetail(BaseModel):
    slug: str
    title: str
    subtitle: str
    description: str
    icon: str
    difficulty: str
    estimated_minutes: int
    target_scenario_id: str
    tags: list[str]
    lessons: list[LessonOut]
    quiz: list[QuizQuestion]
    # — user-specific overlay
    completed: bool = False
    quiz_score: int = 0
    quiz_max: int = 0
    quiz_attempts: int = 0


class LessonCompleteRequest(BaseModel):
    user_id: int
    course_slug: str
    lesson_slug: str


class LessonCompleteResponse(BaseModel):
    course_slug: str
    lesson_slug: str
    completed_count: int
    total_count: int
    points_awarded: int


class QuizSubmitRequest(BaseModel):
    user_id: int
    course_slug: str
    answers: dict[str, str]  # {question_id: option_id}


class QuizQuestionResult(BaseModel):
    question_id: str
    correct: bool
    expected_option_id: str | None = None
    explanation: str


class QuizSubmitResponse(BaseModel):
    course_slug: str
    score: int
    max_score: int
    passed: bool
    course_completed: bool
    points_awarded: int
    next_scenario_id: str
    results: list[QuizQuestionResult]


class ActivityItem(BaseModel):
    id: int
    kind: str
    title: str
    detail: str = ""
    points: int = 0
    created_at: datetime

    class Config:
        from_attributes = True
