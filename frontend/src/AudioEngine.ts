export type SoundType =
  | "white"
  | "pink"
  | "brown"
  | "rain"
  | "ocean"
  | "space"
  | "forest"
  | "blue"
  | "violet";

export class AudioEngine {
  ctx: AudioContext | null = null;
  nodes: Map<SoundType, { source: AudioNode | null; gain: GainNode }> =
    new Map();
  masterGain: GainNode | null = null;
  isPlaying = false;

  init() {
    if (!this.ctx) {
      this.ctx = new (
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext
      )();

      this.analyser = this.ctx.createAnalyser();
      this.analyser.fftSize = 256;
      this.analyser.smoothingTimeConstant = 0.8;

      this.masterGain = this.ctx.createGain();
      this.masterGain.connect(this.analyser);
      this.analyser.connect(this.ctx.destination);

      [
        "white",
        "pink",
        "brown",
        "rain",
        "ocean",
        "space",
        "forest",
        "blue",
        "violet",
      ].forEach((type) => {
        const gain = this.ctx!.createGain();
        gain.gain.value = 0; // Start muted
        gain.connect(this.masterGain!);
        this.nodes.set(type as SoundType, { source: null, gain });
      });
    }
    if (this.ctx.state === "suspended") {
      this.ctx.resume();
    }
  }

  createNoise(type: "white" | "pink" | "brown"): AudioBufferSourceNode {
    const bufferSize = this.ctx!.sampleRate * 2;
    const buffer = this.ctx!.createBuffer(1, bufferSize, this.ctx!.sampleRate);
    const data = buffer.getChannelData(0);

    let lastOut = 0;
    let b0 = 0,
      b1 = 0,
      b2 = 0,
      b3 = 0,
      b4 = 0,
      b5 = 0,
      b6 = 0;

    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;

      if (type === "white") {
        data[i] = white;
      } else if (type === "pink") {
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.969 * b2 + white * 0.153852;
        b3 = 0.8665 * b3 + white * 0.3104856;
        b4 = 0.55 * b4 + white * 0.5329522;
        b5 = -0.7616 * b5 - white * 0.016898;
        data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
        b6 = white * 0.115926;
      } else if (type === "brown") {
        data[i] = (lastOut + 0.02 * white) / 1.02;
        lastOut = data[i];
        data[i] *= 3.5;
      }
    }

    const source = this.ctx!.createBufferSource();
    source.buffer = buffer;
    source.loop = true;
    return source;
  }

  startSound(type: SoundType) {
    const nodeData = this.nodes.get(type);
    if (!nodeData || !this.ctx) return;

    if (nodeData.source) {
      (nodeData.source as AudioBufferSourceNode | OscillatorNode).stop?.();
      nodeData.source.disconnect();
    }

    let source: AudioNode;

    if (type === "white") {
      const noise = this.createNoise("white");
      const filter = this.ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.value = 10000;
      noise.connect(filter);
      source = filter;
      nodeData.source = noise;
      noise.start();
    } else if (type === "pink") {
      const noise = this.createNoise("pink");
      const filter = this.ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.value = 8000;
      noise.connect(filter);
      source = filter;
      nodeData.source = noise;
      noise.start();
    } else if (type === "brown") {
      const noise = this.createNoise("brown");
      const filter = this.ctx.createBiquadFilter();
      filter.type = "highpass";
      filter.frequency.value = 10;
      noise.connect(filter);
      source = filter;
      nodeData.source = noise;
      noise.start();
    } else if (type === "rain") {
      const noise = this.createNoise("pink");
      const filter = this.ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.value = 1200;
      noise.connect(filter);
      source = filter;
      nodeData.source = noise;
      noise.start();
    } else if (type === "ocean") {
      const noise = this.createNoise("brown");
      const lfo = this.ctx.createOscillator();
      lfo.type = "sine";
      lfo.frequency.value = 0.1;
      const lfoGain = this.ctx.createGain();
      lfoGain.gain.value = 0.5;
      lfo.connect(lfoGain.gain);
      noise.connect(lfoGain);
      source = lfoGain;
      nodeData.source = noise;
      noise.start();
      lfo.start();
    } else if (type === "space") {
      const noise = this.createNoise("brown");
      const filter = this.ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.value = 200;
      const lfo = this.ctx.createOscillator();
      lfo.type = "sine";
      lfo.frequency.value = 0.05;
      const lfoGain = this.ctx.createGain();
      lfoGain.gain.value = 0.5;
      noise.connect(filter);
      filter.connect(lfoGain);
      lfo.connect(lfoGain.gain);
      source = lfoGain;
      nodeData.source = noise;
      noise.start();
      lfo.start();
    } else if (type === "forest") {
      const noise = this.createNoise("pink");
      const filter1 = this.ctx.createBiquadFilter();
      filter1.type = "lowpass";
      filter1.frequency.value = 3000;
      const filter2 = this.ctx.createBiquadFilter();
      filter2.type = "highpass";
      filter2.frequency.value = 500;
      const lfo = this.ctx.createOscillator();
      lfo.type = "sine";
      lfo.frequency.value = 0.2;
      const lfoGain = this.ctx.createGain();
      lfoGain.gain.value = 0.7;
      noise.connect(filter1);
      filter1.connect(filter2);
      filter2.connect(lfoGain);
      lfo.connect(lfoGain.gain);
      source = lfoGain;
      nodeData.source = noise;
      noise.start();
      lfo.start();
    } else if (type === "blue") {
      const noise = this.createNoise("white");
      const filter = this.ctx.createBiquadFilter();
      filter.type = "highpass";
      filter.frequency.value = 2000;
      noise.connect(filter);
      source = filter;
      nodeData.source = noise;
      noise.start();
    } else if (type === "violet") {
      const bufferSize = this.ctx.sampleRate * 2;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      let lastW = 0;
      for (let i = 0; i < bufferSize; i++) {
        const w = Math.random() * 2 - 1;
        data[i] = (w - lastW) * 0.5;
        lastW = w;
      }
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;
      noise.loop = true;
      source = noise;
      nodeData.source = noise;
      noise.start();
    } else {
      const noise = this.createNoise("white");
      source = noise;
      nodeData.source = noise;
      noise.start();
    }

    source.connect(nodeData.gain);
  }

  setVolume(type: SoundType, volume: number) {
    const nodeData = this.nodes.get(type);
    if (nodeData) {
      nodeData.gain.gain.setTargetAtTime(
        volume / 100,
        this.ctx?.currentTime || 0,
        0.1,
      );
      if (volume > 0 && !nodeData.source && this.isPlaying) {
        this.startSound(type);
      }
    }
  }

  playAll(volumes: Record<SoundType, number>) {
    this.isPlaying = true;
    this.init();
    Object.entries(volumes).forEach(([type, vol]) => {
      this.startSound(type as SoundType);
      this.setVolume(type as SoundType, vol);
    });
  }

  stopAll() {
    this.isPlaying = false;
    this.nodes.forEach((nodeData) => {
      if (nodeData.source) {
        (nodeData.source as AudioBufferSourceNode | OscillatorNode).stop?.();
        nodeData.source.disconnect();
        nodeData.source = null;
      }
      nodeData.gain.gain.value = 0;
    });
  }
}
