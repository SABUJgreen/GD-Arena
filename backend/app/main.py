import asyncio
import base64
import hashlib
import hmac
import os
from datetime import timedelta
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException, Response, Cookie, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from jose import jwt, JWTError
from pydantic import BaseModel, EmailStr, Field
from google import genai
from google.genai import types
from .config import settings
from .models import DiscussionCreate, Message
from .repository import repo
from agents.judge import choose_topic, evaluate
from agents.graph import next_agent_message
from agents.participants import PARTICIPANTS
from agents.tts import synthesize_participant_speech

app = FastAPI(title="GD Arena API")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_origin_regex=r"https?://(localhost|127\.0\.0\.1)(:\d+)?",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
def hash_password(password: str) -> str:
    salt = os.urandom(16)
    digest = hashlib.pbkdf2_hmac("sha256", password.encode(), salt, 310_000)
    return f"pbkdf2_sha256$310000${base64.urlsafe_b64encode(salt).decode()}${base64.urlsafe_b64encode(digest).decode()}"


def verify_password(password: str, stored: str) -> bool:
    try:
        scheme, rounds, salt_text, digest_text = stored.split("$", 3)
        if scheme != "pbkdf2_sha256":
            return False
        salt = base64.urlsafe_b64decode(salt_text.encode())
        expected = base64.urlsafe_b64decode(digest_text.encode())
        actual = hashlib.pbkdf2_hmac("sha256", password.encode(), salt, int(rounds))
        return hmac.compare_digest(actual, expected)
    except (ValueError, TypeError):
        return False


class AuthPayload(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=72)
    name: str = ""


def token_for(user: dict) -> str:
    return jwt.encode({"sub": user["id"], "email": user["email"], "name": user["name"]}, settings.jwt_secret, algorithm="HS256")


def current_user(token: str | None):
    if not token:
        return {"id": "demo-user", "email": "demo@gdarena.app", "name": "Demo User"}
    try:
        return jwt.decode(token, settings.jwt_secret, algorithms=["HS256"])
    except JWTError:
        raise HTTPException(401, "Your session has expired.")


@app.get("/api/health")
def health():
    return {"status": "ok", "mode": "demo" if not settings.gemini_api_key else "gemini"}


@app.post("/api/speech/transcribe")
async def transcribe_speech(file: UploadFile = File(...)):
    audio_bytes = await file.read()
    if not audio_bytes:
        return {"text": ""}

    if settings.gemini_api_key:
        try:
            client = genai.Client(api_key=settings.gemini_api_key)
            mime_type = file.content_type or "audio/webm"
            if "webm" in mime_type:
                mime_type = "audio/webm"
            elif "wav" in mime_type:
                mime_type = "audio/wav"
            elif "ogg" in mime_type:
                mime_type = "audio/ogg"
            elif "mp4" in mime_type or "m4a" in mime_type:
                mime_type = "audio/mp4"

            models_to_try = [settings.llm_model, "gemini-3.5-flash-lite", "gemini-3.5-transcribe", "gemini-3.8-flash"]
            models_to_try = list(dict.fromkeys([m for m in models_to_try if m]))

            for model in models_to_try:
                try:
                    res = client.models.generate_content(
                        model=model,
                        contents=[
                            types.Part.from_bytes(data=audio_bytes, mime_type=mime_type),
                            "Transcribe the user's spoken words in this audio into text accurately for a group discussion arena. Return ONLY the verbatim transcribed spoken words. Do NOT include quotation marks, disclaimers, or explanations. If no speech is heard or if silent, reply with nothing."
                        ],
                    )
                    transcription = (res.text or "").strip().strip('"').strip("'")
                    cleaned_letters = "".join([c for c in transcription if c.isalpha()])
                    if not cleaned_letters or transcription in ["[SILENCE]", "[silence]", "None", "No speech detected.", ""]:
                        return {"text": ""}
                    return {"text": transcription}
                except Exception:
                    continue
        except Exception:
            pass

    return {"text": ""}


class TTSPayload(BaseModel):
    text: str
    speaker: str = "Analytical"


@app.post("/api/speech/synthesize")
async def synthesize_speech_endpoint(payload: TTSPayload):
    audio_uri = await asyncio.to_thread(synthesize_participant_speech, payload.text, payload.speaker)
    return {"audio": audio_uri, "speaker": payload.speaker}


@app.post("/api/auth/register")
def register(payload: AuthPayload, response: Response):
    if repo.get_user(payload.email):
        raise HTTPException(409, "An account with that email already exists.")
    user = repo.create_user(payload.email, payload.name or payload.email.split("@")[0], hash_password(payload.password))
    response.set_cookie("gd_token", token_for(user), httponly=True, samesite="lax")
    return {"user": {"id": user["id"], "email": user["email"], "name": user["name"]}}


@app.post("/api/auth/login")
def login(payload: AuthPayload, response: Response):
    user = repo.get_user(payload.email)
    if not user or not verify_password(payload.password, user["password"]):
        raise HTTPException(401, "Invalid email or password.")
    response.set_cookie("gd_token", token_for(user), httponly=True, samesite="lax")
    return {"user": {"id": user["id"], "email": user["email"], "name": user["name"]}}


