from typing import TypedDict
from app.models import Message


class DiscussionState(TypedDict, total=False):
    topic: str
    messages: list[Message]
    current_speaker: str
    round_number: int
    max_rounds: int
    discussion_summary: str
    user_arguments: list[str]
    agent_arguments: list[str]
    discussion_active: bool
