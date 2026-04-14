from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from pydantic import BaseModel
from typing import List
import numpy as np
from scipy import signal
import io
import wave

app = FastAPI(title="Noise-Man API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class TrackConfig(BaseModel):
    type: str  # white, pink, brown, rain, ocean, space, forest
    volume: float  # 0.0 to 1.0

class ExportRequest(BaseModel):
    tracks: List[TrackConfig]
    duration_seconds: int

def apply_lowpass(data: np.ndarray, cutoff: float, fs: int = 44100, order: int = 4) -> np.ndarray:
    nyq = 0.5 * fs
    normal_cutoff = cutoff / nyq
    b, a = signal.butter(order, normal_cutoff, btype='low', analog=False)
    return signal.filtfilt(b, a, data)

def apply_highpass(data: np.ndarray, cutoff: float, fs: int = 44100, order: int = 4) -> np.ndarray:
    nyq = 0.5 * fs
    normal_cutoff = cutoff / nyq
    b, a = signal.butter(order, normal_cutoff, btype='high', analog=False)
    return signal.filtfilt(b, a, data)

def generate_white(num_samples: int) -> np.ndarray:
    # Smoother white noise using a mild lowpass to remove harsh digital highs
    noise = np.random.uniform(-1.0, 1.0, num_samples)
    return apply_lowpass(noise, 10000)

def generate_pink(num_samples: int) -> np.ndarray:
    b0 = b1 = b2 = b3 = b4 = b5 = b6 = 0.0
    pink = np.zeros(num_samples)
    white = np.random.uniform(-1.0, 1.0, num_samples)
    for i in range(num_samples):
        b0 = 0.99886 * b0 + white[i] * 0.0555179
        b1 = 0.99332 * b1 + white[i] * 0.0750759
        b2 = 0.96900 * b2 + white[i] * 0.1538520
        b3 = 0.86650 * b3 + white[i] * 0.3104856
        b4 = 0.55000 * b4 + white[i] * 0.5329522
        b5 = -0.7616 * b5 - white[i] * 0.0168980
        pink[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white[i] * 0.5362
        b6 = white[i] * 0.115926
    
    pink = apply_lowpass(pink, 8000)
    max_val = np.max(np.abs(pink))
    if max_val > 0:
        pink = pink / max_val
    return pink * 0.5

def generate_brown(num_samples: int) -> np.ndarray:
    white = np.random.uniform(-1.0, 1.0, num_samples)
    brown = np.cumsum(white)
    # Filter out DC offset
    brown = apply_highpass(brown, 10)
    max_val = np.max(np.abs(brown))
    if max_val > 0:
        brown = brown / max_val
    return brown

def generate_rain(num_samples: int) -> np.ndarray:
    # Rain: Pink noise with 1000Hz lowpass for distant thunder/rain feel
    base_pink = generate_pink(num_samples)
    return apply_lowpass(base_pink, 1200)

def generate_ocean(num_samples: int, sample_rate: int = 44100) -> np.ndarray:
    base_brown = generate_brown(num_samples)
    t = np.linspace(0, num_samples / sample_rate, num_samples)
    # Exactly matches loop cycles for 10-minute videos
    lfo = (np.sin(2 * np.pi * 0.1 * t) + 1) / 2
    lfo = 0.2 + (lfo * 0.8)
    return base_brown * lfo

def generate_space(num_samples: int, sample_rate: int = 44100) -> np.ndarray:
    # Deep space: heavily lowpassed brown noise with very slow modulation
    base = generate_brown(num_samples)
    base = apply_lowpass(base, 200)
    t = np.linspace(0, num_samples / sample_rate, num_samples)
    lfo = (np.sin(2 * np.pi * 0.05 * t) + 1) / 2
    return base * (0.5 + lfo * 0.5)

def generate_forest(num_samples: int, sample_rate: int = 44100) -> np.ndarray:
    # Forest: Mid-focused pink noise for wind, plus some subtle noise
    base = generate_pink(num_samples)
    base = apply_lowpass(base, 3000)
    base = apply_highpass(base, 500)
    # Wind gusts
    t = np.linspace(0, num_samples / sample_rate, num_samples)
    lfo = (np.sin(2 * np.pi * 0.2 * t) + 1) / 2
    return base * (0.3 + lfo * 0.7)

@app.post("/api/v1/export")
def export_mix(req: ExportRequest) -> Response:
    # Increased to 10 minutes (600s) for loopable Youtube videos
    if req.duration_seconds > 600:
        raise HTTPException(status_code=400, detail="Duration too long. Max 600s.")
    if not req.tracks:
        raise HTTPException(status_code=400, detail="No tracks provided.")
        
    sample_rate = 44100
    num_samples = int(sample_rate * req.duration_seconds)
    mix = np.zeros(num_samples)
    
    for track in req.tracks:
        if track.volume <= 0:
            continue
            
        if track.type == "white":
            data = generate_white(num_samples)
        elif track.type == "pink":
            data = generate_pink(num_samples)
        elif track.type == "brown":
            data = generate_brown(num_samples)
        elif track.type == "rain":
            data = generate_rain(num_samples)
        elif track.type == "ocean":
            data = generate_ocean(num_samples, sample_rate)
        elif track.type == "space":
            data = generate_space(num_samples, sample_rate)
        elif track.type == "forest":
            data = generate_forest(num_samples, sample_rate)
        else:
            data = np.zeros(num_samples)
            
        mix += data * track.volume
        
    # Prevent clipping globally with soft clipping
    mix = np.tanh(mix)
    
    # Apply global crossfade for perfect looping (10 seconds fade)
    fade_samples = min(sample_rate * 10, num_samples // 2)
    if fade_samples > 0:
        fade_in = np.linspace(0, 1, fade_samples)
        fade_out = np.linspace(1, 0, fade_samples)
        mix[:fade_samples] *= fade_in
        mix[-fade_samples:] *= fade_out
        
    # Convert to 16-bit PCM
    samples_int16 = np.int16(mix * 32767)
    
    wav_io = io.BytesIO()
    with wave.open(wav_io, 'wb') as wav_file:
        wav_file.setnchannels(1)
        wav_file.setsampwidth(2)
        wav_file.setframerate(sample_rate)
        wav_file.writeframes(samples_int16.tobytes())
        
    return Response(
        content=wav_io.getvalue(), 
        media_type="audio/wav",
        headers={"Content-Disposition": f"attachment; filename=loopable-mix-{req.duration_seconds}s.wav"}
    )
