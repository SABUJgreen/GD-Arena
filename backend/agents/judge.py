import json
from google import genai
from google.genai import types
from app.config import settings
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

    if settings.gemini_api_key:
        try:
            client = genai.Client(api_key=settings.gemini_api_key)
            transcript = "\n".join([f"{m.speaker}: {m.content}" for m in messages])
            prompt = (
                "You are an expert GD Judge evaluating candidate 'You' in a group discussion.\n"
                "Transcript:\n"
                f"{transcript}\n\n"
                "Score 'You' from 0-100 on these 9 dimensions: content, reasoning, communication, relevance, critical_thinking, counter_arguments, participation, leadership, conciseness.\n"
                "Return JSON with: overall_score (int), scores (dict of 9 ints), strengths (list of 2-3 str), weaknesses (list of 2-3 str), recommendations (list of 3 str)."
            )
            config = types.GenerateContentConfig(
                temperature=0.2,
                response_mime_type="application/json",
            )
            res = client.models.generate_content(
                model=settings.llm_model,
                contents=prompt,
                config=config,
            )
            if res and res.text:
                data = json.loads(res.text)
                return Evaluation(
                    overall_score=int(data.get("overall_score", 85)),
                    scores=data.get("scores", {}),
                    strengths=data.get("strengths", []),
                    weaknesses=data.get("weaknesses", []),
                    recommendations=data.get("recommendations", []),
                )
        except Exception as e:
            print(f"[Gemini Judge Error]: {e}")

    participation = min(96, 45 + len(user_messages) * 16)
    content = min(94, 60 + sum(len(m.content.split()) > 12 for m in user_messages) * 8)
    scores = {"content": content, "reasoning": min(95, content + 3), "communication": 84, "relevance": 88, "critical_thinking": 81, "counter_arguments": 78, "participation": participation, "leadership": min(92, participation + 2), "conciseness": 86}
    overall = round(sum(scores.values()) / len(scores))
    return Evaluation(overall_score=overall, scores=scores, strengths=["You contributed clear, relevant points.", "Your ideas stayed connected to the central question."], weaknesses=["Invite the room to build on your strongest point.", "Use one sharper example when making a claim."], recommendations=["Lead with your conclusion, then support it with one reason.", "Name the trade-off before proposing a solution.", "Close a turn by connecting back to the group’s emerging consensus."])
