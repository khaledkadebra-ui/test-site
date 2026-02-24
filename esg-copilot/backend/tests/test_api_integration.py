"""
HTTP integration tests — full user journey.

Covers: register → login → company → submission → data input →
        completeness → submit → calculate-preview → score-preview → report trigger

No Docker needed — uses the in-memory SQLite fixture from conftest.py.
Run: pytest tests/test_api_integration.py -v
"""

import pytest


# ── Auth ───────────────────────────────────────────────────────────────────────

class TestAuth:
    async def test_health_check(self, client):
        resp = await client.get("/health")
        assert resp.status_code == 200
        data = resp.json()
        assert data["status"] == "healthy"
        assert "version" in data

    async def test_register_success(self, client):
        resp = await client.post("/api/v1/auth/register", json={
            "email": "new@example.com",
            "password": "Secure123!",
            "full_name": "New User",
        })
        assert resp.status_code == 201
        data = resp.json()
        assert data["email"] == "new@example.com"
        assert "user_id" in data

    async def test_register_duplicate_email(self, client, registered_user):
        resp = await client.post("/api/v1/auth/register", json={
            "email": registered_user["email"],
            "password": "Another123!",
            "full_name": "Duplicate",
        })
        assert resp.status_code == 409

    async def test_login_success(self, client, registered_user):
        resp = await client.post("/api/v1/auth/login", data={
            "username": registered_user["email"],
            "password": registered_user["password"],
        })
        assert resp.status_code == 200
        data = resp.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"

    async def test_login_wrong_password(self, client, registered_user):
        resp = await client.post("/api/v1/auth/login", data={
            "username": registered_user["email"],
            "password": "wrongpassword",
        })
        assert resp.status_code == 401

    async def test_me_requires_auth(self, client):
        resp = await client.get("/api/v1/auth/me")
        assert resp.status_code == 401

    async def test_me_returns_current_user(self, client, auth_headers, registered_user):
        resp = await client.get("/api/v1/auth/me", headers=auth_headers)
        assert resp.status_code == 200
        assert resp.json()["email"] == registered_user["email"]


# ── Companies ─────────────────────────────────────────────────────────────────

class TestCompanies:
    async def test_create_company(self, client, auth_headers):
        resp = await client.post("/api/v1/companies", json={
            "name": "Acme A/S",
            "industry_code": "manufacturing",
            "country_code": "DK",
            "employee_count": 50,
            "revenue_eur": 5000000,
        }, headers=auth_headers)
        assert resp.status_code == 201
        data = resp.json()
        assert data["name"] == "Acme A/S"
        assert "company_id" in data

    async def test_get_company(self, client, auth_headers, company):
        resp = await client.get(f"/api/v1/companies/{company['company_id']}", headers=auth_headers)
        assert resp.status_code == 200
        assert resp.json()["name"] == company["name"]

    async def test_create_company_unauthenticated(self, client):
        resp = await client.post("/api/v1/companies", json={
            "name": "Ghost Corp",
            "industry_code": "technology",
            "country_code": "DE",
        })
        assert resp.status_code == 401


# ── Submissions ───────────────────────────────────────────────────────────────

