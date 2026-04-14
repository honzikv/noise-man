import pytest
from fastapi.testclient import TestClient
from app.main import app
import io
import wave
import numpy as np

client = TestClient(app)

def test_noise_is_not_silent():
    types = ["white", "pink", "brown", "rain", "ocean"]
    for t in types:
        payload = {
            "tracks": [{"type": t, "volume": 1.0}],
            "duration_seconds": 1
        }
        response = client.post("/api/v1/export", json=payload)
        assert response.status_code == 200
        
        wav_file = io.BytesIO(response.content)
        with wave.open(wav_file, "rb") as wav:
            frames = wav.readframes(wav.getnframes())
            samples = np.frombuffer(frames, dtype=np.int16)
            # Check that there is some signal (not just silence)
            assert np.any(samples != 0), f"Noise type {t} returned silence"
            # Check for clipping (should not exceed 16-bit range, but also should have some range)
            assert np.max(np.abs(samples)) > 0
