"""
Shared pytest fixtures for ESG Copilot tests.

Uses an in-memory SQLite database (aiosqlite) so no Docker/Postgres needed.
Each test gets a fresh database — full isolation.
"""

import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker

from app.main import app
from app.core.database import Base, get_db

# ── In-memory SQLite engine ────────────────────────────────────────────────────
TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"


@pytest_asyncio.fixture(scope="function")
async def db_engine():
    """Create a fresh in-memory DB engine per test."""
    engine = create_async_engine(
        TEST_DATABASE_URL,
        connect_args={"check_same_thread": False},
    )
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield engine
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    await engine.dispose()


@pytest_asyncio.fixture(scope="function")
async def db_session(db_engine):
    """Yield a single AsyncSession for the test, rolled back after."""
    session_factory = async_sessionmaker(db_engine, expire_on_commit=False)
    async with session_factory() as session:
        yield session


@pytest_asyncio.fixture(scope="function")
async def client(db_engine):
    """
    HTTP test client with the DB dependency overridden to use the test engine.
    Each request gets its own session from the test engine.
    """
    session_factory = async_sessionmaker(db_engine, expire_on_commit=False)

    async def override_get_db():
        async with session_factory() as session:
            yield session

    app.dependency_overrides[get_db] = override_get_db

    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test",
    ) as ac:
        yield ac

    app.dependency_overrides.clear()


# ── Convenience fixtures ───────────────────────────────────────────────────────

@pytest_asyncio.fixture
async def registered_user(client):
    """Register a user and return their credentials."""
    payload = {
        "email": "test@example.com",
        "password": "TestPass123!",
        "full_name": "Test User",
    }
    resp = await client.post("/api/v1/auth/register", json=payload)
    assert resp.status_code == 201, resp.text
    return payload


@pytest_asyncio.fixture
async def auth_headers(client, registered_user):
    """Log in and return Authorization headers."""
    resp = await client.post(
        "/api/v1/auth/login",
        data={
            "username": registered_user["email"],
            "password": registered_user["password"],
        },
    )
    assert resp.status_code == 200, resp.text
    token = resp.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


@pytest_asyncio.fixture
async def company(client, auth_headers):
    """Create a company and return its data."""
    payload = {
        "name": "Test SME ApS",
        "industry_code": "technology",
        "country_code": "DK",
        "employee_count": 25,
        "revenue_eur": 2000000,
    }
    resp = await client.post("/api/v1/companies", json=payload, headers=auth_headers)
    assert resp.status_code == 201, resp.text
    return resp.json()


@pytest_asyncio.fixture
async def submission(client, auth_headers, company):
    """Create a submission for the company."""
    resp = await client.post(
        f"/api/v1/companies/{company['company_id']}/submissions",
        json={"reporting_year": 2024},
        headers=auth_headers,
    )
    assert resp.status_code == 201, resp.text
    return resp.json()