class TestSubmissions:
    async def test_create_submission(self, client, auth_headers, company):
        resp = await client.post(
            f"/api/v1/companies/{company['company_id']}/submissions",
            json={"reporting_year": 2024},
            headers=auth_headers,
        )
        assert resp.status_code == 201
        data = resp.json()
        assert data["reporting_year"] == 2024
        assert data["status"] == "incomplete"

    async def test_duplicate_submission_year_rejected(self, client, auth_headers, company):
        await client.post(
            f"/api/v1/companies/{company['company_id']}/submissions",
            json={"reporting_year": 2024},
            headers=auth_headers,
        )
        resp = await client.post(
            f"/api/v1/companies/{company['company_id']}/submissions",
            json={"reporting_year": 2024},
            headers=auth_headers,
        )
        assert resp.status_code == 409

    async def test_save_energy_data(self, client, auth_headers, submission):
        resp = await client.patch(
            f"/api/v1/submissions/{submission['submission_id']}/energy",
            json={
                "electricity_kwh": 80000,
                "natural_gas_m3": 5000,
                "diesel_liters": 2000,
                "renewable_electricity_pct": 30,
            },
            headers=auth_headers,
        )
        assert resp.status_code == 200
        data = resp.json()
        assert float(data["electricity_kwh"]) == 80000

    async def test_save_travel_data(self, client, auth_headers, submission):
        resp = await client.patch(
            f"/api/v1/submissions/{submission['submission_id']}/travel",
            json={
                "air_short_haul_km": 15000,
                "air_long_haul_km": 8000,
                "rail_km": 3000,
            },
            headers=auth_headers,
        )
        assert resp.status_code == 200

    async def test_save_procurement_data(self, client, auth_headers, submission):
        resp = await client.patch(
            f"/api/v1/submissions/{submission['submission_id']}/procurement",
            json={
                "purchased_goods_spend_eur": 200000,
                "supplier_count": 12,
                "has_supplier_code_of_conduct": True,
            },
            headers=auth_headers,
        )
        assert resp.status_code == 200

    async def test_save_policy_data(self, client, auth_headers, submission):
        resp = await client.patch(
            f"/api/v1/submissions/{submission['submission_id']}/policies",
            json={
                "has_esg_policy": True,
                "has_data_privacy_policy": True,
                "has_code_of_conduct": True,
                "has_health_safety_policy": True,
                "has_anti_corruption_policy": False,
                "has_net_zero_target": True,
                "net_zero_target_year": 2040,
            },
            headers=auth_headers,
        )
        assert resp.status_code == 200


# ── Completeness + Submit ──────────────────────────────────────────────────────

