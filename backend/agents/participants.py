from dataclasses import dataclass
from app.models import Message


@dataclass(frozen=True)
class Participant:
    name: str
    color: str
    style: str


PARTICIPANTS = [
    Participant("Analytical", "blue", "Use a clear claim, cause-and-effect reasoning, and one concrete signal or example."),
    Participant("Challenger", "red", "Respectfully test the strongest assumption and add a counterpoint."),
    Participant("Creative", "violet", "Introduce a fresh lens or unexpected but relevant example."),
    Participant("Balanced", "amber", "Connect the viewpoints, name common ground, and move toward synthesis."),
]

DEMO_RESPONSES = {
    "Analytical": "The strongest way to frame this is through outcomes. If we define the target audience and the metric we want to shift, the trade-off becomes easier to assess. A practical first step is a small pilot with a clear baseline, then scaling what actually works.",
    "Challenger": "I agree with the direction, but the assumption underneath it deserves a stress test. What happens if adoption is lower than expected, or if the benefit only reaches people who already have an advantage? We should build a guardrail into the decision rather than treating the optimistic case as the default.",
    "Creative": "Another useful lens is to borrow from a different domain: think of this as a feedback loop, not a one-time launch. We could create a lightweight experiment that lets participants shape the solution as they use it. That keeps the idea adaptable without waiting for a perfect plan.",
    "Balanced": "There is a workable middle path here. We can preserve the upside of the proposal while acknowledging the access and execution concerns. I would align on two non-negotiables, run a time-boxed test, and review both the headline result and who benefited from it.",
}


def response_for(participant: Participant, topic: str, messages: list[Message], user_text: str = "") -> str:
    context = user_text or (messages[-1].content if messages else topic)
    return f"{DEMO_RESPONSES[participant.name]} In response to that point about {context[:90].rstrip('.')}, the discussion should stay anchored to the question: {topic}."
