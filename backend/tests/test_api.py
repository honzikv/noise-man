import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app


@pytest.mark.anyio
async def test_export_white_noise():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        response = await ac.post(
            "/api/v1/export",
            json={"tracks": [{"type": "white", "volume": 0.5}], "duration_seconds": 1},
        )
    assert response.status_code == 200
    assert response.headers["content-type"] == "audio/wav"
    assert len(response.content) > 0


@pytest.mark.anyio
async def test_export_invalid_duration():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        response = await ac.post(
            "/api/v1/export",
            json={
                "tracks": [{"type": "white", "volume": 0.5}],
                "duration_seconds": 601,
            },
        )
    assert response.status_code == 400
    assert response.json()["detail"] == "Duration too long. Max 600s."


@pytest.mark.anyio
async def test_export_no_tracks():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        response = await ac.post(
            "/api/v1/export", json={"tracks": [], "duration_seconds": 1}
        )
    assert response.status_code == 400
    assert response.json()["detail"] == "No tracks provided."


@pytest.mark.anyio
async def test_export_all_types():
    types = ["white", "pink", "brown", "rain", "ocean", "space", "forest"]
    tracks = [{"type": t, "volume": 0.1} for t in types]
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        response = await ac.post(
            "/api/v1/export", json={"tracks": tracks, "duration_seconds": 2}
        )
    assert response.status_code == 200
    assert response.headers["content-type"] == "audio/wav"