@app.post("/api/auth/logout")
def logout(response: Response):
    response.delete_cookie("gd_token")
    return {"ok": True}


@app.post("/api/discussions")
def create_discussion(payload: DiscussionCreate, gd_token: str | None = Cookie(default=None)):
    user = current_user(gd_token)
    discussion = repo.create_discussion(user["sub"] if "sub" in user else user["id"], topic=choose_topic(payload.category, payload.custom_topic), category=payload.category, difficulty=payload.difficulty, duration=payload.duration)
    return discussion.model_dump(mode="json")


@app.get("/api/discussions/{session_id}")
def get_discussion(session_id: str):
    discussion = repo.get(session_id)
    if not discussion: raise HTTPException(404, "Discussion not found.")
    return discussion.model_dump(mode="json")


@app.get("/api/discussions/{session_id}/messages")
def get_messages(session_id: str):
    discussion = repo.get(session_id)
    if not discussion: raise HTTPException(404, "Discussion not found.")
    return [m.model_dump(mode="json") for m in discussion.messages]


@app.get("/api/discussions/{session_id}/evaluation")
def get_evaluation(session_id: str):
    discussion = repo.get(session_id)
    if not discussion: raise HTTPException(404, "Discussion not found.")
    return discussion.evaluation.model_dump() if discussion.evaluation else None


@app.get("/api/history")
def history(gd_token: str | None = Cookie(default=None)):
    user = current_user(gd_token)
    user_id = user.get("sub", user.get("id"))
    return [d.model_dump(mode="json") for d in repo.history(user_id)]


async def send_agent(ws: WebSocket, session_id: str, agent_index: int, round_number: int):
    discussion = repo.get(session_id)
    if not discussion: return
    speaker_name = PARTICIPANTS[agent_index].name
    await ws.send_json({"type": "thinking", "speaker": speaker_name})
    await asyncio.sleep(0.45)
    message = next_agent_message(
        discussion.topic,
        discussion.messages,
        agent_index,
        round_number,
        target_role=discussion.category,
        difficulty=discussion.difficulty,
    )
    # Synthesize participant speech using gemini-3.8-flash-lite-tts-preview
    try:
        audio_uri = await asyncio.to_thread(synthesize_participant_speech, message.content, speaker_name)
        message.audio = audio_uri
    except Exception as e:
        print(f"[TTS Generation Error ({speaker_name})]: {e}")
        message.audio = None

    repo.add_message(session_id, message)
    await ws.send_json({"type": "message", "message": message.model_dump(mode="json")})


async def wait_for_reading_ack(ws: WebSocket, timeout_seconds: float = 65.0):
    """Waits for client to finish reading agent thought (60s timer or continue click)."""
    try:
        await asyncio.wait_for(ws.receive_json(), timeout=timeout_seconds)
    except asyncio.TimeoutError:
        pass


@app.websocket("/ws/discussions/{session_id}")
async def discussion_socket(ws: WebSocket, session_id: str):
    await ws.accept()
    discussion = repo.get(session_id)
    if not discussion:
        await ws.send_json({"type": "error", "message": "Discussion not found."}); await ws.close(); return
    try:
        await ws.send_json({"type": "session", "topic": discussion.topic, "participants": [p.name for p in PARTICIPANTS]})
        for round_number in range(1, 3):
            for agent_index in [0, 1]:
                await send_agent(ws, session_id, agent_index, round_number)
                await wait_for_reading_ack(ws, 65.0)
            await ws.send_json({"type": "user_turn", "round": round_number})
            user_payload = await ws.receive_json()
            while user_payload.get("action") == "reading_done":
                user_payload = await ws.receive_json()
            content = str(user_payload.get("content", "")).strip()
            if not content: continue
            user_message = Message(speaker="You", role="user", content=content, round=round_number)
            repo.add_message(session_id, user_message)
            await ws.send_json({"type": "message", "message": user_message.model_dump(mode="json")})
            for agent_index in [2, 3]:
                await send_agent(ws, session_id, agent_index, round_number)
                await wait_for_reading_ack(ws, 65.0)
            await ws.send_json({"type": "user_turn", "round": round_number})
            user_payload = await ws.receive_json()
            while user_payload.get("action") == "reading_done":
                user_payload = await ws.receive_json()
            content = str(user_payload.get("content", "")).strip()
            if content:
                user_message = Message(speaker="You", role="user", content=content, round=round_number)
                repo.add_message(session_id, user_message)
                await ws.send_json({"type": "message", "message": user_message.model_dump(mode="json")})
        evaluation = evaluate(repo.get(session_id).messages)
        repo.save_evaluation(session_id, evaluation)
        await ws.send_json({"type": "completed", "evaluation": evaluation.model_dump()})
    except WebSocketDisconnect:
        return
    except Exception:
        await ws.send_json({"type": "error", "message": "The discussion encountered an issue. Please try again."})
