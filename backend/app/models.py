from datetime import datetime, timezone
from pydantic import BaseModel, Field


def now() -> datetime:
    return datetime.now(timezone.utc)


class User(BaseModel):
    id: str
    email: str
    name: str


class Message(BaseModel):
    speaker: str
    role: str
    content: str
    round: int
    timestamp: datetime = Field(default_factory=now)


class Evaluation(BaseModel):
    overall_score: int
    scores: dict[str, int]
    strengths: list[str]
    weaknesses: list[str]
    recommendations: list[str]


class DiscussionCreate(BaseModel):
    category: str = "General"
    difficulty: str = "Intermediate"
    duration: int = Field(default=8, ge=4, le=20)
    topic_mode: str = "generated"
    custom_topic: str | None = None


class Discussion(BaseModel):
    id: str
    user_id: str
    topic: str
    category: str
    difficulty: str
    duration: int
    status: str = "active"
    started_at: datetime = Field(default_factory=now)
    ended_at: datetime | None = None
    messages: list[Message] = []
    evaluation: Evaluation | None = None