class TestCompletenessAndSubmit:
    async def _fill_submission(self, client, auth_headers, submission):
        """Helper: fill all required sections."""
        sub_id = submission["submission_id"]
        await client.patch(f"/api/v1/submissions/{sub_id}/energy", json={
            "electricity_kwh": 80000, "natural_gas_m3": 5000,
            "renewable_electricity_pct": 30,
        }, headers=auth_headers)
        await client.patch(f"/api/v1/submissions/{sub_id}/policies", json={
            "has_esg_policy": True, "has_data_privacy_policy": True,
            "has_health_safety_policy": True, "has_code_of_conduct": True,
        }, headers=auth_headers)

    async def test_completeness_incomplete(self, client, auth_headers, submission):
        resp = await client.get(
            f"/api/v1/submissions/{submission['submission_id']}/completeness",
            headers=auth_headers,
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["is_complete"] is False
        assert data["completion_pct"] < 100

    async def test_completeness_after_filling(self, client, auth_headers, submission):
        await self._fill_submission(client, auth_headers, submission)
        resp = await client.get(
            f"/api/v1/submissions/{submission['submission_id']}/completeness",
            headers=auth_headers,
        )
        assert resp.status_code == 200
        assert resp.json()["is_complete"] is True

    async def test_submit_blocked_when_incomplete(self, client, auth_headers, submission):
        resp = await client.post(
            f"/api/v1/submissions/{submission['submission_id']}/submit",
            headers=auth_headers,
        )
        assert resp.status_code == 422

    async def test_submit_success_when_complete(self, client, auth_headers, submission):
        await self._fill_submission(client, auth_headers, submission)
        resp = await client.post(
            f"/api/v1/submissions/{submission['submission_id']}/submit",
            headers=auth_headers,
        )
        assert resp.status_code == 200
        assert resp.json()["status"] == "submitted"


# ── Preview Endpoints ─────────────────────────────────────────────────────────

class TestPreviews:
    async def _setup_submission(self, client, auth_headers, submission):
        sub_id = submission["submission_id"]
        await client.patch(f"/api/v1/submissions/{sub_id}/energy", json={
            "electricity_kwh": 80000,
            "natural_gas_m3": 5000,
            "diesel_liters": 2000,
            "renewable_electricity_pct": 30,
        }, headers=auth_headers)
        await client.patch(f"/api/v1/submissions/{sub_id}/travel", json={
            "air_short_haul_km": 15000,
        }, headers=auth_headers)
        await client.patch(f"/api/v1/submissions/{sub_id}/policies", json={
            "has_esg_policy": True, "has_data_privacy_policy": True,
            "has_health_safety_policy": True, "has_code_of_conduct": True,
        }, headers=auth_headers)

    async def test_calculate_preview(self, client, auth_headers, submission):
        await self._setup_submission(client, auth_headers, submission)
        resp = await client.get(
            f"/api/v1/submissions/{submission['submission_id']}/calculate-preview",
            headers=auth_headers,
        )
        assert resp.status_code == 200
        data = resp.json()
        assert "scope1_co2e_tonnes" in data
        assert "scope2_co2e_tonnes" in data
        assert "scope3_co2e_tonnes" in data
        assert "total_co2e_tonnes" in data
        assert data["total_co2e_tonnes"] > 0

    async def test_score_preview(self, client, auth_headers, submission):
        await self._setup_submission(client, auth_headers, submission)
        resp = await client.get(
            f"/api/v1/submissions/{submission['submission_id']}/score-preview",
            headers=auth_headers,
        )
        assert resp.status_code == 200
        data = resp.json()
        assert "esg_score_total" in data
        assert "esg_rating" in data
        assert 0 <= data["esg_score_total"] <= 100

    async def test_calculate_preview_returns_source_citations(self, client, auth_headers, submission):
        await self._setup_submission(client, auth_headers, submission)
        resp = await client.get(
            f"/api/v1/submissions/{submission['submission_id']}/calculate-preview",
            headers=auth_headers,
        )
        data = resp.json()
        # Each breakdown line should have a source citation
        for line in data.get("scope1_breakdown", {}).values():
            if isinstance(line, dict):
                assert "source" in line


# ── Report Generation ─────────────────────────────────────────────────────────

class TestReports:
    async def _submit_full(self, client, auth_headers, submission):
        sub_id = submission["submission_id"]
        await client.patch(f"/api/v1/submissions/{sub_id}/energy", json={
            "electricity_kwh": 80000, "natural_gas_m3": 5000,
            "renewable_electricity_pct": 30,
        }, headers=auth_headers)
        await client.patch(f"/api/v1/submissions/{sub_id}/policies", json={
            "has_esg_policy": True, "has_data_privacy_policy": True,
            "has_health_safety_policy": True, "has_code_of_conduct": True,
        }, headers=auth_headers)
        await client.post(
            f"/api/v1/submissions/{sub_id}/submit",
            headers=auth_headers,
        )

    async def test_generate_report_blocked_if_not_submitted(self, client, auth_headers, submission):
        resp = await client.post("/api/v1/reports/generate", json={
            "submission_id": submission["submission_id"],
            "include_ai_narrative": False,
        }, headers=auth_headers)
        assert resp.status_code == 422

    async def test_generate_report_creates_record(self, client, auth_headers, submission):
        await self._submit_full(client, auth_headers, submission)
        resp = await client.post("/api/v1/reports/generate", json={
            "submission_id": submission["submission_id"],
            "include_ai_narrative": False,
        }, headers=auth_headers)
        assert resp.status_code == 202
        data = resp.json()
        assert "report_id" in data
        assert data["status"] in ("processing", "completed")

    async def test_report_status_endpoint(self, client, auth_headers, submission):
        await self._submit_full(client, auth_headers, submission)
        gen = await client.post("/api/v1/reports/generate", json={
            "submission_id": submission["submission_id"],
            "include_ai_narrative": False,
        }, headers=auth_headers)
        report_id = gen.json()["report_id"]

        resp = await client.get(f"/api/v1/reports/{report_id}/status", headers=auth_headers)
        assert resp.status_code == 200
        assert "status" in resp.json()
