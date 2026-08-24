from __future__ import annotations


def test_health_ok(client):
    r = client.get("/api/health")
    assert r.status_code == 200
    body = r.json()
    assert body["status"] == "ok"
    assert isinstance(body["groq_configured"], bool)


def test_root_lists_docs(client):
    r = client.get("/")
    assert r.status_code == 200
    assert r.json()["docs"] == "/docs"
