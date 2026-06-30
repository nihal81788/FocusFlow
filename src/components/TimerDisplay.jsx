import React from 'react';
import { usePomodoroTimer } from '../hooks/usePomodoroTimer';

export default function TimerDisplay() {
  const {
    timeRemaining,
    currentMode,
    isRunning,
    start,
    pause,
    reset,
    skipToNext
  } = usePomodoroTimer();

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const getModeLabel = (mode) => {
    switch(mode) {
      case 'work': return 'Work Session';
      case 'shortBreak': return 'Short Break';
      case 'longBreak': return 'Long Break';
      default: return 'Timer';
    }
  };

  return (
    <div style={containerStyle}>
      <h2 style={modeStyle}>{getModeLabel(currentMode)}</h2>
      
      <div style={timeStyle}>
        {formatTime(timeRemaining)}
      </div>
      
      <div style={controlsStyle}>
        {!isRunning ? (
          <button onClick={start} style={btnStyle}>Start</button>
        ) : (
          <button onClick={pause} style={btnStyle}>Pause</button>
        )}
        <button onClick={reset} style={btnStyle}>Reset</button>
        <button onClick={skipToNext} style={btnStyle}>Skip</button>
      </div>
    </div>
  );
}

const containerStyle = {
  textAlign: 'center',
  padding: '2rem',
  background: '#333',
  borderRadius: '12px',
  boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
  minWidth: '300px'
};

const modeStyle = {
  margin: '0 0 1rem 0',
  color: '#aaa',
  fontSize: '1.2rem',
  textTransform: 'uppercase',
  letterSpacing: '1px'
};

const timeStyle = {
  fontSize: '5rem',
  margin: '1rem 0',
  fontWeight: 'bold',
  fontFamily: 'monospace',
  color: '#fff'
};

const controlsStyle = {
  display: 'flex',
  gap: '10px',
  justifyContent: 'center',
  marginTop: '1.5rem'
};

const btnStyle = {
  padding: '10px 20px',
  fontSize: '1rem',
  cursor: 'pointer',
  border: 'none',
  borderRadius: '6px',
  background: '#555',
  color: 'white',
  fontWeight: '600',
  transition: 'background 0.2s'
};
