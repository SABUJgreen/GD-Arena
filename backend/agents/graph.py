from .participants import PARTICIPANTS, response_for
from app.models import Message


def next_agent_message(topic: str, messages: list[Message], agent_index: int, round_number: int) -> Message:
    participant = PARTICIPANTS[agent_index]
    return Message(speaker=participant.name, role="assistant", content=response_for(participant, topic, messages), round=round_number)
