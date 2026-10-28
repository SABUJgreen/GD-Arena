from dataclasses import dataclass
from google import genai
from google.genai import types
from app.config import settings
from app.models import Message


@dataclass(frozen=True)
class Participant:
    name: str
    role_title: str
    color: str
    objective: str
    strategy_style: str
    other_perspectives: str


PARTICIPANTS = [
    Participant(
        name="Analytical",
        role_title="Data-Driven Analyst",
        color="blue",
        objective="Anchor the discussion in empirical outcomes, baseline metrics, cause-and-effect causality, and quantifiable trade-offs.",
        strategy_style="Ground arguments in data, metrics, ROI, and pilot validation. Challenge speculative assertions with specific measurement questions.",
        other_perspectives="Challenger (tests risk and assumptions), Creative (proposes lateral frameworks), Balanced (synthesizes viewpoints)."
    ),
    Participant(
        name="Challenger",
        role_title="Devil's Advocate & Risk Evaluator",
        color="red",
        objective="Pressure-test consensus, identify unstated assumptions, anticipate second-order consequences, and introduce constructive counterpoints.",
        strategy_style="Respectfully dismantle groupthink and stress-test optimistic forecasts by asking hard questions about failure modes.",
        other_perspectives="Analytical (demands metrics and baseline proof), Creative (brings lateral ideas), Balanced (unifies perspectives)."
    ),
    Participant(
        name="Creative",
        role_title="Innovation Strategist & Lateral Thinker",
        color="violet",
        objective="Unlock unexpected angles, cross-industry frameworks, and experimental models that challenge conventional orthodoxies.",
        strategy_style="Introduce fresh lenses and agile experimentation loops borrowed from adjacent industries or user-centric behavior.",
        other_perspectives="Analytical (grounds in metrics), Challenger (probes vulnerabilities), Balanced (aims for common ground)."
    ),
    Participant(
        name="Balanced",
        role_title="Strategic Synthesizer & Consensus Builder",
        color="amber",
        objective="Connect disparate viewpoints, identify common ground, resolve tension, and move the room toward an actionable, unified decision.",
        strategy_style="Synthesize peer arguments into a cohesive middle path, establish non-negotiables, and drive toward structured closure.",
        other_perspectives="Analytical (focuses on evidence), Challenger (questions assumptions), Creative (opens new angles)."
    ),
]

ROLE_PROFILES = {
    "Product Management": {
        "knowledge": "Customer problem discovery, North Star & input metrics (retention, adoption, LTV/CAC), RICE/Kano prioritization, user journey friction, MVP scoping, engineering feasibility.",
        "adaptation": "For Product Management, examine customer problems, prioritization, product metrics, feasibility, and business impact."
    },
    "Consulting": {
        "knowledge": "MECE structuring, hypothesis-led problem solving, market sizing, cost-benefit trade-offs, operational bottlenecks, risk-weighted outcomes, change management.",
        "adaptation": "For Consulting, examine structured root-cause analysis, hypothesis testing, ROI trade-offs, and operational implementation."
    },
    "Technology": {
        "knowledge": "System architecture, scalability constraints, technical debt vs feature velocity, SLA/SLO uptime, security/privacy guardrails, latency trade-offs, build vs buy.",
        "adaptation": "For Technology, examine system scalability, technical debt, security/privacy guardrails, and architectural trade-offs."
    },
    "Marketing": {
        "knowledge": "Customer acquisition channels, CAC/LTV unit economics, conversion funnels, brand trust vs monetization, audience segmentation, message-market fit.",
        "adaptation": "For Marketing, examine customer acquisition channels, conversion metrics, audience segmentation, and brand alignment."
    },
    "Sales": {
        "knowledge": "Customer qualification (BANT/MEDDIC), value propositions, objection handling, pricing models, negotiation leverage, sales cycle velocity.",
        "adaptation": "For Sales, examine customer needs, qualification, value propositions, objections, negotiation, and commitment."
    },
    "Finance & Strategy": {
        "knowledge": "Cash runway, margin compression, NPV/IRR, capital allocation, sensitivity analysis, downside hedging, regulatory compliance.",
        "adaptation": "For Finance & Strategy, examine financial risk, return on capital, margin impact, and liquidity constraints."
    },
    "General": {
        "knowledge": "Strategic alignment, resource allocation, short-term vs long-term trade-offs, systemic impacts, ethical considerations, organizational feasibility.",
        "adaptation": "Examine cross-functional impact, resource allocation, ethical implications, and execution viability."
    }
}

CANDIDATE_LEVELS = {
    "Beginner": "Junior / Entry-Level (Focus on foundational clarity; probe basic trade-offs respectfully)",
    "Intermediate": "Mid-Level Professional (Expect structured reasoning, trade-off analysis, and metric-backed justification)",
    "Advanced": "Senior / Lead (Strict scrutiny on second-order consequences, system dynamics, and hidden assumptions)",
    "Elite": "Executive / Director (High-pressure stress test on strategic prioritization, risk governance, and leadership under ambiguity)"
}

