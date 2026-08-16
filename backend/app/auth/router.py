from urllib.parse import urlparse

import httpx
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import BaseModel

from app.config import settings

router = APIRouter()


class UserRegister(BaseModel):
    email: str
    password: str
    name: str | None = None


def _get_fake_origin() -> str:
    parsed = urlparse(settings.NEON_AUTH_BASE_URL)
    return f"{parsed.scheme}://{parsed.netloc}"


def _check_auth_configured():
    if not settings.NEON_AUTH_BASE_URL:
        raise HTTPException(status_code=500, detail="NEON_AUTH_BASE_URL not configured")


@router.post("/register")
async def register_user(user: UserRegister):
    """
    Proxies registration to Neon Auth (email + password sign-up).
    """
    _check_auth_configured()
    url = f"{settings.NEON_AUTH_BASE_URL}/sign-up/email"
    async with httpx.AsyncClient() as client:
        res = await client.post(
            url,
            json={"email": user.email, "password": user.password, "name": user.name},
            headers={"Origin": _get_fake_origin()},
        )
        if res.status_code >= 400:
            raise HTTPException(status_code=res.status_code, detail=res.text)
        return res.json()


@router.post("/token")
async def login_for_access_token(
    form_data: OAuth2PasswordRequestForm = Depends(),
):
    """
    Signs in via Neon Auth and returns a JWT (not just a session token).
    The JWT is obtained by:
      1. Signing in with email/password to get a session cookie.
      2. Calling the /token endpoint with that session cookie to get the JWT.
    """
    _check_auth_configured()
    fake_origin = _get_fake_origin()

    async with httpx.AsyncClient() as client:
        # Step 1: Sign in to get a session cookie
        sign_in_url = f"{settings.NEON_AUTH_BASE_URL}/sign-in/email"
        sign_in_res = await client.post(
            sign_in_url,
            json={"email": form_data.username, "password": form_data.password},
            headers={"Origin": fake_origin},
        )

        if sign_in_res.status_code >= 400:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=f"Neon Auth sign-in failed ({sign_in_res.status_code}): {sign_in_res.text}",
                headers={"WWW-Authenticate": "Bearer"},
            )

        # Step 2: Use the session cookie to get the JWT from Neon's /token endpoint
        session_cookies = sign_in_res.cookies
        token_url = f"{settings.NEON_AUTH_BASE_URL}/token"
        token_res = await client.get(
            token_url,
            cookies=session_cookies,
            headers={"Origin": fake_origin},
        )

        if token_res.status_code >= 400:
            raise HTTPException(
                status_code=500,
                detail=f"Could not retrieve JWT from Neon Auth: {token_res.text}",
            )

        # The /token endpoint returns {"token": "<jwt>"}
        token_data = token_res.json()
        jwt_token = token_data.get("token")

        if not jwt_token:
            raise HTTPException(
                status_code=500,
                detail="Neon Auth did not return a JWT token",
            )

        return {"access_token": jwt_token, "token_type": "bearer"}
