import React, { useState, useRef, useEffect } from "react";
import styles from "./WaveVisualizer.module.css";
import "@/styles/shared/dark-mode.css";
import { Button } from "@/components/Button";
const WaveVisualizer = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [waveType, setWaveType] = useState("longitudinal");
  const [speed, setSpeed] = useState(1);
  const animationRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    const width = canvas.width;
    const height = canvas.height;

    let phase = 0;

    const drawWave = () => {
      // Clear canvas
      ctx.clearRect(0, 0, width, height);

      // Get dark mode colors
      const computedStyle = getComputedStyle(document.documentElement);
      const bgColor = computedStyle
        .getPropertyValue("--component-bg-darker")
        .trim();
      const gridColor = computedStyle
        .getPropertyValue("--component-border")
        .trim();
      const waveColor = computedStyle.getPropertyValue("--primary-blue").trim();
      const textColor = computedStyle.getPropertyValue("--text-primary").trim();

      // Draw background
      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, width, height);

      // Draw grid
      ctx.strokeStyle = gridColor;
      ctx.lineWidth = 1;

      // Vertical grid lines
      for (let x = 0; x < width; x += 50) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }

      // Horizontal grid lines
      for (let y = 0; y < height; y += 50) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      if (waveType === "longitudinal") {
        // Draw longitudinal wave (particles moving horizontally)
        const particleSize = 4;
        const numParticles = 40;
        const particleSpacing = width / numParticles;
        const amplitude = 15; // Maximum displacement

        // Draw connector line
        ctx.strokeStyle = gridColor;
        ctx.beginPath();
        ctx.moveTo(0, height / 2);
        ctx.lineTo(width, height / 2);
        ctx.stroke();

        // Calculate air pressure regions for visualization
        const pressureData = [];
        for (let x = 0; x < width; x++) {
          const normX = x / width; // Normalize to 0-1
          // Sine wave going across screen
          const displacement = Math.sin(2 * Math.PI * 3 * normX + phase);
          pressureData.push(displacement);
        }

        // Draw pressure gradient
        for (let x = 0; x < width; x++) {
          const pressureValue = pressureData[x];
          // Map from -1,1 to 0,1 for color
          const colorIntensity = (pressureValue + 1) / 2;

          // Pressure gradient - blue for compression, white for normal, red for rarefaction
          let color;
          if (pressureValue > 0) {
            // Compression: blue
            const blueIntensity = Math.floor(255 * pressureValue);
            color = `rgba(0, 0, ${blueIntensity}, 0.2)`;
          } else if (pressureValue < 0) {
            // Rarefaction: red
            const redIntensity = Math.floor(255 * -pressureValue);
            color = `rgba(${redIntensity}, 0, 0, 0.2)`;
          } else {
            color = "rgba(255, 255, 255, 0)";
          }

          // Draw vertical line with color
          ctx.fillStyle = color;
          ctx.fillRect(x, 0, 1, height);
        }

        // Draw particles
        for (let i = 0; i < numParticles; i++) {
          const baseX = i * particleSpacing;
          const normalizedX = baseX / width;

          // Calculate displacement based on sine wave
          const displacement =
            amplitude * Math.sin(2 * Math.PI * 3 * normalizedX + phase);

          // Draw particle
          ctx.beginPath();
          ctx.fillStyle = waveColor;
          ctx.arc(
            baseX + displacement,
            height / 2,
            particleSize,
            0,
            2 * Math.PI
          );
          ctx.fill();

          // Add shadow effect
          ctx.shadowColor = "rgba(79, 70, 229, 0.3)";
          ctx.shadowBlur = 5;

          // Draw vertical line to show displacement
          ctx.strokeStyle = gridColor;
          ctx.beginPath();
          ctx.moveTo(baseX, height / 2);
          ctx.lineTo(baseX + displacement, height / 2);
          ctx.stroke();
        }

        // Add labels with fixed positions
        ctx.font = "14px Arial";
        ctx.fillStyle = textColor;
        ctx.textAlign = "center";

        // Only show labels when animation is paused
        if (!isPlaying) {
          // Fixed positions for labels (approximately where compression and rarefaction occur)
          const compressionX = width * 0.25;
          const rarefactionX = width * 0.75;

          // Label compression and rarefaction areas
          ctx.fillStyle = textColor;
          ctx.fillText("Compression", compressionX, height - 20);
          ctx.fillText("Rarefaction", rarefactionX, height - 20);
        }

        // Direction of travel arrow
        ctx.fillStyle = textColor;
        const arrowX = width - 60;
        const arrowY = 30;
        ctx.beginPath();
        ctx.moveTo(arrowX, arrowY);
        ctx.lineTo(arrowX + 40, arrowY);
        ctx.lineTo(arrowX + 30, arrowY - 10);
        ctx.moveTo(arrowX + 40, arrowY);
        ctx.lineTo(arrowX + 30, arrowY + 10);
        ctx.stroke();
        ctx.fillText("Wave Direction", arrowX + 20, arrowY - 15);
      } else {
        // Draw transverse wave (particles moving vertically)
        ctx.lineWidth = 3;
        ctx.strokeStyle = waveColor;
        ctx.beginPath();

        const amplitude = height / 4;
        const wavelength = width / 3; // 3 complete waves

        for (let x = 0; x < width; x++) {
          const y =
            height / 2 +
            amplitude * Math.sin(2 * Math.PI * (x / wavelength) + phase);

          if (x === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }

        ctx.stroke();

        // Draw particles along the wave
        const numParticles = 20;
        const particleSpacing = width / numParticles;

        for (let i = 0; i < numParticles; i++) {
          const x = i * particleSpacing;
          const y =
            height / 2 +
            amplitude * Math.sin(2 * Math.PI * (x / wavelength) + phase);

          // Draw particle
          ctx.beginPath();
          ctx.fillStyle = waveColor;
          ctx.arc(x, y, 5, 0, 2 * Math.PI);
          ctx.fill();

          // Draw vertical line to rest position
          ctx.strokeStyle = gridColor;
          ctx.beginPath();
          ctx.moveTo(x, height / 2);
          ctx.lineTo(x, y);
          ctx.stroke();
        }

        // Add labels
        ctx.font = "14px Arial";
        ctx.fillStyle = textColor;
        ctx.textAlign = "center";

        // Label wavelength
        const waveStart = width / 3;
        const waveEnd = (2 * width) / 3;

        ctx.beginPath();
        ctx.moveTo(waveStart, height - 30);
        ctx.lineTo(waveEnd, height - 30);
        ctx.stroke();

        // Add arrowheads
        ctx.beginPath();
        ctx.moveTo(waveStart, height - 30);
        ctx.lineTo(waveStart + 10, height - 25);
        ctx.moveTo(waveStart, height - 30);
        ctx.lineTo(waveStart + 10, height - 35);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(waveEnd, height - 30);
        ctx.lineTo(waveEnd - 10, height - 25);
        ctx.moveTo(waveEnd, height - 30);
        ctx.lineTo(waveEnd - 10, height - 35);
        ctx.stroke();

        ctx.fillText("One Wavelength", (waveStart + waveEnd) / 2, height - 10);

        // Direction of travel arrow
        const arrowX = width - 60;
        const arrowY = 30;
        ctx.beginPath();
        ctx.moveTo(arrowX, arrowY);
        ctx.lineTo(arrowX + 40, arrowY);
        ctx.lineTo(arrowX + 30, arrowY - 10);
        ctx.moveTo(arrowX + 40, arrowY);
        ctx.lineTo(arrowX + 30, arrowY + 10);
        ctx.stroke();
        ctx.fillText("Wave Direction", arrowX + 20, arrowY - 15);

        // Label amplitude
        const amplitudeX = 50;
        const amplitudeTopY = height / 2 - amplitude;

        ctx.beginPath();
        ctx.moveTo(amplitudeX, height / 2);
        ctx.lineTo(amplitudeX, amplitudeTopY);
        ctx.stroke();

        // Add arrowheads
        ctx.beginPath();
        ctx.moveTo(amplitudeX, height / 2);
        ctx.lineTo(amplitudeX - 5, height / 2 - 10);
        ctx.moveTo(amplitudeX, height / 2);
        ctx.lineTo(amplitudeX + 5, height / 2 - 10);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(amplitudeX, amplitudeTopY);
        ctx.lineTo(amplitudeX - 5, amplitudeTopY + 10);
        ctx.moveTo(amplitudeX, amplitudeTopY);
        ctx.lineTo(amplitudeX + 5, amplitudeTopY + 10);
        ctx.stroke();

        ctx.fillText("Amplitude", amplitudeX + 50, height / 2 - amplitude / 2);
      }
    };

    const animate = () => {
      phase += 0.03 * speed;
      drawWave();
      animationRef.current = requestAnimationFrame(animate);
    };

    if (isPlaying) {
      animationRef.current = requestAnimationFrame(animate);
    } else {
      drawWave();
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPlaying, waveType, speed]);

  const togglePlay = () => {
    setIsPlaying(!isPlaying);
  };

  return (
    <div className={styles["wave-visualizer"]}>
      <canvas
        ref={canvasRef}
        width={800}
        height={300}
        className={styles["wave-canvas"]}
      />

      <div className={styles.controls}>
        <div className={styles["control-group"]}>
          <label className={styles["control-label"]}>Wave Type</label>
          <div className={styles["button-group"]}>
            <Button onClick={() => setWaveType("longitudinal")}>
              Longitudinal (Sound)
            </Button>
            <Button onClick={() => setWaveType("transverse")} className="dark">
              Transverse (Comparison)
            </Button>
          </div>
        </div>

        <div
          className={`${styles["control-group"]} ${styles["speed-control"]}`}
        >
          <label className={styles["control-label"]}>Animation Speed</label>
          <input
            type="range"
            min="0.1"
            max="3"
            step="0.1"
            value={speed}
            onChange={(e) => setSpeed(parseFloat(e.target.value))}
            className={styles.slider}
          />
          <span className={styles["speed-value"]}>{speed.toFixed(1)}x</span>
        </div>

        <Button className={styles["play-button"]} onClick={togglePlay}>
          {isPlaying ? "Pause Animation" : "Start Animation"}
        </Button>
      </div>

      <div className={styles.explanation}>
        <p>
          {waveType === "longitudinal" ? (
            <>
              Sound waves are <strong>longitudinal waves</strong> where air
              molecules move back and forth in the same direction as the wave
              travels. Areas where molecules are compressed together (blue) are{" "}
              <strong>compressions</strong> (high pressure), while areas where
              molecules are spread apart (red) are <strong>rarefactions</strong>{" "}
              (low pressure).
            </>
          ) : (
            <>
              For comparison, this shows a <strong>transverse wave</strong>{" "}
              (like a wave on a string or water surface) where particles move
              perpendicular to the direction of travel. Sound waves don't look
              like this, but transverse waves are often used to visualize wave
              properties like wavelength and amplitude.
            </>
          )}
        </p>
      </div>
    </div>
  );
};

export default WaveVisualizer;