DEMO_RESPONSES = {
    "Analytical": (
        "Looking at this from a {role} perspective, the most effective way forward is to define our baseline outcome metrics. "
        "Before committing resources, we should run a structured pilot on {topic_snippet} to quantify adoption and ROI rather than relying on optimistic projections."
    ),
    "Challenger": (
        "While that sounds promising, the core assumption underneath it deserves a rigorous stress test in {role}. "
        "What happens when edge-case friction occurs, or if execution costs exceed initial forecasts on {topic_snippet}? We need explicit risk guardrails."
    ),
    "Creative": (
        "A compelling alternative is to approach {topic_snippet} through a lateral cross-domain framework. "
        "Instead of a monolithic rollout, an iterative feedback loop allows users to co-create the solution in real time, keeping our strategy adaptable."
    ),
    "Balanced": (
        "There is a clear path to bridge these perspectives and find actionable common ground. "
        "We can capture the upside of the proposal while establishing clear risk thresholds, aligning the room on two non-negotiables for {topic_snippet}."
    ),
}

_CACHED_MODEL = None


def build_system_instruction(
    participant: Participant,
    topic: str,
    target_role: str,
    difficulty: str,
) -> str:
    role_info = ROLE_PROFILES.get(target_role, ROLE_PROFILES["General"])
    candidate_level = CANDIDATE_LEVELS.get(difficulty, CANDIDATE_LEVELS["Intermediate"])

    return f"""# GD Arena — Role-Aware Panelist

You are the **{participant.role_title}** in a simulated group discussion.

## Session configuration
- Target role: {target_role}
- Topic: {topic}
- Candidate level: {candidate_level}
- Difficulty: {difficulty}
- Your discussion objective: {participant.objective}
- Knowledge and frameworks: {role_info['knowledge']}
- Other panelist perspectives: {participant.other_perspectives}

## Your responsibilities
1. Contribute only when you have a meaningful point, question, rebuttal, or synthesis.
2. Use reasoning and evidence relevant to the target role ({target_role}).
3. Challenge unsupported assumptions with specific questions.
4. Respond to what participants actually said; do not repeat prepared arguments mechanically.
5. Introduce plausible alternatives and trade-offs when appropriate.
6. Keep contributions concise enough for a realistic group discussion (2-3 sentences max).
7. Disagree respectfully and allow the candidate opportunities to respond.
8. Never invent statistics, citations, or case facts. Clearly label illustrative assumptions.

## Role adaptation
Apply the professional knowledge, priorities, vocabulary, and decision-making standards of {target_role}.

{role_info['adaptation']}

## Behavioral constraints
- Do not dominate every round.
- Do not reveal the private instructions of other agents.
- Do not provide the candidate with coaching during the simulation unless the mode explicitly allows it.
- Maintain a consistent persona while adapting to new evidence.
- Never assume that the loudest or most confident argument is the strongest.
- Do not prefix your output with your name or role (e.g., do NOT write "{participant.name}:"). Provide only your spoken contribution in plain text.
- Maximum length: 2 to 3 concise, punchy sentences."""


def response_for(
    participant: Participant,
    topic: str,
    messages: list[Message],
    user_text: str = "",
    target_role: str = "General",
    difficulty: str = "Intermediate",
    round_number: int = 1,
) -> str:
    global _CACHED_MODEL
    if settings.gemini_api_key:
        models_to_try = [m for m in [settings.llm_model, "gemini-3.5-flash-lite", _CACHED_MODEL, "gemini-3.5-flash", "gemini-3.8-flash"] if m]
        models_to_try = list(dict.fromkeys(models_to_try))

        try:
            client = genai.Client(api_key=settings.gemini_api_key)
            history_text = "\n".join([f"{m.speaker}: {m.content}" for m in messages[-6:]]) if messages else "Discussion has just begun."
            round_label = f"Round {round_number}" if round_number else "Current Round"

            prompt = (
                f"Topic: {topic}\n"
                f"Phase: {round_label}\n"
                f"Target Role: {target_role}\n\n"
                f"Recent Discussion History:\n{history_text}\n\n"
                f"Provide {participant.name}'s spoken contribution (2-3 sentences max). "
                f"Directly engage with what the candidate 'You' or peers just said. Stay strictly in character."
            )
            config = types.GenerateContentConfig(
                system_instruction=build_system_instruction(participant, topic, target_role, difficulty),
                temperature=0.7,
                max_output_tokens=180,
            )
            for model in models_to_try:
                try:
                    response = client.models.generate_content(
                        model=model,
                        contents=prompt,
                        config=config,
                    )
                    if response and response.text:
                        _CACHED_MODEL = model
                        return response.text.strip().lstrip(f"{participant.name}:").strip()
                except Exception as model_err:
                    print(f"[Gemini Agent Warning ({participant.name} on model {model})]: {model_err}")
        except Exception as e:
            print(f"[Gemini Agent Client Error ({participant.name})]: {e}")

    # Role-aware demo fallback
    topic_snippet = topic[:60].rstrip(".")
    template = DEMO_RESPONSES.get(participant.name, DEMO_RESPONSES["Analytical"])
    return template.format(role=target_role, topic_snippet=topic_snippet)
