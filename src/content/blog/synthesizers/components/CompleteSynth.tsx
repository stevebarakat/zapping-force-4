import React, { useState, useRef, useEffect } from "react";

const CompleteSynth = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [activePreset, setActivePreset] = useState(null);

  // Oscillator parameters
  const [waveform, setWaveform] = useState("sawtooth");
  const [frequency, setFrequency] = useState(220); // A3
  const [osc1Volume, setOsc1Volume] = useState(0.8);
  const [osc2Volume, setOsc2Volume] = useState(0.6);
  const [detune, setDetune] = useState(7);

  // Filter parameters
  const [filterType, setFilterType] = useState("lowpass");
  const [cutoff, setCutoff] = useState(2000);
  const [resonance, setResonance] = useState(5);

  // LFO parameters
  const [lfoTarget, setLfoTarget] = useState("filter");
  const [lfoRate, setLfoRate] = useState(2);
  const [lfoDepth, setLfoDepth] = useState(0.5);
  const [lfoWaveform, setLfoWaveform] = useState("sine");

  // ADSR parameters
  const [adsr, setADSR] = useState({
    attack: 0.1,
    decay: 0.2,
    sustain: 0.7,
    release: 0.5,
  });

  // Audio nodes refs
  const audioContextRef = useRef(null);
  const oscillator1Ref = useRef(null);
  const oscillator2Ref = useRef(null);
  const gainNode1Ref = useRef(null);
  const gainNode2Ref = useRef(null);
  const masterGainRef = useRef(null);
  const filterRef = useRef(null);
  const lfoRef = useRef(null);
  const lfoGainRef = useRef(null);
  const analyserRef = useRef(null);
  const canvasRef = useRef(null);
  const animationRef = useRef(null);

  // Initialize or update audio
  const startSound = () => {
    // Create audio context if it doesn't exist
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext ||
        window.webkitAudioContext)();
    }

    const audioContext = audioContextRef.current;

    // Stop any playing oscillator and LFO
    stopSoundSources();

    // Create an analyser for visualization
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 2048;
    analyserRef.current = analyser;

    // Create a filter
    const filter = audioContext.createBiquadFilter();
    filter.type = filterType;
    filter.frequency.value = cutoff;
    filter.Q.value = resonance;
    filter.connect(analyser);
    filterRef.current = filter;

    // Create master gain (for ADSR)
    const masterGain = audioContext.createGain();
    masterGain.connect(filter);
    masterGainRef.current = masterGain;

    // Create individual oscillator gain nodes
    const gainNode1 = audioContext.createGain();
    gainNode1.gain.value = osc1Volume;
    gainNode1.connect(masterGain);
    gainNode1Ref.current = gainNode1;

    const gainNode2 = audioContext.createGain();
    gainNode2.gain.value = osc2Volume;
    gainNode2.connect(masterGain);
    gainNode2Ref.current = gainNode2;

    // Create LFO gain node
    const lfoGain = audioContext.createGain();
    lfoGainRef.current = lfoGain;

    // Set up LFO gain based on target
    if (lfoTarget === "filter") {
      // Scale for filter cutoff modulation
      lfoGain.gain.value = cutoff * lfoDepth;
      lfoGain.connect(filter.frequency);
    } else if (lfoTarget === "pitch") {
      // Scale for pitch modulation (both oscillators)
      lfoGain.gain.value = 50 * lfoDepth; // 50 cents max
    }

    // Create LFO
    const lfo = audioContext.createOscillator();
    lfo.type = lfoWaveform;
    lfo.frequency.value = lfoRate;
    lfo.connect(lfoGain);
    lfoRef.current = lfo;

    // Create the oscillators
    const oscillator1 = audioContext.createOscillator();
    oscillator1.type = waveform;
    oscillator1.frequency.setValueAtTime(frequency, audioContext.currentTime);
    oscillator1.connect(gainNode1);
    oscillatorRef.current = oscillator1;

    const oscillator2 = audioContext.createOscillator();
    oscillator2.type = waveform;
    oscillator2.frequency.setValueAtTime(frequency, audioContext.currentTime);
    oscillator2.detune.setValueAtTime(detune, audioContext.currentTime);
    oscillator2.connect(gainNode2);
    oscillator2Ref.current = oscillator2;

    // Connect LFO to pitch if needed
    if (lfoTarget === "pitch") {
      lfoGain.connect(oscillator1.detune);
      lfoGain.connect(oscillator2.detune);
    }

    // Connect analyser to output
    analyser.connect(audioContext.destination);

    // Apply ADSR envelope
    const now = audioContext.currentTime;

    // Start with zero gain
    masterGain.gain.setValueAtTime(0, now);

    // Attack - ramp up to full volume
    masterGain.gain.linearRampToValueAtTime(1, now + adsr.attack);

    // Decay - fall to sustain level
    masterGain.gain.linearRampToValueAtTime(
      adsr.sustain,
      now + adsr.attack + adsr.decay
    );

    // Start oscillators and LFO
    oscillator1.start();
    oscillator2.start();
    lfo.start();

    // Start visualization
    drawWaveform();

    setIsPlaying(true);
  };

  const stopSoundSources = () => {
    if (oscillator1Ref.current) {
      oscillator1Ref.current.stop();
      oscillator1Ref.current.disconnect();
      oscillator1Ref.current = null;
    }

    if (oscillator2Ref.current) {
      oscillator2Ref.current.stop();
      oscillator2Ref.current.disconnect();
      oscillator2Ref.current = null;
    }

    if (lfoRef.current) {
      lfoRef.current.stop();
      lfoRef.current.disconnect();
      lfoRef.current = null;
    }

    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
  };

  const stopSound = () => {
    if (!audioContextRef.current || !masterGainRef.current) return;

    // Apply release phase
    const now = audioContextRef.current.currentTime;

    masterGainRef.current.gain.cancelScheduledValues(now);
    masterGainRef.current.gain.setValueAtTime(
      masterGainRef.current.gain.value,
      now
    );
    masterGainRef.current.gain.linearRampToValueAtTime(0, now + adsr.release);

    // Stop oscillators and LFO after release time
    setTimeout(() => {
      stopSoundSources();
    }, adsr.release * 1000);

    setIsPlaying(false);
  };

  const toggleSound = () => {
    if (isPlaying) {
      stopSound();
    } else {
      startSound();
    }
  };

  // Draw waveform visualization
  const drawWaveform = () => {
    if (!analyserRef.current || !canvasRef.current) return;

    const analyser = analyserRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    const width = canvas.width;
    const height = canvas.height;

    const bufferLength = analyser.fftSize;
    const dataArray = new Float32Array(bufferLength);

    const draw = () => {
      animationRef.current = requestAnimationFrame(draw);

      analyser.getFloatTimeDomainData(dataArray);

      ctx.fillStyle = "#f9fafb";
      ctx.fillRect(0, 0, width, height);

      ctx.lineWidth = 2;
      ctx.strokeStyle = "#4F46E5";
      ctx.beginPath();

      const sliceWidth = width / bufferLength;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const v = dataArray[i];
        const y = ((v + 1) / 2) * height;

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }

        x += sliceWidth;
      }

      ctx.stroke();
    };

    draw();
  };

  // Handle ADSR changes
  const handleADSRChange = (parameter, value) => {
    setADSR((prev) => ({
      ...prev,
      [parameter]: value,
    }));
  };

  // Load presets
  const presets = {
    bass: {
      waveform: "sawtooth",
      osc1Volume: 1.0,
      osc2Volume: 0.7,
      detune: 7,
      filterType: "lowpass",
      cutoff: 1200,
      resonance: 10,
      lfoTarget: "filter",
      lfoRate: 0.5,
      lfoDepth: 0.3,
      lfoWaveform: "triangle",
      adsr: { attack: 0.05, decay: 0.2, sustain: 0.8, release: 0.3 },
    },
    lead: {
      waveform: "sawtooth",
      osc1Volume: 0.8,
      osc2Volume: 0.6,
      detune: 12,
      filterType: "lowpass",
      cutoff: 3000,
      resonance: 4,
      lfoTarget: "pitch",
      lfoRate: 6,
      lfoDepth: 0.2,
      lfoWaveform: "sine",
      adsr: { attack: 0.02, decay: 0.1, sustain: 0.7, release: 0.2 },
    },
    pad: {
      waveform: "triangle",
      osc1Volume: 0.6,
      osc2Volume: 0.6,
      detune: 7,
      filterType: "lowpass",
      cutoff: 2000,
      resonance: 2,
      lfoTarget: "filter",
      lfoRate: 0.8,
      lfoDepth: 0.4,
      lfoWaveform: "sine",
      adsr: { attack: 0.8, decay: 1.0, sustain: 0.8, release: 1.5 },
    },
    pluck: {
      waveform: "triangle",
      osc1Volume: 0.8,
      osc2Volume: 0.4,
      detune: 12,
      filterType: "lowpass",
      cutoff: 3000,
      resonance: 1,
      lfoTarget: "filter",
      lfoRate: 0.1,
      lfoDepth: 0.1,
      lfoWaveform: "triangle",
      adsr: { attack: 0.01, decay: 0.1, sustain: 0.2, release: 0.1 },
    },
  };

  const loadPreset = (presetName) => {
    if (!presets[presetName]) return;

    const preset = presets[presetName];

    setWaveform(preset.waveform);
    setOsc1Volume(preset.osc1Volume);
    setOsc2Volume(preset.osc2Volume);
    setDetune(preset.detune);
    setFilterType(preset.filterType);
    setCutoff(preset.cutoff);
    setResonance(preset.resonance);
    setLfoTarget(preset.lfoTarget);
    setLfoRate(preset.lfoRate);
    setLfoDepth(preset.lfoDepth);
    setLfoWaveform(preset.lfoWaveform);
    setADSR(preset.adsr);

    setActivePreset(presetName);

    // If playing, restart sound to apply changes
    if (isPlaying) {
      stopSound();
      setTimeout(() => startSound(), 100);
    }
  };

  // Keyboard notes
  const keyboardNotes = [
    { note: "C3", frequency: 130.81 },
    { note: "D3", frequency: 146.83 },
    { note: "E3", frequency: 164.81 },
    { note: "F3", frequency: 174.61 },
    { note: "G3", frequency: 196.0 },
    { note: "A3", frequency: 220.0 },
    { note: "B3", frequency: 246.94 },
    { note: "C4", frequency: 261.63 },
  ];

  // Clean up on unmount
  useEffect(() => {
    return () => {
      stopSoundSources();
    };
  }, []);

  return (
    <div className="complete-synth">
      <div className="synth-header">
        <h2 className="synth-title">Complete Synthesizer</h2>
        <div className="preset-buttons">
          {Object.keys(presets).map((presetName) => (
            <button
              key={presetName}
              onClick={() => loadPreset(presetName)}
              className={`preset-button ${
                activePreset === presetName ? "active" : ""
              }`}
            >
              {presetName.charAt(0).toUpperCase() + presetName.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="waveform-container">
        <canvas
          ref={canvasRef}
          width={800}
          height={150}
          className="waveform-canvas"
        />
      </div>

      <div className="keyboard">
        {keyboardNotes.map(({ note, frequency: noteFreq }) => (
          <button
            key={note}
            className={`key ${frequency === noteFreq ? "active-key" : ""}`}
            onMouseDown={() => {
              setFrequency(noteFreq);
              if (!isPlaying) {
                startSound();
              } else if (
                oscillator1Ref.current &&
                oscillator2Ref.current &&
                audioContextRef.current
              ) {
                oscillator1Ref.current.frequency.setValueAtTime(
                  noteFreq,
                  audioContextRef.current.currentTime
                );
                oscillator2Ref.current.frequency.setValueAtTime(
                  noteFreq,
                  audioContextRef.current.currentTime
                );
              }
            }}
            onMouseUp={() => {
              if (isPlaying) {
                stopSound();
              }
            }}
          >
            {note}
          </button>
        ))}
      </div>

      <div className="controls-container">
        <div className="control-column">
          <div className="control-section">
            <h3 className="section-title">Oscillators</h3>
            <div className="waveform-selector">
              <label className="control-label">Waveform</label>
              <div className="button-group">
                {["sine", "square", "sawtooth", "triangle"].map((type) => (
                  <button
                    key={type}
                    onClick={() => setWaveform(type)}
                    className={`waveform-button ${
                      waveform === type ? "selected" : ""
                    }`}
                  >
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex">
              <label className="control-label">Osc 1 Volume</label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={osc1Volume}
                onChange={(e) => setOsc1Volume(parseFloat(e.target.value))}
                className="slider"
              />
              <div className="value-display">
                {Math.round(osc1Volume * 100)}%
              </div>
            </div>

            <div className="flex">
              <label className="control-label">Osc 2 Volume</label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={osc2Volume}
                onChange={(e) => setOsc2Volume(parseFloat(e.target.value))}
                className="slider"
              />
              <div className="value-display">
                {Math.round(osc2Volume * 100)}%
              </div>
            </div>

            <div className="flex">
              <label className="control-label">Detune</label>
              <input
                type="range"
                min="0"
                max="50"
                step="1"
                value={detune}
                onChange={(e) => setDetune(parseFloat(e.target.value))}
                className="slider"
              />
              <div className="value-display">{detune} cents</div>
            </div>
          </div>

          <div className="control-section">
            <h3 className="section-title">Filter</h3>
            <div className="filter-selector">
              <label className="control-label">Filter Type</label>
              <div className="button-group">
                {["lowpass", "highpass", "bandpass"].map((type) => (
                  <button
                    key={type}
                    onClick={() => setFilterType(type)}
                    className={`filter-button ${
                      filterType === type ? "selected" : ""
                    }`}
                  >
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex">
              <label className="control-label">Cutoff</label>
              <input
                type="range"
                min="20"
                max="20000"
                step="1"
                value={cutoff}
                onChange={(e) => setCutoff(parseFloat(e.target.value))}
                className="slider"
              />
              <div className="value-display">{cutoff} Hz</div>
            </div>

            <div className="flex">
              <label className="control-label">Resonance</label>
              <input
                type="range"
                min="0.1"
                max="20"
                step="0.1"
                value={resonance}
                onChange={(e) => setResonance(parseFloat(e.target.value))}
                className="slider"
              />
              <div className="value-display">Q: {resonance.toFixed(1)}</div>
            </div>
          </div>
        </div>

        <div className="control-column">
          <div className="control-section">
            <h3 className="section-title">ADSR Envelope</h3>
            <div className="flex">
              <label className="control-label">Attack</label>
              <input
                type="range"
                min="0.01"
                max="2"
                step="0.01"
                value={adsr.attack}
                onChange={(e) =>
                  handleADSRChange("attack", parseFloat(e.target.value))
                }
                className="slider"
              />
              <div className="value-display">{adsr.attack.toFixed(2)} s</div>
            </div>

            <div className="flex">
              <label className="control-label">Decay</label>
              <input
                type="range"
                min="0.01"
                max="2"
                step="0.01"
                value={adsr.decay}
                onChange={(e) =>
                  handleADSRChange("decay", parseFloat(e.target.value))
                }
                className="slider"
              />
              <div className="value-display">{adsr.decay.toFixed(2)} s</div>
            </div>

            <div className="flex">
              <label className="control-label">Sustain</label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={adsr.sustain}
                onChange={(e) =>
                  handleADSRChange("sustain", parseFloat(e.target.value))
                }
                className="slider"
              />
              <div className="value-display">
                {Math.round(adsr.sustain * 100)}%
              </div>
            </div>

            <div className="flex">
              <label className="control-label">Release</label>
              <input
                type="range"
                min="0.01"
                max="3"
                step="0.01"
                value={adsr.release}
                onChange={(e) =>
                  handleADSRChange("release", parseFloat(e.target.value))
                }
                className="slider"
              />
              <div className="value-display">{adsr.release.toFixed(2)} s</div>
            </div>
          </div>

          <div className="control-section">
            <h3 className="section-title">LFO</h3>
            <div className="lfo-target-selector">
              <label className="control-label">LFO Target</label>
              <div className="button-group">
                <button
                  onClick={() => setLfoTarget("filter")}
                  className={`lfo-button ${
                    lfoTarget === "filter" ? "selected" : ""
                  }`}
                >
                  Filter
                </button>
                <button
                  onClick={() => setLfoTarget("pitch")}
                  className={`lfo-button ${
                    lfoTarget === "pitch" ? "selected" : ""
                  }`}
                >
                  Pitch
                </button>
              </div>
            </div>

            <div className="lfo-wave-selector">
              <label className="control-label">LFO Waveform</label>
              <div className="button-group">
                {["sine", "triangle", "square", "sawtooth"].map((type) => (
                  <button
                    key={type}
                    onClick={() => setLfoWaveform(type)}
                    className={`lfo-button small ${
                      lfoWaveform === type ? "selected" : ""
                    }`}
                  >
                    {type.charAt(0).toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex">
              <label className="control-label">Rate</label>
              <input
                type="range"
                min="0.1"
                max="20"
                step="0.1"
                value={lfoRate}
                onChange={(e) => setLfoRate(parseFloat(e.target.value))}
                className="slider"
              />
              <div className="value-display">{lfoRate.toFixed(1)} Hz</div>
            </div>

            <div className="flex">
              <label className="control-label">Depth</label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={lfoDepth}
                onChange={(e) => setLfoDepth(parseFloat(e.target.value))}
                className="slider"
              />
              <div className="value-display">{Math.round(lfoDepth * 100)}%</div>
            </div>
          </div>
        </div>
      </div>

      <div className="play-controls">
        <button onClick={toggleSound} className="play-button">
          {isPlaying ? "Stop" : "Play Sustained Note"}
        </button>
      </div>

      <div className="synth-description">
        <p>
          This complete synthesizer combines all the components we've explored
          throughout this guide. Try the presets to hear different types of
          sounds, or create your own by adjusting the controls. You can play
          notes by clicking on the keyboard or use the Play button for a
          sustained tone.
        </p>
      </div>

      <style jsx>{`
        .complete-synth {
          margin: 24px 0;
          padding: 20px;
          background-color: white;
          border-radius: 8px;
          box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
        }

        .synth-header {
          display: flex;
          flex-wrap: wrap;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }

        .synth-title {
          font-size: 20px;
          font-weight: 600;
          margin: 0;
        }

        .preset-buttons {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }

        .preset-button {
          padding: 8px 16px;
          background-color: #f3f4f6;
          border: none;
          border-radius: 4px;
          font-size: var(--font-size-xs);
          font-weight: 500;
          color: #4b5563;
          cursor: pointer;
          transition: all 0.2s;
        }

        .preset-button:hover {
          background-color: #e5e7eb;
        }

        .preset-button.active {
          background-color: #4f46e5;
          color: white;
        }

        .waveform-container {
          margin-bottom: 16px;
        }

        .waveform-canvas {
          width: 100%;
          height: 150px;
          background-color: #f9fafb;
          border-radius: 8px;
        }

        .keyboard {
          display: flex;
          gap: 4px;
          margin-bottom: 20px;
        }

        .key {
          flex: 1;
          padding: 16px 8px;
          background-color: #f3f4f6;
          border: 1px solid #d1d5db;
          border-radius: 4px;
          font-size: var(--font-size-xs);
          font-weight: 500;
          color: #4b5563;
          cursor: pointer;
          transition: all 0.1s;
        }

        .key:hover {
          background-color: #e5e7eb;
        }

        .key:active,
        .key.active-key {
          background-color: #4f46e5;
          color: white;
          transform: translateY(2px);
        }

        .controls-container {
          display: flex;
          flex-wrap: wrap;
          gap: 20px;
          margin-bottom: 20px;
        }

        .control-column {
          flex: 1;
          min-width: 300px;
        }

        .control-section {
          background-color: #f9fafb;
          border-radius: 8px;
          padding: 16px;
          margin-bottom: 16px;
        }

        .section-title {
          font-size: 16px;
          font-weight: 600;
          margin-top: 0;
          margin-bottom: 16px;
          color: #4b5563;
        }

        .waveform-selector,
        .filter-selector,
        .lfo-target-selector,
        .lfo-wave-selector {
          margin-bottom: 16px;
        }

        .control-label {
          display: block;
          font-size: var(--font-size-xs);
          font-weight: 500;
          color: #6b7280;
          margin-bottom: 8px;
        }

        .button-group {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }

        .waveform-button,
        .filter-button,
        .lfo-button {
          padding: 6px 12px;
          background-color: #e5e7eb;
          border: none;
          border-radius: 4px;
          font-size: 13px;
          color: #4b5563;
          cursor: pointer;
          transition: all 0.2s;
        }

        .lfo-button.small {
          padding: 6px 8px;
          font-size: 12px;
        }

        .waveform-button:hover,
        .filter-button:hover,
        .lfo-button:hover {
          background-color: #d1d5db;
        }

        .waveform-button.selected,
        .filter-button.selected,
        .lfo-button.selected {
          background-color: #4f46e5;
          color: white;
        }

        .flex {
          margin-bottom: var(--font-size-xs);
        }

        .slider {
          width: 100%;
          height: 6px;
          -webkit-appearance: none;
          appearance: none;
          background: #e5e7eb;
          border-radius: 3px;
          outline: none;
          margin-bottom: 4px;
        }

        .slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 16px;
          height: 16px;
          background: #4f46e5;
          border-radius: 50%;
          cursor: pointer;
        }

        .slider::-moz-range-thumb {
          width: 16px;
          height: 16px;
          background: #4f46e5;
          border-radius: 50%;
          cursor: pointer;
        }

        .value-display {
          font-size: 12px;
          color: #6b7280;
          text-align: right;
        }

        .play-controls {
          display: flex;
          justify-content: center;
          margin-bottom: 20px;
        }

        .play-button {
          padding: 12px 24px;
          background-color: #4f46e5;
          color: white;
          border: none;
          border-radius: 4px;
          font-size: 16px;
          font-weight: 500;
          cursor: pointer;
          transition: background-color 0.2s;
        }

        .play-button:hover {
          background-color: #4338ca;
        }

        .play-button:active {
          transform: translateY(1px);
          background-color: #3730a3;
        }

        .synth-description {
          padding: 16px;
          background-color: #f9fafb;
          border-radius: 6px;
          font-size: var(--font-size-xs);
          color: #4b5563;
          line-height: 1.5;
        }
      `}</style>
    </div>
  );
};

export default CompleteSynth;
