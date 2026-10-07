 # GD Arena: Agent Architecture & System Workflows

GD Arena is a sophisticated group discussion simulator that leverages a multi-agent system to create a high-pressure, realistic environment for professional communication practice.

  ## 1. Project Overview
The goal of GD Arena is to bridge the gap between theoretical knowledge and practical performance. By placing
a user in a room with four distinct AI personas, the system tests their ability to synthesize information,
handle disagreement, and lead a discussion toward a conclusion.

### Technical Stack
**Frontend:** Next.js 14 (App Router), Tailwind CSS, Framer Motion (for animations), Recharts (for analytics).

**Backend:** FastAPI (Python), WebSockets for real-time bi-directional communication.

**Intelligence:** A persona-driven logic layer with an extensible LLM interface (supporting Google Gemini API).

**Persistence:** MongoDB (optional) or a high-performance in-memory repository for session management.

## 2. The Multi-Agent Ecosystem

The "Arena" consists of five active participants: four AI agents and the human user. Each AI agent is governed by a specific persona definition.

### Participant Personas
| Persona | Key Strategy | Psychological Profile |
| :--- | :--- | :--- |
| **Analytical** | Evidence-led & Precise | Focuses on data, cause-and-effect, and concrete metrics. It grounds the discussion in reality. |
| **Challenger** | Pressure Tests Ideas | Respectfully identifies assumptions and introduces counterpoints to prevent groupthink. |
| **Creative** | Unlocks Fresh Angles | Introduces unexpected but relevant examples or different frameworks (e.g., borrowing from other domains). |
| **Balanced** | Synthesizes & Unifies | Connects different viewpoints, identifies common ground, and moves the group toward a synthesis. |

## 3. How the Project Works (System Workflow)

### The Session Lifecycle
1. **Setup:** The user selects a category (e.g., Product Management, Consulting) and difficulty.

2. **Briefing:** The "Judge AI" provides a topic and a strategy briefing (e.g., "Listen -> Claim -> Evidence -> Connect").

3. **Live Discussion:** The WebSocket connection opens, and the turn engine begins.

4. **Evaluation:** Once the rounds are complete, the Judge agent evaluates the transcript and provides a detailed score card.

### The Turn Engine (Deterministic Logic)
The discussion follows a structured, round-based sequence to ensure the user gets maximum exposure to different perspectives:

1. **Phase A:** Agent 1 (Analytical) and Agent 2 (Challenger) speak first to set the baseline and pressure test it.

2. **User Turn 1:** The user is prompted to contribute.

3. **Phase B:** Agent 3 (Creative) and Agent 4 (Balanced) respond, adding new angles and attempting to synthesize.

4. **User Turn 2:** The user responds again, ideally leading the room toward a conclusion.
5. **Cycle Repeat:** This repeats for a set number of rounds (default is 2).

## 4. The Judge AI (The Evaluator)
The Judge is a non-participating agent that monitors the entire transcript. It performs a multidimensional evaluation once the discussion ends.

### Scoring Dimensions
The Judge evaluates the user across **9 core dimensions**:
1. **Content:** Relevance and depth of the points made.
2. **Reasoning:** Logic and trade-off analysis.
3. **Communication:** Pacing, tone, and delivery.
4. **Participation:** Frequency and timing of contributions.
5. **Leadership:** Ability to steer the room and summarize.
6. **Critical Thinking:** Handling of counter-arguments.
7. **Relevance:** Staying anchored to the central topic.
8. **Conciseness:** Impact per word.
9. **Synthesis:** Connecting peer points to their own.

### Feedback Loop
The Judge generates:
- **Impact Score:** A weighted score out of 100.
- **Strengths:** Identifying what the user did well (e.g., "Maintained clear connection to topic").
- **Weaknesses:** Identifying gaps (e.g., "Failed to acknowledge the Challenger's point").
- **Actionable Recommendations:** Specific tasks for the next session (e.g., "Lead with your conclusion first").

## 5. Implementation Modes

### Demo Mode (Default)
When no LLM API key is provided, the agents operate in **Demo Mode**:
- **Responses:** Uses curated, persona-specific response templates that anchor back to the chosen topic.
- **Evaluation:** Uses a heuristic-based scoring algorithm that measures participation and content length/complexity.

### Live Mode (LLM)
When a `GEMINI_API_KEY` is present:
- **Dynamic Agents:** Each persona uses a specialized system prompt to generate unique, context-aware responses using Gemini 2.5 Flash.
- **AI Evaluation:** The Judge uses Gemini with structured JSON output to analyze the nuances of the user's arguments across 9 dimensions and provide detailed feedback.