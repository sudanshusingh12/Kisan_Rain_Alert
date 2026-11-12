"""
Integration Tests for Flask REST API Endpoints
"""

import pytest
import sys
import json
from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parent.parent / "backend"
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from app import create_app

@pytest.fixture
def client():
    app = create_app()
    app.config["TESTING"] = True
    with app.test_client() as client:
        yield client

def test_health_endpoint(client):
    """GET /api/health returns 200 and healthy status."""
    res = client.get("/api/health")
    assert res.status_code == 200
    data = res.get_json()
    assert data["status"] == "healthy"
    assert "Kisan Rain Alert" in data["service"]

def test_get_farms_endpoint(client):
    """GET /api/farms returns farm list."""
    res = client.get("/api/farms")
    assert res.status_code == 200
    data = res.get_json()
    assert "farms" in data
    assert len(data["farms"]) >= 1

def test_add_farm_validation(client):
    """POST /api/farms enforces India boundary validation."""
    # Invalid coordinates (outside India: London coords 51.5°N, 0.12°W)
    invalid_farm = {
        "user_id": "test-user-1",
        "farm_name": "Invalid Out-of-bounds Farm",
        "latitude": 51.5074,
        "longitude": -0.1278
    }
    res = client.post("/api/farms", json=invalid_farm)
    assert res.status_code == 400
    assert "outside Indian boundaries" in res.get_json()["error"]

    # Valid Indian coordinates (Nashik)
    valid_farm = {
        "user_id": "test-user-1",
        "farm_name": "Godavari Acres",
        "village": "Niphad, Nashik",
        "latitude": 20.08,
        "longitude": 74.10,
        "crop_type": "Grapes"
    }
    res_ok = client.post("/api/farms", json=valid_farm)
    assert res_ok.status_code == 201
    assert res_ok.get_json()["farm"]["farm_name"] == "Godavari Acres"

def test_simulate_alert_endpoint(client):
    """POST /api/alerts/test executes deterministic rule pipeline."""
    res = client.post("/api/alerts/test", json={"user_id": "a0000000-0000-0000-0000-000000000001"})
    assert res.status_code == 200
    data = res.get_json()
    assert "alert" in data
    assert data["alert"]["rainfall_category"] == "Moderate Rain"
    assert any(data["sms_status"].startswith(s) for s in ("delivered", "simulated", "failed", "disabled"))

def test_user_registration_and_authentication(client):
    """POST /api/register and POST /api/login validate credentials and hashed storage."""
    import uuid
    test_email = f"suresh_{uuid.uuid4().hex[:6]}@kisanrain.org"

    # 1. Reject invalid password length (< 6 chars)
    short_pw_res = client.post("/api/register", json={
        "full_name": "Suresh Patil",
        "email": test_email,
        "phone": "+919876500001",
        "password": "123"
    })
    assert short_pw_res.status_code == 400
    assert "at least 6 characters" in short_pw_res.get_json()["error"]

    # 2. Successful registration
    reg_res = client.post("/api/register", json={
        "full_name": "Suresh Patil",
        "email": test_email,
        "phone": "+919876500001",
        "password": "secure_password_123"
    })
    assert reg_res.status_code == 201
    user_data = reg_res.get_json()["user"]
    assert user_data["email"] == test_email
    assert "password_hash" not in user_data  # Never leak password hash

    # 3. Duplicate email prevention
    dup_res = client.post("/api/register", json={
        "full_name": "Suresh Patil 2",
        "email": test_email,
        "phone": "+919876500002",
        "password": "secure_password_123"
    })
    assert dup_res.status_code == 409
    assert "already registered" in dup_res.get_json()["error"]

    # 4. Failed login with wrong password
    bad_login = client.post("/api/login", json={
        "email": test_email,
        "password": "wrong_password"
    })
    assert bad_login.status_code == 401

    # 5. Successful login with correct credentials
    good_login = client.post("/api/login", json={
        "email": test_email,
        "password": "secure_password_123"
    })
    assert good_login.status_code == 200
    assert good_login.get_json()["user"]["full_name"] == "Suresh Patil"
    assert "token" in good_login.get_json()

    # 6. Profile fetch
    user_id = good_login.get_json()["user"]["id"]
    profile_res = client.get(f"/api/profile?user_id={user_id}")
    assert profile_res.status_code == 200
    assert profile_res.get_json()["profile"]["email"] == test_email


