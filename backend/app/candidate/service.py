import json

from asyncpg import Connection

from app.candidate.schemas import CandidateProfileUpdate


async def get_profile(conn: Connection, user_id: str) -> dict | None:
    query = """
        SELECT * FROM candidate_profiles 
        WHERE user_id = $1::uuid
    """
    row = await conn.fetchrow(query, user_id)
    if row:
        d = dict(row)
        if isinstance(d.get("skills"), str):
            d["skills"] = json.loads(d["skills"])
        return d
    return None


async def upsert_profile(
    conn: Connection, user_id: str, profile_data: CandidateProfileUpdate
) -> dict:
    # First, check if the profile exists
    existing = await get_profile(conn, user_id)

    data_dict = profile_data.model_dump(exclude_unset=True)
    if "skills" in data_dict and data_dict["skills"] is not None:
        data_dict["skills"] = json.dumps(data_dict["skills"])

    if existing:
        # Update
        if not data_dict:
            return existing

        set_clauses = []
        values = []
        for i, (key, value) in enumerate(data_dict.items(), start=1):
            set_clauses.append(f"{key} = ${i}")
            values.append(value)

        values.append(user_id)
        query = f"""
            UPDATE candidate_profiles
            SET {", ".join(set_clauses)}, updated_at = CURRENT_TIMESTAMP
            WHERE user_id = ${len(values)}::uuid
            RETURNING *
        """
        row = await conn.fetchrow(query, *values)
        d = dict(row)
        if isinstance(d.get("skills"), str):
            d["skills"] = json.loads(d["skills"])
        return d
    else:
        # Insert
        columns = ["user_id"]
        placeholders = ["$1::uuid"]
        values = [user_id]

        for i, (key, value) in enumerate(data_dict.items(), start=2):
            columns.append(key)
            placeholders.append(f"${i}")
            values.append(value)

        query = f"""
            INSERT INTO candidate_profiles ({", ".join(columns)})
            VALUES ({", ".join(placeholders)})
            RETURNING *
        """
        row = await conn.fetchrow(query, *values)
        d = dict(row)
        if isinstance(d.get("skills"), str):
            d["skills"] = json.loads(d["skills"])
        return d


async def save_resume_record(
    conn: Connection, user_id: str, filename: str, appwrite_file_id: str
) -> dict:
    # Deactivate older resumes
    await conn.execute(
        "UPDATE resumes SET is_active = FALSE WHERE user_id = $1::uuid", user_id
    )

    query = """
        INSERT INTO resumes (user_id, filename, appwrite_file_id, is_active)
        VALUES ($1::uuid, $2, $3, TRUE)
        RETURNING *
    """
    row = await conn.fetchrow(query, user_id, filename, appwrite_file_id)
    return dict(row)


async def get_active_resume(conn: Connection, user_id: str) -> dict | None:
    query = """
        SELECT * FROM resumes
        WHERE user_id = $1::uuid AND is_active = TRUE
        ORDER BY uploaded_at DESC
        LIMIT 1
    """
    row = await conn.fetchrow(query, user_id)
    if row:
        return dict(row)
    return None
