from sqlalchemy.orm import Session

from app.models.models import User


def get_or_create_public_user(db: Session) -> User:
    user = db.query(User).filter(User.email == "public@researchhub.local").first()
    if user:
        return user

    user = User(
        name="Public Workspace",
        email="public@researchhub.local",
        hashed_password="disabled",
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user
