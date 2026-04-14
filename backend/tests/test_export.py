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
        "attachment; filename=noise-mix-5s.wav"
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
    payload = {"tracks": [{"type": "white", "volume": 0.5}], "duration_seconds": 4000}
    response = client.post("/api/v1/export", json=payload)
    assert response.status_code == 400
    assert response.json()["detail"] == "Duration too long. Max 3600s."


def test_export_invalid_track_type():
    # The code says if type is unknown, it uses zeros.
    # Let's verify it still returns 200 but maybe check if it's silent?
    # Or should it be an error? Current implementation uses np.zeros.
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
    types = ["white", "pink", "brown", "rain", "ocean"]
    for t in types:
        payload = {"tracks": [{"type": t, "volume": 0.5}], "duration_seconds": 1}
        response = client.post("/api/v1/export", json=payload)
        assert response.status_code == 200


def test_export_zero_duration():
    payload = {"tracks": [{"type": "white", "volume": 0.5}], "duration_seconds": 0}
    response = client.post("/api/v1/export", json=payload)
    # Depending on implementation, this might fail or return an empty WAV.
    # In the code: num_samples = int(sample_rate * 0) = 0.
    # mix = np.zeros(0).
    # wave module might complain about 0 frames.
    assert response.status_code == 200 or response.status_code == 400


def test_export_negative_duration():
    payload = {"tracks": [{"type": "white", "volume": 0.5}], "duration_seconds": -5}
    response = client.post("/api/v1/export", json=payload)
    # int(44100 * -5) = -220500.
    # np.zeros(-220500) will raise ValueError.
    assert response.status_code == 400
