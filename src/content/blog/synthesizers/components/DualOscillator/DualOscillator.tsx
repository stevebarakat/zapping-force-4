import React, { useEffect, useRef, useState } from "react";
import { Play, Pause } from "lucide-react";
import VisuallyHidden from "@/components/VisuallyHidden";
import "./DualOscillator.module.css";
import "@/styles/shared/dark-mode.css";
import { Slider } from "@/components/Slider";
import IconButton from "@/components/Button/IconButton";

const DualOscillator = () => {
  const audioContextRef = useRef<AudioContext | null>(null);
  const oscillator1Ref = useRef<OscillatorNode | null>(null);
  const oscillator2Ref = useRef<OscillatorNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const realWaveformCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [frequency1, setFrequency1] = useState(440);
  const [frequency2, setFrequency2] = useState(440);
  const [waveform1, setWaveform1] = useState<OscillatorType>("sine");
  const [waveform2, setWaveform2] = useState<OscillatorType>("sine");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (oscillator1Ref.current && audioContextRef.current) {
      oscillator1Ref.current.frequency.setValueAtTime(
        frequency1,
        audioContextRef.current.currentTime
      );
    }
    if (oscillator2Ref.current && audioContextRef.current) {
      oscillator2Ref.current.frequency.setValueAtTime(
        frequency2,
        audioContextRef.current.currentTime
      );
    }
  }, [frequency1, frequency2]);

  // Canvas drawing effect
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const drawWaveform = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.beginPath();
      ctx.strokeStyle = "#60a5fa"; // Always use the blue color
      ctx.lineWidth = 2;

      const width = canvas.width;
      const height = canvas.height;
      const centerY = height / 2;

      const cycles = frequency1 / 100;

      for (let x = 0; x < width; x++) {
        const t = (x / width) * Math.PI * 2 * cycles;
        const y = centerY + Math.sin(t) * (height / 3) * 0.5;

        if (x === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.stroke();
    };

    drawWaveform();
  }, [frequency1]);

  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  const drawRealWaveform = () => {
    const canvas = realWaveformCanvasRef.current;
    const analyser = analyserRef.current;

    if (!canvas || !analyser) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Float32Array(bufferLength);

    const draw = () => {
      animationFrameRef.current = requestAnimationFrame(draw);

      analyser.getFloatTimeDomainData(dataArray);

      ctx.fillStyle = "rgb(17, 24, 39)"; // Always dark background
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.lineWidth = 2;
      ctx.strokeStyle = "#60a5fa"; // Always use the blue color
      ctx.beginPath();

      const sliceWidth = canvas.width / bufferLength;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const v = dataArray[i];
        const y = ((v + 1) / 2) * canvas.height;

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }

        x += sliceWidth;
      }

      ctx.lineTo(canvas.width, canvas.height / 2);
      ctx.stroke();
    };

    draw();
  };

  const initAudio = () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContext();
    }

    const ctx = audioContextRef.current;

    if (oscillator1Ref.current) {
      oscillator1Ref.current.stop();
      oscillator1Ref.current.disconnect();
    }
    if (oscillator2Ref.current) {
      oscillator2Ref.current.stop();
      oscillator2Ref.current.disconnect();
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    oscillator1Ref.current = ctx.createOscillator();
    oscillator2Ref.current = ctx.createOscillator();
    gainNodeRef.current = ctx.createGain();
    analyserRef.current = ctx.createAnalyser();

    if (
      !analyserRef.current ||
      !oscillator1Ref.current ||
      !oscillator2Ref.current ||
      !gainNodeRef.current
    ) {
      setError("Failed to initialize audio nodes");
      return;
    }

    analyserRef.current.fftSize = 2048;

    oscillator1Ref.current.type = waveform1;
    oscillator2Ref.current.type = waveform2;
    oscillator1Ref.current.frequency.setValueAtTime(
      frequency1,
      ctx.currentTime
    );
    oscillator2Ref.current.frequency.setValueAtTime(
      frequency2,
      ctx.currentTime
    );

    // Create a gain node for each oscillator to control their individual volumes
    const gain1 = ctx.createGain();
    const gain2 = ctx.createGain();
    gain1.gain.value = 0.5;
    gain2.gain.value = 0.5;

    oscillator1Ref.current.connect(gain1);
    oscillator2Ref.current.connect(gain2);
    gain1.connect(gainNodeRef.current);
    gain2.connect(gainNodeRef.current);
    gainNodeRef.current.connect(analyserRef.current);
    analyserRef.current.connect(ctx.destination);

    const now = ctx.currentTime;
    gainNodeRef.current.gain.setValueAtTime(0, now);
    gainNodeRef.current.gain.linearRampToValueAtTime(0.5, now + 0.1);

    oscillator1Ref.current.start();
    oscillator2Ref.current.start();

    drawRealWaveform();

    setIsPlaying(true);
  };

  const stopAudio = () => {
    if (
      oscillator1Ref.current &&
      oscillator2Ref.current &&
      gainNodeRef.current &&
      audioContextRef.current
    ) {
      const now = audioContextRef.current.currentTime;
      gainNodeRef.current.gain.linearRampToValueAtTime(0, now + 0.1);

      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }

      setTimeout(() => {
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
      }, 100);
    }
    setIsPlaying(false);
  };

  const togglePlay = () => {
    if (isPlaying) {
      stopAudio();
    } else {
      initAudio();
    }
  };

  return (
    <>
      <VisuallyHidden as="h3">Dual Oscillator</VisuallyHidden>
      <div className="visualizer-content">
        {error && (
          <div
            className="error-message"
            style={{ color: "red", marginBottom: "1rem" }}
          >
            {error}
          </div>
        )}
        <div className="controls">
          <IconButton
            onClick={togglePlay}
            icon={isPlaying ? <Pause /> : <Play />}
            aria-label={isPlaying ? "Stop" : "Play"}
          >
            {isPlaying ? "Stop" : "Play"}
          </IconButton>

          <div className="oscillator-controls">
            <div className="oscillator-1">
              <h4>Oscillator 1</h4>
              <div className="waveform-buttons">
                {(["sine", "square", "triangle", "sawtooth"] as const).map(
                  (type) => (
                    <button
                      key={type}
                      onClick={() => {
                        setWaveform1(type);
                        if (oscillator1Ref.current) {
                          oscillator1Ref.current.type = type;
                        }
                      }}
                      style={{
                        padding: "0.5rem 1rem",
                        borderRadius: "0.375rem",
                        backgroundColor:
                          waveform1 === type ? "#60a5fa" : "#1f2937",
                        color: waveform1 === type ? "#1f2937" : "#ffffff",
                        border: "none",
                        cursor: "pointer",
                        fontWeight: waveform1 === type ? "bold" : "normal",
                      }}
                    >
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </button>
                  )
                )}
              </div>
              <Slider
                value={frequency1}
                onChange={(value) => setFrequency1(value)}
                min={55}
                max={880}
                step={1}
                label="Frequency 1"
                showLabel={true}
                showValue={true}
              />
            </div>

            <div className="oscillator-2">
              <h4>Oscillator 2</h4>
              <div className="waveform-buttons">
                {(["sine", "square", "triangle", "sawtooth"] as const).map(
                  (type) => (
                    <button
                      key={type}
                      onClick={() => {
                        setWaveform2(type);
                        if (oscillator2Ref.current) {
                          oscillator2Ref.current.type = type;
                        }
                      }}
                      style={{
                        padding: "0.5rem 1rem",
                        borderRadius: "0.375rem",
                        backgroundColor:
                          waveform2 === type ? "#60a5fa" : "#1f2937",
                        color: waveform2 === type ? "#1f2937" : "#ffffff",
                        border: "none",
                        cursor: "pointer",
                        fontWeight: waveform2 === type ? "bold" : "normal",
                      }}
                    >
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </button>
                  )
                )}
              </div>
              <Slider
                value={frequency2}
                onChange={(value) => setFrequency2(value)}
                min={55}
                max={880}
                step={1}
                label="Frequency 2"
                showLabel={true}
                showValue={true}
              />
            </div>
          </div>
        </div>

        <canvas
          ref={realWaveformCanvasRef}
          width={800}
          height={200}
          className="waveform-canvas"
        />
      </div>
    </>
  );
};

export default DualOscillator;
