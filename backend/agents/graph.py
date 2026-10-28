from .participants import PARTICIPANTS, response_for
from app.models import Message


def next_agent_message(
    topic: str,
    messages: list[Message],
    agent_index: int,
    round_number: int,
    target_role: str = "General",
    difficulty: str = "Intermediate",
) -> Message:
    participant = PARTICIPANTS[agent_index]
    content = response_for(
        participant=participant,
        topic=topic,
        messages=messages,
        target_role=target_role,
        difficulty=difficulty,
        round_number=round_number,
    )
    return Message(speaker=participant.name, role="assistant", content=content, round=round_number)

