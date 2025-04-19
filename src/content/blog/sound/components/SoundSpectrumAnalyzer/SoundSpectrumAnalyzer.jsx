import React, { useState, useRef, useEffect } from "react";

const SoundSpectrumAnalyzer = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [selectedSound, setSelectedSound] = useState("piano");
  const [viewMode, setViewMode] = useState("spectrum"); // 'spectrum' or 'waveform'
  const [audioBuffer, setAudioBuffer] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const audioContextRef = useRef(null);
  const sourceNodeRef = useRef(null);
  const analyserRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const canvasRef = useRef(null);
  const frameIdRef = useRef(null);

  // Sample audio files for demonstration
  const audioSamples = {
    piano: "/samples/piano_c_major.mp3",
    voice: "/samples/voice_sample.mp3",
    guitar: "/samples/guitar_chord.mp3",
    drums: "/samples/drum_beat.mp3",
    ambient: "/samples/ambient_sound.mp3",
  };

  // Descriptions for each sound type
  const soundDescriptions = {
    piano:
      "Piano features concentrated energy in the fundamental frequencies and harmonics with a clear pattern. Higher harmonics fade gradually, creating a balanced, rich sound.",
    voice:
      "Human voice contains formants (emphasized frequency regions) that vary between vowels. The spectrum shows strong fundamental frequency and harmonic structure with formant peaks.",
    guitar:
      "Guitar spectrum shows strong harmonics with some inharmonicity (slight deviation from perfect harmonic series). Plucked strings create an initial bright attack with many upper harmonics.",
    drums:
      "Percussion sounds have a broad, noise-like spectrum without clear pitch. Kick drums show energy in low frequencies, while cymbals and hi-hats spread energy across high frequencies.",
    ambient:
      "Ambient sounds typically have complex, evolving spectral content with energy distributed across many frequencies. Background noise appears as a relatively flat spectrum.",
  };

  // Initialize audio context and set up analyzer
  const initAudio = () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext ||
        window.webkitAudioContext)();
    }

    if (!analyserRef.current) {
      const analyser = audioContextRef.current.createAnalyser();
      analyser.fftSize = 2048;
      analyser.smoothingTimeConstant = 0.8;
      analyserRef.current = analyser;
    }

    return audioContextRef.current;
  };

  // Load and play sample sounds
  const loadAndPlaySample = async (sampleKey) => {
    stopEverything();

    try {
      const audioContext = initAudio();

      // Mock audio file loading (in a real app, you'd fetch actual files)
      // Instead, we'll simulate this with generated sounds
      let buffer;

      switch (sampleKey) {
        case "piano":
          buffer = createPianoSample(audioContext);
          break;
        case "voice":
          buffer = createVoiceSample(audioContext);
          break;
        case "guitar":
          buffer = createGuitarSample(audioContext);
          break;
        case "drums":
          buffer = createDrumSample(audioContext);
          break;
        case "ambient":
          buffer = createAmbientSample(audioContext);
          break;
        default:
          buffer = createPianoSample(audioContext);
      }

      setAudioBuffer(buffer);
      playSample(buffer);
    } catch (error) {
      console.error("Error loading audio sample:", error);
    }
  };

  // Create sample audio buffers for demonstration
  // In a real app, you'd load actual audio files instead

  const createPianoSample = (audioContext) => {
    const sampleRate = audioContext.sampleRate;
    const duration = 3.0; // seconds
    const buffer = audioContext.createBuffer(
      2,
      sampleRate * duration,
      sampleRate
    );

    const generatePianoSound = (channel) => {
      const data = buffer.getChannelData(channel);
      const fundamental = 261.63; // C4

      // Add fundamental and harmonics with decay
      for (let i = 0; i < data.length; i++) {
        const t = i / sampleRate;
        // Amplitude envelope: quick attack, slow decay
        const envelope = Math.exp(-t * 1.5);

        // Fundamental frequency
        data[i] = Math.sin(2 * Math.PI * fundamental * t) * 0.5 * envelope;

        // Add harmonics
        data[i] +=
          Math.sin(2 * Math.PI * fundamental * 2 * t) * 0.25 * envelope;
        data[i] +=
          Math.sin(2 * Math.PI * fundamental * 3 * t) * 0.125 * envelope;
        data[i] +=
          Math.sin(2 * Math.PI * fundamental * 4 * t) * 0.0625 * envelope;
        data[i] +=
          Math.sin(2 * Math.PI * fundamental * 5 * t) * 0.03125 * envelope;
      }
    };

    generatePianoSound(0); // Left channel
    generatePianoSound(1); // Right channel

    return buffer;
  };

  const createVoiceSample = (audioContext) => {
    const sampleRate = audioContext.sampleRate;
    const duration = 3.0;
    const buffer = audioContext.createBuffer(
      2,
      sampleRate * duration,
      sampleRate
    );

    const generateVoiceSound = (channel) => {
      const data = buffer.getChannelData(channel);
      const fundamental = 220; // A3, typical male voice fundamental

      for (let i = 0; i < data.length; i++) {
        const t = i / sampleRate;
        // Smoother envelope for voice
        const envelope = Math.min(1, t * 10) * Math.exp(-t * 0.5);

        // Fundamental with slight vibrato
        const vibrato = 5 * Math.sin(2 * Math.PI * 5 * t);
        data[i] =
          Math.sin(2 * Math.PI * (fundamental + vibrato) * t) * 0.3 * envelope;

        // Formants (emphasized frequency regions)
        data[i] += Math.sin(2 * Math.PI * 600 * t) * 0.1 * envelope; // First formant
        data[i] += Math.sin(2 * Math.PI * 1200 * t) * 0.05 * envelope; // Second formant
        data[i] += Math.sin(2 * Math.PI * 2400 * t) * 0.025 * envelope; // Third formant

        // Add some breathiness (noise component)
        data[i] += (Math.random() * 2 - 1) * 0.05 * envelope;
      }
    };

    generateVoiceSound(0);
    generateVoiceSound(1);

    return buffer;
  };

  const createGuitarSample = (audioContext) => {
    const sampleRate = audioContext.sampleRate;
    const duration = 3.0;
    const buffer = audioContext.createBuffer(
      2,
      sampleRate * duration,
      sampleRate
    );

    const generateGuitarSound = (channel) => {
      const data = buffer.getChannelData(channel);
      const fundamental = 146.83; // D3

      for (let i = 0; i < data.length; i++) {
        const t = i / sampleRate;
        // Guitar has a quick attack and a long decay
        const envelope = Math.min(1, t * 20) * Math.exp(-t * 0.8);

        // Fundamental with slight inharmonicity
        data[i] = Math.sin(2 * Math.PI * fundamental * t) * 0.4 * envelope;

        // Add harmonics with slight inharmonicity and different decay rates
        data[i] +=
          Math.sin(2 * Math.PI * fundamental * 2.003 * t) *
          0.2 *
          Math.exp(-t * 1.0);
        data[i] +=
          Math.sin(2 * Math.PI * fundamental * 3.002 * t) *
          0.1 *
          Math.exp(-t * 1.2);
        data[i] +=
          Math.sin(2 * Math.PI * fundamental * 4.004 * t) *
          0.05 *
          Math.exp(-t * 1.5);
        data[i] +=
          Math.sin(2 * Math.PI * fundamental * 5.001 * t) *
          0.025 *
          Math.exp(-t * 2.0);

        // Add pick noise at the beginning
        if (t < 0.05) {
          data[i] += (Math.random() * 2 - 1) * 0.1 * (1 - t / 0.05);
        }
      }
    };

    generateGuitarSound(0);
    generateGuitarSound(1);

    return buffer;
  };

  const createDrumSample = (audioContext) => {
    const sampleRate = audioContext.sampleRate;
    const duration = 2.0;
    const buffer = audioContext.createBuffer(
      2,
      sampleRate * duration,
      sampleRate
    );

    const generateDrumSound = (channel) => {
      const data = buffer.getChannelData(channel);

      // Kick drum
      for (let i = 0; i < data.length; i++) {
        const t = i / sampleRate;
        if (t < 0.5) {
          // Kick drum: frequency sweep from 150Hz to 50Hz
          const freq = 150 * Math.exp(-t * 10) + 50;
          const kickEnvelope = Math.exp(-t * 15);
          data[i] = Math.sin(2 * Math.PI * freq * t) * kickEnvelope * 0.6;
        }

        // Snare at 0.5 seconds
        if (t > 0.5 && t < 1.0) {
          const snareT = t - 0.5;
          const snareEnvelope = Math.exp(-snareT * 20);
          // Snare has both tonal and noise components
          data[i] += Math.sin(2 * Math.PI * 200 * snareT) * snareEnvelope * 0.2;
          data[i] += (Math.random() * 2 - 1) * snareEnvelope * 0.4;
        }

        // Hi-hat at 0.25, 0.75, 1.25, and 1.75 seconds
        if (
          (t > 0.25 && t < 0.3) ||
          (t > 0.75 && t < 0.8) ||
          (t > 1.25 && t < 1.3) ||
          (t > 1.75 && t < 1.8)
        ) {
          // Hi-hat is mostly high-frequency noise
          const hatEnvelope = Math.exp(-(t % 0.5) * 70);
          data[i] += (Math.random() * 2 - 1) * hatEnvelope * 0.3;
          // Add some high frequencies
          for (let j = 1; j <= 5; j++) {
            data[i] +=
              Math.sin(2 * Math.PI * 3000 * j * (t % 0.5)) * hatEnvelope * 0.02;
          }
        }
      }
    };

    generateDrumSound(0);
    generateDrumSound(1);

    return buffer;
  };

  const createAmbientSample = (audioContext) => {
    const sampleRate = audioContext.sampleRate;
    const duration = 5.0;
    const buffer = audioContext.createBuffer(
      2,
      sampleRate * duration,
      sampleRate
    );

    const generateAmbientSound = (channel) => {
      const data = buffer.getChannelData(channel);

      // Create slowly evolving pads with filtered noise
      for (let i = 0; i < data.length; i++) {
        const t = i / sampleRate;

        // Slow LFO
        const lfo1 = 0.5 * Math.sin(2 * Math.PI * 0.1 * t);
        const lfo2 = 0.5 * Math.sin(2 * Math.PI * 0.07 * t);

        // Base drone tones
        data[i] = Math.sin(2 * Math.PI * 100 * t) * 0.1 * (1 + lfo1);
        data[i] += Math.sin(2 * Math.PI * 150 * t) * 0.08 * (1 + lfo2);
        data[i] += Math.sin(2 * Math.PI * 200 * t) * 0.06;

        // Add filtered noise
        let noise = 0;
        for (let j = 1; j <= 10; j++) {
          // Filter noise by adding sine waves at specific frequencies
          const freq = 400 + j * 50 + 20 * Math.sin(2 * Math.PI * 0.05 * j * t);
          noise += (Math.sin(2 * Math.PI * freq * t) * 0.01) / j;
        }
        data[i] += noise * (0.3 + 0.2 * Math.sin(2 * Math.PI * 0.03 * t));

        // Add subtle random variation
        data[i] += (Math.random() * 2 - 1) * 0.02;
      }
    };

    generateAmbientSound(0);
    generateAmbientSound(1);

    return buffer;
  };

  // Play a loaded audio buffer
  const playSample = (buffer) => {
    if (!buffer || !audioContextRef.current) return;

    // Clean up any existing source
    if (sourceNodeRef.current) {
      sourceNodeRef.current.stop();
      sourceNodeRef.current.disconnect();
    }

    // Create a new source
    const source = audioContextRef.current.createBufferSource();
    source.buffer = buffer;

    // Connect to analyzer and destination
    source.connect(analyserRef.current);
    analyserRef.current.connect(audioContextRef.current.destination);

    // Set up looping
    source.loop = true;

    // Start playing
    source.start();
    sourceNodeRef.current = source;

    // Start visualization
    startVisualization();

    setIsPlaying(true);
    setIsRecording(false);
  };

  // Start recording from microphone
  const startRecording = async () => {
    stopEverything();

    try {
      // Initialize audio context
      const audioContext = initAudio();

      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      // Create media stream source
      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyserRef.current);
      // Intentionally don't connect to destination to avoid feedback

      // Start visualization
      startVisualization();

      setIsRecording(true);
      setIsPlaying(false);
    } catch (error) {
      console.error("Error accessing microphone:", error);
      alert("Could not access microphone. Please check permissions.");
    }
  };

  // Stop everything (playback and recording)
  const stopEverything = () => {
    // Stop source node if playing
    if (sourceNodeRef.current) {
      sourceNodeRef.current.stop();
      sourceNodeRef.current.disconnect();
      sourceNodeRef.current = null;
    }

    // Stop media stream if recording
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }

    // Cancel animation frame
    if (frameIdRef.current) {
      cancelAnimationFrame(frameIdRef.current);
      frameIdRef.current = null;
    }

    setIsPlaying(false);
    setIsRecording(false);
  };

  // Start visualization loop
  const startVisualization = () => {
    if (!canvasRef.current || !analyserRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const width = canvas.width;
    const height = canvas.height;

    // Prepare data arrays
    const frequencyData = new Uint8Array(analyserRef.current.frequencyBinCount);
    const timeData = new Uint8Array(analyserRef.current.frequencyBinCount);

    // Animation function
    const draw = () => {
      // Cancel any existing frame request
      if (frameIdRef.current) {
        cancelAnimationFrame(frameIdRef.current);
      }

      // Request a new frame
      frameIdRef.current = requestAnimationFrame(draw);

      // Clear canvas
      ctx.clearRect(0, 0, width, height);

      // Fill background
      ctx.fillStyle = "#f9fafb";
      ctx.fillRect(0, 0, width, height);

      if (viewMode === "spectrum") {
        // Get frequency data
        analyserRef.current.getByteFrequencyData(frequencyData);

        // Draw frequency domain visualization
        const barWidth = (width / frequencyData.length) * 2.5;

        // Number of bars to display (limiting to make it more readable)
        const barsToShow = Math.min(70, frequencyData.length);

        // Draw frequency bins
        for (let i = 0; i < barsToShow; i++) {
          const hue = (i / barsToShow) * 240; // Blue to red gradient
          const barHeight = (frequencyData[i] / 255) * height;

          ctx.fillStyle = `hsl(${hue}, 80%, 50%)`;
          ctx.fillRect(
            i * barWidth,
            height - barHeight,
            barWidth - 1,
            barHeight
          );
        }

        // Draw frequency labels
        ctx.fillStyle = "#6b7280";
        ctx.font = "12px Arial";
        ctx.textAlign = "center";

        const freqMarkers = [100, 200, 500, 1000, 2000, 5000, 10000];
        freqMarkers.forEach((freq) => {
          // Convert frequency to bin index
          const binIndex = Math.round(
            (freq * barsToShow) / (audioContextRef.current.sampleRate / 2)
          );
          if (binIndex < barsToShow) {
            const x = binIndex * barWidth;
            ctx.fillText(
              freq >= 1000 ? `${freq / 1000}k` : freq,
              x,
              height - 5
            );
          }
        });

        // Add labels
        ctx.fillStyle = "#1f2937";
        ctx.font = "14px Arial";
        ctx.textAlign = "left";
        ctx.fillText("Frequency (Hz)", 10, 20);

        ctx.textAlign = "right";
        ctx.fillText("Amplitude", width - 10, 20);

        // Draw title
        ctx.textAlign = "center";
        ctx.fillText("Frequency Spectrum", width / 2, 20);
      } else {
        // Get time domain data
        analyserRef.current.getByteTimeDomainData(timeData);

        // Draw time domain visualization
        ctx.beginPath();
        ctx.lineWidth = 2;
        ctx.strokeStyle = "#4F46E5";

        const sliceWidth = width / timeData.length;
        let x = 0;

        for (let i = 0; i < timeData.length; i++) {
          const v = timeData[i] / 128.0;
          const y = (v * height) / 2;

          if (i === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }

          x += sliceWidth;
        }

        ctx.lineTo(width, height / 2);
        ctx.stroke();

        // Draw centerline
        ctx.strokeStyle = "#d1d5db";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, height / 2);
        ctx.lineTo(width, height / 2);
        ctx.stroke();

        // Add labels
        ctx.fillStyle = "#1f2937";
        ctx.font = "14px Arial";
        ctx.textAlign = "left";
        ctx.fillText("Time", 10, 20);

        ctx.textAlign = "right";
        ctx.fillText("Amplitude", width - 10, 20);

        // Draw title
        ctx.textAlign = "center";
        ctx.fillText("Waveform (Time Domain)", width / 2, 20);
      }
    };

    draw();
  };

  // Clean up on unmount
  useEffect(() => {
    return () => {
      stopEverything();

      // Clean up AudioContext if needed
      if (
        audioContextRef.current &&
        audioContextRef.current.state !== "closed"
      ) {
        audioContextRef.current.close();
      }
    };
  }, []);

  return (
    <div className="spectrum-analyzer">
      <div className="visualization-container">
        <canvas
          ref={canvasRef}
          width={800}
          height={300}
          className="visualization-canvas"
        />
      </div>

      <div className="controls">
        <div className="view-toggle">
          <button
            onClick={() => setViewMode("spectrum")}
            className={`view-button ${viewMode === "spectrum" ? "active" : ""}`}
          >
            Frequency Spectrum
          </button>
          <button
            onClick={() => setViewMode("waveform")}
            className={`view-button ${viewMode === "waveform" ? "active" : ""}`}
          >
            Waveform
          </button>
        </div>

        <div className="control-row">
          <div className="sample-selector">
            <h3 className="section-title">Sample Sounds</h3>
            <div className="sample-buttons">
              {Object.keys(audioSamples).map((key) => (
                <button
                  key={key}
                  onClick={() => {
                    setSelectedSound(key);
                    loadAndPlaySample(key);
                  }}
                  className={`sample-button ${
                    selectedSound === key && isPlaying ? "active" : ""
                  }`}
                >
                  {key.charAt(0).toUpperCase() + key.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div className="record-section">
            <h3 className="section-title">Live Input</h3>
            <div className="record-controls">
              {isRecording ? (
                <button onClick={stopEverything} className="stop-button">
                  Stop Microphone
                </button>
              ) : (
                <button onClick={startRecording} className="record-button">
                  Start Microphone
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="sound-description">
        {selectedSound && soundDescriptions[selectedSound] && isPlaying && (
          <div className="description-box">
            <h3>
              {selectedSound.charAt(0).toUpperCase() + selectedSound.slice(1)}{" "}
              Characteristics:
            </h3>
            <p>{soundDescriptions[selectedSound]}</p>
          </div>
        )}

        {isRecording && (
          <div className="description-box">
            <h3>Live Input Analysis:</h3>
            <p>
              Speaking or making sounds into your microphone will display their
              spectral characteristics in real-time. Different sounds will
              create distinct patterns in the frequency spectrum.
            </p>
          </div>
        )}

        {!isPlaying && !isRecording && (
          <div className="description-box">
            <h3>Sound Spectrum Analysis:</h3>
            <p>
              The frequency spectrum shows how energy is distributed across
              different frequencies, revealing the harmonic structure and
              timbral characteristics of sounds. Select a sample sound or use
              your microphone to see this visualization in action.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SoundSpectrumAnalyzer;
