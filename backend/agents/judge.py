from app.models import Evaluation


TOPICS = {
    "General": "Should cities make public transport free for everyone?",
    "Technology": "Should companies be allowed to monitor productivity through employee software?",
    "Marketing": "Is personalization worth the privacy trade-off in modern marketing?",
    "Product Management": "When should a product team stop adding features and focus on reliability?",
    "Consulting": "Should governments prioritize economic growth over environmental targets during a slowdown?",
}


def choose_topic(category: str, custom_topic: str | None) -> str:
    return custom_topic.strip() if custom_topic and custom_topic.strip() else TOPICS.get(category, "Does convenience make society more resilient or more dependent?")


def evaluate(messages) -> Evaluation:
    user_messages = [m for m in messages if m.role == "user"]
    participation = min(96, 45 + len(user_messages) * 16)
    content = min(94, 60 + sum(len(m.content.split()) > 12 for m in user_messages) * 8)
    scores = {"content": content, "reasoning": min(95, content + 3), "communication": 84, "relevance": 88, "critical_thinking": 81, "counter_arguments": 78, "participation": participation, "leadership": min(92, participation + 2), "conciseness": 86}
    overall = round(sum(scores.values()) / len(scores))
    return Evaluation(overall_score=overall, scores=scores, strengths=["You contributed clear, relevant points.", "Your ideas stayed connected to the central question."], weaknesses=["Invite the room to build on your strongest point.", "Use one sharper example when making a claim."], recommendations=["Lead with your conclusion, then support it with one reason.", "Name the trade-off before proposing a solution.", "Close a turn by connecting back to the group’s emerging consensus."])
