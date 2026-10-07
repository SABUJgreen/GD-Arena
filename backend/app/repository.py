import json
from pathlib import Path
from uuid import uuid4
from .models import Discussion, Message, Evaluation, now


class Repository:
    def __init__(self):
        self.discussions: dict[str, Discussion] = {}
        self.users: dict[str, dict] = {}
        self.users_file = Path(__file__).resolve().parents[1] / "data" / "users.json"
        self._load_users()

    def _load_users(self):
        try:
            if self.users_file.exists():
                self.users = json.loads(self.users_file.read_text(encoding="utf-8"))
        except (OSError, json.JSONDecodeError):
            self.users = {}

    def _save_users(self):
        self.users_file.parent.mkdir(parents=True, exist_ok=True)
        self.users_file.write_text(json.dumps(self.users, indent=2), encoding="utf-8")

    def create_user(self, email: str, name: str, password: str) -> dict:
        user = {"id": str(uuid4()), "email": email, "name": name, "password": password}
        self.users[email] = user
        self._save_users()
        return user

    def get_user(self, email: str):
        return self.users.get(email)

    def create_discussion(self, user_id: str, **kwargs) -> Discussion:
        discussion = Discussion(id=str(uuid4()), user_id=user_id, **kwargs)
        self.discussions[discussion.id] = discussion
        return discussion

    def get(self, session_id: str) -> Discussion | None:
        return self.discussions.get(session_id)

    def add_message(self, session_id: str, message: Message):
        if session := self.get(session_id):
            session.messages.append(message)

    def save_evaluation(self, session_id: str, evaluation: Evaluation):
        if session := self.get(session_id):
            session.evaluation = evaluation
            session.status = "completed"
            session.ended_at = now()

    def history(self, user_id: str):
        return sorted((d for d in self.discussions.values() if d.user_id == user_id), key=lambda d: d.started_at, reverse=True)


repo = Repository()
