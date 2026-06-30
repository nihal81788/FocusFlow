import React from 'react';
import TimerDisplay from './components/TimerDisplay';
import './App.css';

function App() {
  return (
    <div style={appStyle}>
      <h1 style={{ marginBottom: '2rem', color: '#fff' }}>FLOWSTATE</h1>
      <TimerDisplay />
    </div>
  );
}

const appStyle = {
  minHeight: '100vh',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: '#1a1a1a',
  fontFamily: 'sans-serif'
};

export default App;
