import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach } from "vitest";
import App from "./App";
import "@testing-library/jest-dom";

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

(window as unknown as { AudioContext: typeof MockAudioContext }).AudioContext =
  MockAudioContext;

describe("App", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.fetch = vi.fn();
    window.URL.createObjectURL = vi.fn(() => "blob:url");
    window.URL.revokeObjectURL = vi.fn();
  });

  it("renders correctly", () => {
    render(<App />);
    expect(screen.getByText(/Focus/)).toBeInTheDocument();
    expect(screen.getByText(/Mixer/)).toBeInTheDocument();
    expect(screen.getByText("Export 10m Loop (WAV)")).toBeInTheDocument();
  });

  it("renders all noise types", () => {
    render(<App />);
    const expectedTypes = [
      "Smooth White Noise",
      "Smooth Pink Noise",
      "Deep Brown Noise",
      "Light Rain",
      "Ocean Waves",
      "Deep Space",
      "Forest Wind",
      "Blue Noise",
      "Violet Noise",
    ];
    expectedTypes.forEach((type) => {
      expect(screen.getByText(type)).toBeInTheDocument();
    });
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
    (window.fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      blob: vi
        .fn()
        .mockResolvedValue(new Blob(["test"], { type: "audio/wav" })),
    });

    render(<App />);

    // At least one sound must be on for export to work (pink is on by default at 50%)
    const exportButton = screen.getByText("Export 10m Loop (WAV)");
    fireEvent.click(exportButton);

    expect(screen.getByText("Exporting Mix...")).toBeInTheDocument();

    await waitFor(() => {
      expect(window.fetch).toHaveBeenCalledWith(
        "http://localhost:8000/api/v1/export",
        expect.objectContaining({
          method: "POST",
          body: expect.stringContaining('"type":"pink"'),
        }),
      );
    });

    expect(screen.getByText("Export 10m Loop (WAV)")).toBeInTheDocument();
  });

  it("shows error if export fails", async () => {
    vi.spyOn(window, "alert").mockImplementation(() => {});
    (window.fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: false,
    });

    render(<App />);
    const exportButton = screen.getByText("Export 10m Loop (WAV)");
    fireEvent.click(exportButton);

    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith("Error exporting mix");
    });
  });

  it("updates volumes", () => {
    render(<App />);
    const sliders = screen.getAllByRole("slider");
    // Change Ocean Waves slider (index 4)
    fireEvent.change(sliders[4], { target: { value: "75" } });

    expect(screen.getByText("75%")).toBeInTheDocument();
  });
});
