import React, { useEffect, useRef, useState } from "react";
import styles from "./ResonanceDemo.module.css";
import "@/content/blog/sound-basics-mdx-post/components/shared/dark-mode.css";

const ResonanceDemo = () => {
  const canvasRef = useRef(null);
  const animationFrameRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [frequency, setFrequency] = useState(440);
  const [damping, setDamping] = useState(0.1);
  const [amplitude, setAmplitude] = useState(0.5);
  const [isSweeping, setIsSweeping] = useState(false);
  const [sweepDirection, setSweepDirection] = useState(1);
  const audioContextRef = useRef(null);
  const oscillatorRef = useRef(null);
  const gainNodeRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const computedStyle = getComputedStyle(document.documentElement);
    const textColor = computedStyle.getPropertyValue("--text-primary").trim();
    const bgColor = computedStyle
      .getPropertyValue("--component-bg-darker")
      .trim();
    const gridColor = computedStyle
      .getPropertyValue("--component-border")
      .trim();
    const waveColor = computedStyle.getPropertyValue("--primary-blue").trim();

    const draw = () => {
      const width = canvas.width;
      const height = canvas.height;

      // Clear canvas
      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, width, height);

      // Draw grid
      ctx.strokeStyle = gridColor;
      ctx.lineWidth = 0.5;

      // Vertical grid lines
      for (let x = 0; x <= width; x += 50) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }

      // Horizontal grid lines
      for (let y = 0; y <= height; y += 50) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Draw resonance wave
      ctx.strokeStyle = waveColor;
      ctx.lineWidth = 2;
      ctx.beginPath();

      const time = Date.now() / 1000;
      for (let x = 0; x < width; x++) {
        const t = (x / width) * 2 * Math.PI;
        const y =
          height / 2 +
          ((amplitude * height) / 3) *
            Math.sin(frequency * t + time) *
            Math.exp(-damping * t);
        if (x === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.stroke();

      // Draw frequency and amplitude values
      ctx.fillStyle = textColor;
      ctx.font = "14px Arial";
      ctx.fillText(`Frequency: ${frequency.toFixed(1)} Hz`, 10, 20);
      ctx.fillText(`Damping: ${damping.toFixed(2)}`, 10, 40);
      ctx.fillText(`Amplitude: ${amplitude.toFixed(2)}`, 10, 60);

      animationFrameRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [frequency, damping, amplitude]);

  useEffect(() => {
    if (isSweeping) {
      const sweepInterval = setInterval(() => {
        setFrequency((prev) => {
          const newFreq = prev + sweepDirection * 2;
          if (newFreq > 880 || newFreq < 220) {
            setSweepDirection((d) => -d);
            return prev;
          }
          return newFreq;
        });
      }, 50);

      return () => clearInterval(sweepInterval);
    }
  }, [isSweeping, sweepDirection]);

  const togglePlay = () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext ||
        window.webkitAudioContext)();
    }

    if (!isPlaying) {
      oscillatorRef.current = audioContextRef.current.createOscillator();
      gainNodeRef.current = audioContextRef.current.createGain();

      oscillatorRef.current.connect(gainNodeRef.current);
      gainNodeRef.current.connect(audioContextRef.current.destination);

      oscillatorRef.current.frequency.value = frequency;
      gainNodeRef.current.gain.value = amplitude;

      oscillatorRef.current.start();
    } else {
      oscillatorRef.current?.stop();
      oscillatorRef.current?.disconnect();
      gainNodeRef.current?.disconnect();
    }

    setIsPlaying(!isPlaying);
  };

  useEffect(() => {
    if (isPlaying && oscillatorRef.current) {
      oscillatorRef.current.frequency.value = frequency;
      gainNodeRef.current.gain.value = amplitude;
    }
  }, [frequency, amplitude, isPlaying]);

  const presets = [
    { name: "Low Bass", freq: 60, damp: 0.05, amp: 0.7 },
    { name: "Guitar String", freq: 440, damp: 0.1, amp: 0.5 },
    { name: "High Pitch", freq: 880, damp: 0.15, amp: 0.3 },
  ];

  const applyPreset = (preset) => {
    setFrequency(preset.freq);
    setDamping(preset.damp);
    setAmplitude(preset.amp);
  };

  return (
    <div className={styles["resonance-demo"]}>
      <div className={styles["visualization-container"]}>
        <canvas
          ref={canvasRef}
          className={styles["visualization-canvas"]}
          width={800}
          height={400}
        />
      </div>

      <div className={styles.controls}>
        <div className={styles["control-row"]}>
          <div className={styles["control-section"]}>
            <h3 className={styles["section-title"]}>Frequency Control</h3>
            <div className={styles["slider-container"]}>
              <input
                type="range"
                min="20"
                max="1000"
                value={frequency}
                onChange={(e) => setFrequency(Number(e.target.value))}
                className={styles.slider}
              />
              <div className={styles["value-display"]}>
                {frequency.toFixed(1)} Hz
              </div>
            </div>
            <div className={styles["sweep-toggle"]}>
              <label className={styles["toggle-label"]}>
                <input
                  type="checkbox"
                  checked={isSweeping}
                  onChange={() => setIsSweeping(!isSweeping)}
                  className={styles["toggle-checkbox"]}
                />
                Auto Sweep
              </label>
            </div>
          </div>

          <div className={styles["control-section"]}>
            <h3 className={styles["section-title"]}>Damping Control</h3>
            <div className={styles["slider-container"]}>
              <input
                type="range"
                min="0"
                max="0.5"
                step="0.01"
                value={damping}
                onChange={(e) => setDamping(Number(e.target.value))}
                className={styles.slider}
              />
              <div className={styles["value-display"]}>
                {damping.toFixed(2)}
              </div>
            </div>
          </div>

          <div className={styles["control-section"]}>
            <h3 className={styles["section-title"]}>Amplitude Control</h3>
            <div className={styles["slider-container"]}>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={amplitude}
                onChange={(e) => setAmplitude(Number(e.target.value))}
                className={styles.slider}
              />
              <div className={styles["value-display"]}>
                {amplitude.toFixed(2)}
              </div>
            </div>
          </div>
        </div>

        <div className={styles["preset-buttons"]}>
          {presets.map((preset, index) => (
            <button
              key={index}
              onClick={() => applyPreset(preset)}
              className={styles["preset-button"]}
            >
              {preset.name}
            </button>
          ))}
        </div>

        <div className={styles["play-controls"]}>
          <button onClick={togglePlay} className={styles["play-button"]}>
            {isPlaying ? "Stop" : "Play"}
          </button>
        </div>
      </div>

      <div className={styles["resonance-info"]}>
        <p>
          This demo shows how resonance works in sound waves. The wave pattern
          demonstrates how the amplitude of oscillation changes over time due to
          damping. You can:
        </p>
        <ul className={styles["resonance-examples"]}>
          <li>Adjust the frequency to change the pitch of the sound</li>
          <li>
            Modify the damping to control how quickly the oscillations decay
          </li>
          <li>Change the amplitude to affect the overall volume</li>
          <li>
            Use the auto-sweep feature to hear frequency changes automatically
          </li>
          <li>Try different presets to explore common resonance patterns</li>
        </ul>
      </div>
    </div>
  );
};

export default ResonanceDemo;
