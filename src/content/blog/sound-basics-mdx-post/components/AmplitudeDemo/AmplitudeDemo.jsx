import React, { useState, useRef, useEffect } from 'react';

const AmplitudeDemo = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [amplitude, setAmplitude] = useState(0.5);
  const [frequency, setFrequency] = useState(440);
  
  const audioContextRef = useRef(null);
  const oscillatorRef = useRef(null);
  const gainNodeRef = useRef(null);
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  
  // Common sounds and their approximate dB levels for comparison
  const soundComparisons = [
    { name: 'Threshold of Hearing', dB: 0, amplitude: 0.0001 },
    { name: 'Rustling Leaves', dB: 20, amplitude: 0.01 },
    { name: 'Whisper', dB: 30, amplitude: 0.03 },
    { name: 'Library', dB: 40, amplitude: 0.1 },
    { name: 'Normal Conversation', dB: 60, amplitude: 0.3 },
    { name: 'City Traffic', dB: 80, amplitude: 0.6 },
    { name: 'Lawn Mower', dB: 90, amplitude: 0.75 },
    { name: 'Rock Concert', dB: 110, amplitude: 0.9 },
    { name: 'Threshold of Pain', dB: 130, amplitude: 1.0 }
  ];
  
  // Convert linear amplitude (0-1) to dB (using a rough approximation)
  const amplitudeToDb = (amp) => {
    if (amp <= 0) return 0;
    return Math.round(20 * Math.log10(amp) + 100);
  };
  
  // Find the closest sound comparison
  const findClosestSound = () => {
    let closest = soundComparisons[0];
    let minDiff = Math.abs(amplitude - closest.amplitude);
    
    soundComparisons.forEach(sound => {
      const diff = Math.abs(amplitude - sound.amplitude);
      if (diff < minDiff) {
        minDiff = diff;
        closest = sound;
      }
    });
    
    return closest;
  };
  
  // Start or update oscillator
  const startOscillator = () => {
    // Create AudioContext if it doesn't exist
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
    }
    
    const audioContext = audioContextRef.current;
    
    // Stop current oscillator if it exists
    if (oscillatorRef.current) {
      oscillatorRef.current.stop();
      oscillatorRef.current.disconnect();
    }
    
    // Create gain node if it doesn't exist or reconnect it
    if (!gainNodeRef.current) {
      const gainNode = audioContext.createGain();
      gainNode.connect(audioContext.destination);
      gainNodeRef.current = gainNode;
    }
    
    // Set the gain (volume) based on amplitude
    // Using a safety cap to prevent very loud sounds
    gainNodeRef.current.gain.value = Math.min(amplitude, 0.5);
    
    // Create and configure oscillator
    const oscillator = audioContext.createOscillator();
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
    oscillator.connect(gainNodeRef.current);
    oscillator.start();
    oscillatorRef.current = oscillator;
    
    // Start visualization
    startVisualization();
    
    setIsPlaying(true);
  };
  
  // Stop oscillator
  const stopOscillator = () => {
    if (oscillatorRef.current) {
      oscillatorRef.current.stop();
      oscillatorRef.current.disconnect();
      oscillatorRef.current = null;
    }
    
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    
    setIsPlaying(false);
  };
  
  // Toggle play state
  const togglePlay = () => {
    if (isPlaying) {
      stopOscillator();
    } else {
      startOscillator();
    }
  };
  
  // Update amplitude while playing
  useEffect(() => {
    if (isPlaying && gainNodeRef.current && audioContextRef.current) {
      // Safety cap to prevent very loud sounds
      const safeAmplitude = Math.min(amplitude, 0.5);
      gainNodeRef.current.gain.setValueAtTime(
        safeAmplitude,
        audioContextRef.current.currentTime
      );
    }
  }, [amplitude, isPlaying]);
  
  // Draw amplitude visualization
  const startVisualization = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    
    let phase = 0;
    
    const draw = () => {
      // Clear canvas
      ctx.clearRect(0, 0, width, height);
      
      // Draw background
      ctx.fillStyle = '#f9fafb';
      ctx.fillRect(0, 0, width, height);
      
      // Draw center line
      ctx.strokeStyle = '#d1d5db';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, height / 2);
      ctx.lineTo(width, height / 2);
      ctx.stroke();
      
      // Draw waveform
      ctx.strokeStyle = '#4F46E5';
      ctx.lineWidth = 2;
      ctx.beginPath();
      
      // Calculate visual amplitude (scaled for visibility)
      const waveAmplitude = (height / 2 - 10) * amplitude;
      
      for (let x = 0; x < width; x++) {
        const ratio = x / width;
        const angle = ratio * Math.PI * 2 * 3 + phase; // 3 cycles
        const y = (height / 2) + Math.sin(angle) * waveAmplitude;
        
        if (x === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      
      ctx.stroke();
      
      // Draw amplitude visualization (vertical lines showing max amplitude)
      ctx.strokeStyle = '#ef4444'; // Red
      ctx.lineWidth = 1;
      ctx.setLineDash([5, 5]); // Dashed line
      
      // Top amplitude line
      ctx.beginPath();
      ctx.moveTo(0, height / 2 - waveAmplitude);
      ctx.lineTo(width, height / 2 - waveAmplitude);
      ctx.stroke();
      
      // Bottom amplitude line
      ctx.beginPath();
      ctx.moveTo(0, height / 2 + waveAmplitude);
      ctx.lineTo(width, height / 2 + waveAmplitude);
      ctx.stroke();
      
      // Reset line dash
      ctx.setLineDash([]);
      
      // Draw amplitude arrows
      ctx.strokeStyle = '#ef4444';
      ctx.beginPath();
      ctx.moveTo(width / 2, height / 2);
      ctx.lineTo(width / 2, height / 2 - waveAmplitude);
      ctx.stroke();
      
      // Arrow head
      ctx.beginPath();
      ctx.moveTo(width / 2, height / 2 - waveAmplitude);
      ctx.lineTo(width / 2 - 5, height / 2 - waveAmplitude + 10);
      ctx.lineTo(width / 2 + 5, height / 2 - waveAmplitude + 10);
      ctx.closePath();
      ctx.fillStyle = '#ef4444';
      ctx.fill();
      
      // Draw labels
      ctx.font = '14px Arial';
      ctx.fillStyle = '#1f2937';
      ctx.textAlign = 'center';
      
      // dB value
      const dB = amplitudeToDb(amplitude);
      ctx.fillText(`${dB} dB`, width / 2, 30);
      
      // Amplitude label
      ctx.fillStyle = '#ef4444';
      ctx.fillText('Amplitude', width / 2 + 30, height / 2 - waveAmplitude / 2);
      
      // Update phase for animation
      phase += 0.05;
      
      animationRef.current = requestAnimationFrame(draw);
    };
    
    draw();
  };
  
  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (oscillatorRef.current) {
        oscillatorRef.current.stop();
        oscillatorRef.current.disconnect();
      }
      
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);
  
  // Get closest sound comparison
  const closestSound = findClosestSound();
  
  return (
    <div className="amplitude-demo">
      <div className="visualization-container">
        <canvas
          ref={canvasRef}
          width={800}
          height={200}
          className="amplitude-canvas"
        />
      </div>
      
      <div className="amplitude-controls">
        <div className="slider-container">
          <label className="control-label">Amplitude</label>
          <input
            type="range"
            min="0.0001"
            max="1"
            step="0.001"
            value={amplitude}
            onChange={(e) => setAmplitude(parseFloat(e.target.value))}
            className="slider"
          />
          
          <div className="value-display">
            <span>Amplitude: {amplitude.toFixed(2)}</span>
            <span>Approximate: {amplitudeToDb(amplitude)} dB</span>
          </div>
        </div>
        
        <div className="frequency-container">
          <label className="control-label">Frequency</label>
          <div className="frequency-buttons">
            <button 
              className={frequency === 110 ? 'selected' : ''}
              onClick={() => setFrequency(110)}
            >
              Low (110 Hz)
            </button>
            <button 
              className={frequency === 440 ? 'selected' : ''}
              onClick={() => setFrequency(440)}
            >
              Medium (440 Hz)
            </button>
            <button 
              className={frequency === 1760 ? 'selected' : ''}
              onClick={() => setFrequency(1760)}
            >
              High (1760 Hz)
            </button>
          </div>
        </div>
        
        <button
          onClick={togglePlay}
          className="play-button"
        >
          {isPlaying ? 'Stop Sound' : 'Play Sound'}
        </button>
      </div>
      
      <div className="sound-comparisons">
        <h3>Sound Level Comparison</h3>
        <div className="comparison-scale">
          {soundComparisons.map((sound, index) => (
            <div 
              key={index}
              className={`comparison-item ${sound.name === closestSound.name ? 'current' : ''}`}
              style={{
                left: `${Math.min(100, Math.max(0, (sound.dB / 130) * 100))}%`
              }}
            >
              <div className="comparison-marker"></div>
              <div className="comparison-label">
                <div className="comparison-db">{sound.dB} dB</div>
                <div className="comparison-name">{sound.name}</div>
              </div>
            </div>
          ))}
          
          <div 
            className="current-marker" 
            style={{
              left: `${Math.min(100, Math.max(0, (amplitudeToDb(amplitude) / 130) * 100))}%`
            }}
          ></div>
        </div>
      </div>
      
      <div className="amplitude-info">
        <p>
          <strong>Amplitude</strong> refers to the magnitude of a sound wave's pressure variation. 
          It determines how loud a sound is perceived. We typically measure sound intensity in 
          decibels (dB), which is a logarithmic scale that better matches how our ears perceive loudness.
        </p>
        <p>
          The current amplitude ({amplitude.toFixed(2)}) corresponds to approximately <strong>{amplitudeToDb(amplitude)} dB</strong>, 
          which is similar to a <strong>{closestSound.name}</strong> in loudness.
        </p>
        <div className="info-facts">
          <div className="info-fact">
            <div className="fact-title">Logarithmic Scale</div>
            <div className="fact-desc">A 10 dB increase represents approximately a doubling of perceived loudness.</div>
          </div>
          <div className="info-fact">
            <div className="fact-title">Hearing Damage</div>
            <div className="fact-desc">Prolonged exposure to sounds above 85 dB can cause hearing damage.</div>
          </div>
          <div className="info-fact">
            <div className="fact-title">Dynamic Range</div>
            <div className="fact-desc">The human ear can detect sounds across a remarkable range of about 130 dB.</div>
          </div>
        </div>
      </div>
      
      <style jsx>{`
        .amplitude-demo {
          background-color: white;
          border-radius: 8px;
          padding: 20px;
          margin: 24px 0;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }
        
        .visualization-container {
          margin-bottom: 20px;
        }
        
        .amplitude-canvas {
          width: 100%;
          height: 200px;
          background-color: #f9fafb;
          border-radius: 8px;
        }
        
        .amplitude-controls {
          display: flex;
          flex-wrap: wrap;
          gap: 16px;
          align-items: flex-end;
          margin-bottom: 20px;
        }
        
        .slider-container {
          flex: 2;
          min-width: 200px;
        }
        
        .frequency-container {
          flex: 1;
          min-width: 200px;
        }
        
        .control-label {
          display: block;
          font-size: 14px;
          font-weight: 500;
          color: #4b5563;
          margin-bottom: 8px;
        }
        
        .slider {
          width: 100%;
          height: 6px;
          -webkit-appearance: none;
          appearance: none;
          background: linear-gradient(to right, #d1d5db, #4F46E5);
          border-radius: 3px;
          outline: none;
          margin-bottom: 8px;
        }
        
        .slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 16px;
          height: 16px;
          background: #4F46E5;
          border-radius: 50%;
          cursor: pointer;
        }
        
        .slider::-moz-range-thumb {
          width: 16px;
          height: 16px;
          background: #4F46E5;
          border-radius: 50%;
          cursor: pointer;
        }
        
        .value-display {
          display: flex;
          justify-content: space-between;
          font-size: 13px;
          color: #6b7280;
        }
        
        .frequency-buttons {
          display: flex;
          gap: 8px;
        }
        
        .frequency-buttons button {
          flex: 1;
          padding: 8px;
          background-color: #f3f4f6;
          border: none;
          border-radius: 4px;
          font-size: 13px;
          color: #4b5563;
          cursor: pointer;
          transition: all 0.2s;
        }
        
        .frequency-buttons button:hover {
          background-color: #e5e7eb;
        }
        
        .frequency-buttons button.selected {
          background-color: #4F46E5;
          color: white;
        }
        
        .play-button {
          padding: 10px 16px;
          background-color: #4F46E5;
          color: white;
          border: none;
          border-radius: 4px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: background-color 0.2s;
          margin-bottom: 2px;
        }
        
        .play-button:hover {
          background-color: #4338ca;
        }
        
        .sound-comparisons {
          background-color: #f3f4f6;
          padding: 16px;
          border-radius: 8px;
          margin-bottom: 20px;
        }
        
        .sound-comparisons h3 {
          font-size: 16px;
          font-weight: 600;
          margin-top: 0;
          margin-bottom: 12px;
          color: #4b5563;
        }
        
        .comparison-scale {
          position: relative;
          height: 100px;
          background: linear-gradient(to right, #10b981, #f59e0b, #ef4444);
          border-radius: 4px;
          margin-bottom: 8px;
        }
        
        .comparison-item {
          position: absolute;
          transform: translateX(-50%);
        }
        
        .comparison-marker {
          width: 2px;
          height: 10px;
          background-color: #1f2937;
          margin: 0 auto;
        }
        
        .comparison-label {
          padding-top: 4px;
          text-align: center;
          font-size: 11px;
          color: #4b5563;
          width: 80px;
          transform: translateX(-50%);
        }
        
        .comparison-db {
          font-weight: bold;
        }
        
        .comparison-name {
          font-size: 10px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        
        .comparison-item.current .comparison-label {
          color: #1f2937;
          font-weight: bold;
        }
        
        .current-marker {
          position: absolute;
          top: 0;
          width: 4px;
          height: 100%;
          background-color: #1f2937;
          transform: translateX(-50%);
        }
        
        .amplitude-info {
          background-color: #f9fafb;
          padding: 16px;
          border-radius: 6px;
        }
        
        .amplitude-info p {
          margin: 0 0 12px 0;
          font-size: 14px;
          line-height: 1.5;
          color: #4b5563;
        }
        
        .info-facts {
          display: flex;
          flex-wrap: wrap;
          gap: 16px;
          margin-top: 16px;
        }
        
        .info-fact {
          flex: 1;
          min-width: 200px;
          background-color: white;
          padding: 12px;
          border-radius: 6px;
          border-left: 3px solid #4F46E5;
        }
        
        .fact-title {
          font-weight: 600;
          font-size: 14px;
          color: #4b5563;
          margin-bottom: 4px;
        }
        
        .fact-desc {
          font-size: 13px;
          color: #6b7280;
        }
      `}</style>
    </div>
  );
};

export default AmplitudeDemo;