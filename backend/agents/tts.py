import base64
from google import genai
from google.genai import types
from app.config import settings

# Dedicated voice profiles tailored to each discussion persona
PERSONA_VOICES = {
    "Analytical": "Puck",     # Precise, crisp, data-grounded tone
    "Challenger": "Fenrir",   # Bold, deeper, assertive tone
    "Creative": "Aoede",      # Expressive, melodious, dynamic tone
    "Balanced": "Kore",       # Warm, calm, diplomatic tone
}

_CACHED_TTS_MODEL = None


def synthesize_participant_speech(text: str, speaker: str = "Analytical") -> str | None:
    """
    Synthesizes speech for an AI participant response using Gemini TTS.
    Defaults to gemini-3.8-flash-lite-tts-preview (with alias fallback).
    Returns a data URI string ('data:audio/wav;base64,...') or None on failure.
    """
    global _CACHED_TTS_MODEL

    if not settings.gemini_api_key or not text or not text.strip():
        return None

    voice_name = PERSONA_VOICES.get(speaker, "Puck")

    models_to_try = [
        m for m in [
            _CACHED_TTS_MODEL,
            settings.tts_model,
            "gemini-3.8-flash-lite-tts-preview",
            "gemini-3.8-flash-lite-tts",
            "gemini-3.8-flash-tts",
            "gemini-2.5-flash-preview-tts",
        ] if m
    ]
    models_to_try = list(dict.fromkeys(models_to_try))

    clean_text = text.strip().strip('"').strip("'")
    if not clean_text:
        return None

    try:
        client = genai.Client(api_key=settings.gemini_api_key)
        config = types.GenerateContentConfig(
            response_modalities=["AUDIO"],
            speech_config=types.SpeechConfig(
                voice_config=types.VoiceConfig(
                    prebuilt_voice_config=types.PrebuiltVoiceConfig(
                        voice_name=voice_name
                    )
                )
            ),
        )

        for model in models_to_try:
            try:
                resp = client.models.generate_content(
                    model=model,
                    contents=clean_text,
                    config=config,
                )
                if resp and resp.candidates and resp.candidates[0].content:
                    for part in resp.candidates[0].content.parts:
                        if hasattr(part, "inline_data") and part.inline_data and part.inline_data.data:
                            audio_bytes = part.inline_data.data
                            mime = part.inline_data.mime_type or "audio/wav"
                            b64 = base64.b64encode(audio_bytes).decode("utf-8")
                            _CACHED_TTS_MODEL = model
                            return f"data:{mime};base64,{b64}"
            except Exception as model_err:
                print(f"[Gemini TTS Warning ({speaker} on model {model})]: {model_err}")
                continue
    except Exception as e:
        print(f"[Gemini TTS Client Error ({speaker})]: {e}")

    return None

