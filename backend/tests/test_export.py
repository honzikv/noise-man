from fastapi.testclient import TestClient
from app.main import app
import io
import wave

client = TestClient(app)


def test_export_success():
    payload = {
        "tracks": [{"type": "white", "volume": 0.5}, {"type": "pink", "volume": 0.3}],
        "duration_seconds": 5,
    }
    response = client.post("/api/v1/export", json=payload)
    assert response.status_code == 200
    assert response.headers["content-type"] == "audio/wav"
    assert (
        "attachment; filename=loopable-mix-5s.wav"
        in response.headers["content-disposition"]
    )

    # Verify it's a valid WAV file
    wav_file = io.BytesIO(response.content)
    with wave.open(wav_file, "rb") as wav:
        assert wav.getnchannels() == 1
        assert wav.getsampwidth() == 2  # 16-bit
        assert wav.getframerate() == 44100
        # 5 seconds * 44100 samples/sec
        assert wav.getnframes() == 5 * 44100


def test_export_empty_tracks():
    payload = {"tracks": [], "duration_seconds": 5}
    response = client.post("/api/v1/export", json=payload)
    assert response.status_code == 400
    assert response.json()["detail"] == "No tracks provided."


def test_export_duration_too_long():
    payload = {"tracks": [{"type": "white", "volume": 0.5}], "duration_seconds": 601}
    response = client.post("/api/v1/export", json=payload)
    assert response.status_code == 400
    assert response.json()["detail"] == "Duration too long. Max 600s."


def test_export_invalid_track_type():
    # The code says if type is unknown, it uses zeros.
    payload = {
        "tracks": [{"type": "invalid_type", "volume": 0.5}],
        "duration_seconds": 1,
    }
    response = client.post("/api/v1/export", json=payload)
    assert response.status_code == 200
    wav_file = io.BytesIO(response.content)
    with wave.open(wav_file, "rb") as wav:
        frames = wav.readframes(wav.getnframes())
        assert all(b == 0 for b in frames)


def test_export_volume_zero():
    payload = {"tracks": [{"type": "white", "volume": 0.0}], "duration_seconds": 1}
    response = client.post("/api/v1/export", json=payload)
    assert response.status_code == 200
    wav_file = io.BytesIO(response.content)
    with wave.open(wav_file, "rb") as wav:
        frames = wav.readframes(wav.getnframes())
        assert all(b == 0 for b in frames)


def test_all_noise_types():
    types = ["white", "pink", "brown", "rain", "ocean", "space", "forest", "blue", "violet"]
    for t in types:
        payload = {"tracks": [{"type": t, "volume": 0.5}], "duration_seconds": 1}
        response = client.post("/api/v1/export", json=payload)
        assert response.status_code == 200, f"Failed for type {t}"


def test_export_zero_duration():
    payload = {"tracks": [{"type": "white", "volume": 0.5}], "duration_seconds": 0}
    response = client.post("/api/v1/export", json=payload)
    assert response.status_code == 400
    assert response.json()["detail"] == "Duration must be positive."


def test_export_negative_duration():
    payload = {"tracks": [{"type": "white", "volume": 0.5}], "duration_seconds": -5}
    response = client.post("/api/v1/export", json=payload)
    assert response.status_code == 400
    assert response.json()["detail"] == "Duration must be positive."
