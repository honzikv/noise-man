import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach } from "vitest";
import App from "./App";

// Mock AudioContext and related classes
class MockAudioContext {
  state = "suspended";
  createGain = vi.fn(() => ({
    gain: { value: 0, setTargetAtTime: vi.fn() },
    connect: vi.fn(),
  }));
  createBuffer = vi.fn(() => ({
    getChannelData: vi.fn(() => new Float32Array(100)),
  }));
  createBufferSource = vi.fn(() => ({
    start: vi.fn(),
    stop: vi.fn(),
    connect: vi.fn(),
    disconnect: vi.fn(),
    loop: false,
    buffer: null,
  }));
  createBiquadFilter = vi.fn(() => ({
    type: "lowpass",
    frequency: { value: 1000 },
    connect: vi.fn(),
  }));
  createOscillator = vi.fn(() => ({
    type: "sine",
    frequency: { value: 0.1 },
    start: vi.fn(),
    stop: vi.fn(),
    connect: vi.fn(),
  }));
  resume = vi.fn().mockResolvedValue(undefined);
  destination = {};
  sampleRate = 44100;
  currentTime = 0;
}

(window as any).AudioContext = MockAudioContext;

describe("App", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
    global.URL.createObjectURL = vi.fn(() => "blob:url");
    global.URL.revokeObjectURL = vi.fn();
  });

  it("renders correctly", () => {
    render(<App />);
    expect(screen.getByText(/Focus/)).toBeInTheDocument();
    expect(screen.getByText(/Mixer/)).toBeInTheDocument();
    expect(screen.getByText("Export 1m WAV File")).toBeInTheDocument();
  });

  it("toggles playback", () => {
    render(<App />);
    const playButton = screen.getByRole("button", { name: /Master Play/i });
    fireEvent.click(playButton);
    expect(screen.getByText("Playing Mix")).toBeInTheDocument();

    fireEvent.click(playButton);
    expect(screen.getByText("Master Play")).toBeInTheDocument();
  });

  it("calls export API when export button is clicked", async () => {
    (global.fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      blob: vi
        .fn()
        .mockResolvedValue(new Blob(["test"], { type: "audio/wav" })),
    });

    render(<App />);

    // We need at least one track with volume > 0.
    // By default, Pink Noise is 50%.
    const exportButton = screen.getByText("Export 1m WAV File");
    fireEvent.click(exportButton);

    expect(screen.getByText("Exporting Mix...")).toBeInTheDocument();

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "http://localhost:8000/api/v1/export",
        expect.objectContaining({
          method: "POST",
          body: expect.stringContaining('"type":"pink"'),
        }),
      );
    });

    expect(screen.getByText("Export 1m WAV File")).toBeInTheDocument();
  });

  it("shows error if export fails", async () => {
    vi.spyOn(window, "alert").mockImplementation(() => {});
    (global.fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: false,
    });

    render(<App />);
    const exportButton = screen.getByText("Export 1m WAV File");
    fireEvent.click(exportButton);

    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith("Error exporting mix");
    });
  });
});
