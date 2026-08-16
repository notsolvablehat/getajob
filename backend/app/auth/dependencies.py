import base64

import httpx
import jwt as pyjwt
from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PublicKey
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer

from app.config import settings

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/token")

jwks_cache: list = []


async def get_jwks() -> list:
    global jwks_cache
    if not jwks_cache:
        # Neon Auth JWKS is at {base_url}/.well-known/jwks.json
        jwks_url = f"{settings.NEON_AUTH_BASE_URL}/.well-known/jwks.json"
        async with httpx.AsyncClient() as client:
            try:
                response = await client.get(jwks_url)
                response.raise_for_status()
                data = response.json()
                jwks_cache = data.get("keys", [])
            except Exception as e:
                raise HTTPException(
                    status_code=500, detail=f"Could not fetch JWKS: {e}"
                )
    return jwks_cache


def _build_ed25519_key(jwk: dict) -> Ed25519PublicKey:
    """Reconstruct an Ed25519 public key from a JWK with kty=OKP."""
    # Add padding if needed for base64url decoding
    x_b64 = jwk["x"]
    padding = 4 - len(x_b64) % 4
    if padding != 4:
        x_b64 += "=" * padding
    x_bytes = base64.urlsafe_b64decode(x_b64)
    return Ed25519PublicKey.from_public_bytes(x_bytes)


async def get_current_user(token: str = Depends(oauth2_scheme)) -> str:
    keys = await get_jwks()

    # Try to match by kid from the token header
    try:
        unverified_header = pyjwt.get_unverified_header(token)
    except pyjwt.exceptions.DecodeError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid token header: {e}",
            headers={"WWW-Authenticate": "Bearer"},
        )

    kid = unverified_header.get("kid")

    # Find the matching key; fall back to first key if no kid match
    matching_jwk = next((k for k in keys if k.get("kid") == kid), None)
    if matching_jwk is None and keys:
        matching_jwk = keys[0]

    if matching_jwk is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="No public keys available from Neon Auth",
            headers={"WWW-Authenticate": "Bearer"},
        )

    try:
        kty = matching_jwk.get("kty", "")
        if kty == "OKP":
            # EdDSA (Ed25519) — used by Neon Auth
            public_key = _build_ed25519_key(matching_jwk)
            payload = pyjwt.decode(
                token,
                public_key,
                algorithms=["EdDSA"],
                options={"verify_aud": False},
            )
        elif kty == "RSA":
            # Fallback for RS256 keys
            from jwt.algorithms import RSAAlgorithm

            public_key = RSAAlgorithm.from_jwk(matching_jwk)
            payload = pyjwt.decode(
                token,
                public_key,
                algorithms=["RS256"],
                options={"verify_aud": False},
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=f"Unsupported JWK key type: {kty}",
            )

        user_id = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid token: missing sub")
        return user_id

    except pyjwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except pyjwt.PyJWTError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Could not validate credentials: {e}",
            headers={"WWW-Authenticate": "Bearer"},
        )
